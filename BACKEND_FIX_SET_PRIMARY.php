<?php
/**
 * =========================================
 * FIX DEFINITIVO: setPrimary debe aceptar
 * media de 'gallery' Y de 'library'
 * =========================================
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\UploadLibraryMediaRequest;
use App\Http\Requests\Media\AttachFromLibraryRequest;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Media\Media as SpatieMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class BranchMediaController extends Controller
{
    // ... otros métodos sin cambios ...

    /**
     * ✅ MÉTODO CORREGIDO
     * 
     * Establece un media como imagen principal del modelo.
     * Acepta media de CUALQUIER colección (gallery, library, etc.)
     */
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
            // ✅ Buscar media sin filtrar por collection_name
            // Acepta media de gallery, library, o cualquier otra colección
            $media = SpatieMedia::where('branch_id', $branch->id)
                ->where('id', $mediaId)
                ->first();

            if (!$media) {
                // Mostrar IDs disponibles para debug
                $availableIds = SpatieMedia::where('branch_id', $branch->id)
                    ->where('model_type', get_class($model))
                    ->where('model_id', $model->id)
                    ->get()
                    ->map(fn($m) => [
                        'id' => $m->id,
                        'collection' => $m->collection_name,
                        'file' => $m->file_name,
                    ])
                    ->toArray();

                Log::error('Media not found', [
                    'requested_id' => $mediaId,
                    'branch_id' => $branch->id,
                    'available_media' => $availableIds,
                ]);
                
                return response()->json([
                    'error' => 'Media no encontrado',
                    'message' => "La imagen con ID {$mediaId} no existe en esta sucursal",
                    'requested_id' => $mediaId,
                    'available_media' => $availableIds,
                ], 404);
            }

            // Verificar que el media pertenece al modelo correcto
            if ($media->model_type !== get_class($model) || $media->model_id !== $model->id) {
                Log::warning('Media does not belong to this model', [
                    'media_id' => $mediaId,
                    'media_model_type' => $media->model_type,
                    'media_model_id' => $media->model_id,
                    'expected_model_type' => get_class($model),
                    'expected_model_id' => $model->id,
                ]);
            }

            Log::info('Media found for setPrimary', [
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

            // 1. Limpiar colección principal actual
            $model->clearMediaCollection($primaryCollection);
            Log::info('Cleared primary collection', [
                'collection' => $primaryCollection,
                'model' => get_class($model),
                'model_id' => $model->id,
            ]);

            // 2. Obtener path del archivo
            $disk = $media->disk;
            $fullPath = $media->getPath();
            
            // Calcular path relativo
            $diskPath = Storage::disk($disk)->path('');
            $relativePath = str_replace($diskPath, '', $fullPath);
            $relativePath = ltrim($relativePath, '/\\');

            Log::info('File paths', [
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

            // 3. Leer archivo como stream
            $stream = Storage::disk($disk)->readStream($relativePath);
            
            if ($stream === false) {
                return response()->json([
                    'error' => 'No se pudo leer el archivo'
                ], 500);
            }

            // 4. Copiar a colección principal
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

            Log::info('Created new main media', [
                'new_id' => $newMain->id,
                'collection' => $primaryCollection,
                'original_collection' => $media->collection_name,
            ]);

            // 5. Eliminar de gallery SOLO si venía de gallery
            if ($media->collection_name === 'gallery') {
                $oldId = $media->id;
                $media->delete();
                Log::info('Deleted from gallery', [
                    'old_id' => $oldId,
                    'reason' => 'Moved to main collection',
                ]);
            } else {
                Log::info('Media kept in original collection', [
                    'media_id' => $media->id,
                    'collection' => $media->collection_name,
                    'reason' => 'Not from gallery',
                ]);
            }

            // 6. Recargar modelo con relaciones
            $model = $model->fresh()->load(['brand', 'categories']);

            // Verificar resultado
            $mainMedia = $model->getFirstMedia($primaryCollection);
            $galleryCount = $model->getMedia('gallery')->count();

            Log::info('setPrimary completed', [
                'model_id' => $model->id,
                'has_main' => $mainMedia !== null,
                'main_id' => $mainMedia?->id,
                'gallery_count' => $galleryCount,
            ]);

            // 7. Devolver según tipo
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
                'model_type' => $type,
                'model_id' => $id,
            ]);

            return response()->json([
                'error' => 'Error interno',
                'message' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * ✅ attachFromLibraryCore mantiene el filtro de 'library'
     * porque este método sí debe trabajar solo con la biblioteca
     */
    private function attachFromLibraryCore(Branch $branch, string $type, int $id, int $libraryMediaId, string $collection = 'gallery', int $sort = 0, ?string $alt = null) 
    {
        $model = match ($type) {
            'products'   => Product::findOrFail($id),
            'brands'     => Brand::findOrFail($id),
            'categories' => Category::findOrFail($id),
            default      => abort(404, 'Tipo no soportado'),
        };
        $this->authorize('update', $model);

        // ✅ Este SÍ debe filtrar por 'library' porque es para adjuntar desde biblioteca
        $asset = SpatieMedia::where('branch_id', $branch->id)
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

    // ... resto de métodos sin cambios ...
}
