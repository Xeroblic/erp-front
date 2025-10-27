<?php
/**
 * ========================================
 * FIX: Imports incorrectos en tu controller
 * ========================================
 * 
 * PROBLEMA:
 * use App\Models\Media\Media as SpatieMedia; ❌
 * 
 * Esta clase NO ES de Spatie, es tuya.
 * El modelo real de Spatie es otro.
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\UploadLibraryMediaRequest;
use App\Http\Requests\Media\AttachFromLibraryRequest;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
// ❌ INCORRECTO: use App\Models\Media\Media as SpatieMedia;
// ✅ CORRECTO:
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class BranchMediaController extends Controller
{
    // ... resto de métodos igual

    public function listLibrary(Request $request, Branch $branch)
    {
        $this->authorize('view', $branch);

        $q     = $request->string('q')->toString();
        $tag   = $request->string('tag')->toString();
        $scope = $request->query('scope', 'library');

        // ✅ Ahora usa el modelo correcto de Spatie
        $query = Media::query()
            ->where('branch_id', $branch->id);

        if ($scope === 'library') {
            $query->where('collection_name', 'library');
        }

        if ($q !== '') {
            $query->where(function($w) use ($q) {
                $w->where('file_name','like',"%{$q}%")
                ->orWhere('name','like',"%{$q}%")
                ->orWhere('custom_properties->alt','like',"%{$q}%");
            });
        }
        if ($tag !== '') {
            $query->whereJsonContains('custom_properties->tags', $tag);
        }

        $media = $query->latest()->paginate(24);

        return response()->json([
            'data' => $media->map(fn($m) => [
                'id' => $m->id,
                'owner' => class_basename($m->model_type),
                'collection' => $m->collection_name,
                'thumb_url' => $m->getUrl('thumb'),
                'url' => $m->getUrl(),
                'alt' => $m->getCustomProperty('alt'),
                'tags' => $m->getCustomProperty('tags', []),
                'file_name' => $m->file_name,
                'size' => $m->size,
                'mime_type' => $m->mime_type,
            ]),
            'meta' => [
                'current_page' => $media->currentPage(),
                'last_page'    => $media->lastPage(),
                'total'        => $media->total(),
            ]
        ]);
    }

    public function setPrimary(Request $request, Branch $branch, string $type, int $id)
    {
        $data = $request->validate([
            'library_media_id' => ['required','integer'],
            'alt_text'         => ['nullable','string','max:255'],
        ]);

        $model = match ($type) {
            'products'   => Product::findOrFail($id),
            'brands'     => Brand::findOrFail($id),
            'categories' => Category::findOrFail($id),
            default      => abort(404, 'Tipo no soportado'),
        };

        $this->authorize('update', $model);

        $mediaId = (int)$data['library_media_id'];

        try {
            // ✅ Buscar en el modelo correcto de Spatie
            $media = Media::find($mediaId);

            if (!$media) {
                Log::error('Media not found', [
                    'media_id' => $mediaId,
                    'branch_id' => $branch->id,
                    'all_media_ids' => Media::where('branch_id', $branch->id)->pluck('id')->toArray(),
                ]);
                
                return response()->json([
                    'error' => 'Media no encontrado',
                    'message' => "La imagen con ID {$mediaId} no existe",
                    'media_id' => $mediaId,
                    'branch_id' => $branch->id,
                ], 404);
            }

            // Verificar branch
            if ($media->branch_id != $branch->id) {
                Log::warning('Media branch mismatch', [
                    'media_id' => $mediaId,
                    'media_branch_id' => $media->branch_id,
                    'requested_branch_id' => $branch->id,
                ]);
                
                return response()->json([
                    'error' => 'Media no pertenece a esta sucursal',
                    'message' => 'No tienes permiso para usar esta imagen'
                ], 403);
            }

            Log::info('Media found successfully', [
                'media_id' => $media->id,
                'collection' => $media->collection_name,
                'file_name' => $media->file_name,
                'branch_id' => $media->branch_id,
            ]);

            // Determinar colección principal
            $primaryCollection = match ($type) {
                'products'   => 'main',
                'brands'     => 'logo',
                'categories' => 'banner',
            };

            // 1. Limpiar colección principal
            $model->clearMediaCollection($primaryCollection);
            Log::info('Cleared primary collection', ['collection' => $primaryCollection]);

            // 2. Copiar archivo
            $disk = $media->disk;
            $fullPath = $media->getPath();
            
            // Calcular path relativo
            $diskPath = Storage::disk($disk)->path('');
            $relativePath = str_replace($diskPath, '', $fullPath);
            $relativePath = ltrim($relativePath, '/\\');

            Log::info('File paths calculated', [
                'disk' => $disk,
                'relative_path' => $relativePath,
                'exists' => Storage::disk($disk)->exists($relativePath),
            ]);

            if (!Storage::disk($disk)->exists($relativePath)) {
                return response()->json([
                    'error' => 'Archivo no encontrado en disco',
                    'path' => $relativePath
                ], 500);
            }

            $stream = Storage::disk($disk)->readStream($relativePath);
            
            if ($stream === false) {
                return response()->json([
                    'error' => 'No se pudo leer el archivo'
                ], 500);
            }

            // 3. Crear nuevo media en colección principal
            $newMain = $model->addMediaFromStream($stream)
                ->usingFileName($media->file_name)
                ->withCustomProperties([
                    'branch_id' => $branch->id,
                    'alt' => $data['alt_text'] ?? $media->getCustomProperty('alt', 'Imagen principal'),
                    'src_media_id' => $media->id,
                    'src_collection' => $media->collection_name,
                    'moved_at' => now()->toISOString(),
                ])
                ->toMediaCollection($primaryCollection);

            $newMain->branch_id = $branch->id;
            $newMain->save();

            Log::info('New main media created', [
                'new_id' => $newMain->id,
                'collection' => $primaryCollection,
            ]);

            // 4. Eliminar de gallery SOLO si venía de ahí
            if ($media->collection_name === 'gallery') {
                $oldId = $media->id;
                $media->delete();
                Log::info('Deleted from gallery', ['old_id' => $oldId]);
            }

            // 5. Recargar y devolver
            $model = $model->fresh()->load(['brand', 'categories']);

            return match ($type) {
                'products' => \App\Http\Resources\ProductResource::make($model),
                'brands' => response()->json(['status' => 'success', 'data' => $model]),
                'categories' => response()->json(['status' => 'success', 'data' => $model]),
            };

        } catch (\Exception $e) {
            Log::error('setPrimary failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'media_id' => $mediaId,
                'branch_id' => $branch->id,
            ]);

            return response()->json([
                'error' => 'Error interno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function attachFromLibraryCore(Branch $branch, string $type, int $id, int $libraryMediaId, string $collection = 'gallery', int $sort = 0, ?string $alt = null) 
    {
        $model = match ($type) {
            'products'   => Product::findOrFail($id),
            'brands'     => Brand::findOrFail($id),
            'categories' => Category::findOrFail($id),
            default      => abort(404, 'Tipo no soportado'),
        };
        $this->authorize('update', $model);

        // ✅ Buscar en el modelo correcto de Spatie
        $asset = Media::where('branch_id', $branch->id)
            ->where('collection_name','library')
            ->findOrFail($libraryMediaId);

        $relative = method_exists($asset, 'getPathRelativeToRoot')
            ? $asset->getPathRelativeToRoot()
            : ltrim(str_replace(Storage::disk($asset->disk)->path(''), '', $asset->getPath()), '/');

        $stream = Storage::disk($asset->disk)->readStream($relative);
        abort_if($stream === false, 500, 'No se pudo leer el archivo origen desde el disco.');

        $new = $model->addMediaFromStream($stream)
            ->usingFileName($asset->file_name)
            ->withCustomProperties([
                'branch_id' => $branch->id,
                'alt'  => $alt ?? $asset->getCustomProperty('alt'),
                'sort' => $sort,
                'src_library_id' => $asset->id,
            ])
            ->toMediaCollection($collection);

        $new->branch_id = $branch->id;
        $new->save();

        return response()->json([
            'status'    => 'attached',
            'id'        => $new->id,
            'url'       => $new->getUrl(),
            'thumb_url' => $new->getUrl('thumb'),
        ], 201);
    }

    // DELETE /api/branches/{branch}/media/{id}
    public function destroy(Branch $branch, int $id)
    {
        // ✅ Buscar en el modelo correcto de Spatie
        $media = Media::where('branch_id', $branch->id)->findOrFail($id);
        
        // Verificar permisos del modelo propietario
        if ($media->model_type && $media->model_id) {
            $owner = $media->model;
            if ($owner) {
                $this->authorize('update', $owner);
            }
        }
        
        $media->delete();
        
        return response()->json(['status' => 'deleted']);
    }

    public function deleteBatch(Request $request, Branch $branch, string $type, int $id)
    {
        $data = $request->validate([
            'ids'   => ['required','array','min:1'],
            'ids.*' => ['integer','exists:media,id'],
        ]);

        $deleted = 0;
        // ✅ Buscar en el modelo correcto de Spatie
        $items = Media::whereIn('id', $data['ids'])
            ->where('branch_id', $branch->id)
            ->get();

        foreach ($items as $m) {
            $m->delete();
            $deleted++;
        }

        return response()->json(['status' => 'deleted', 'count' => $deleted]);
    }
}
