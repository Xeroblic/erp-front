<?php
/**
 * FIX DEFINITIVO PARA setPrimary
 * 
 * El problema es que estás usando App\Models\Media\Media
 * pero Spatie usa Spatie\MediaLibrary\MediaCollections\Models\Media
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
// ✅ IMPORTANTE: Usar el modelo correcto de Spatie
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BranchMediaController extends Controller
{
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
            // ✅ Buscar el media SIN filtrar por branch_id primero
            // porque puede estar en otra tabla si usas App\Models\Media\Media
            $media = Media::find($mediaId);

            if (!$media) {
                Log::error('Media not found', [
                    'media_id' => $mediaId,
                    'branch_id' => $branch->id
                ]);
                
                return response()->json([
                    'error' => 'Media no encontrado',
                    'message' => 'La imagen que intentas establecer como principal no existe',
                    'media_id' => $mediaId,
                ], 404);
            }

            // ✅ Verificar que el media pertenece a esta branch
            if ($media->branch_id != $branch->id) {
                return response()->json([
                    'error' => 'Media no pertenece a esta sucursal',
                    'message' => 'No tienes permiso para usar esta imagen'
                ], 403);
            }

            Log::info('Media found', [
                'media_id' => $media->id,
                'collection' => $media->collection_name,
                'file_name' => $media->file_name,
                'model_type' => $media->model_type,
                'model_id' => $media->model_id,
            ]);

            // Determinar colección principal
            $primaryCollection = match ($type) {
                'products'   => 'main',
                'brands'     => 'logo',
                'categories' => 'banner',
            };

            // 1. Limpiar colección principal actual
            $model->clearMediaCollection($primaryCollection);
            Log::info('Cleared primary collection', ['collection' => $primaryCollection]);

            // 2. Obtener path del archivo
            try {
                $disk = $media->disk;
                $fullPath = $media->getPath();
                
                // Calcular path relativo
                $diskPath = Storage::disk($disk)->path('');
                $relativePath = str_replace($diskPath, '', $fullPath);
                $relativePath = ltrim($relativePath, '/\\');

                Log::info('File paths', [
                    'disk' => $disk,
                    'full_path' => $fullPath,
                    'disk_path' => $diskPath,
                    'relative_path' => $relativePath,
                ]);

                // 3. Leer archivo como stream
                if (!Storage::disk($disk)->exists($relativePath)) {
                    Log::error('File does not exist', ['path' => $relativePath]);
                    return response()->json([
                        'error' => 'Archivo no encontrado en disco',
                        'path' => $relativePath
                    ], 500);
                }

                $stream = Storage::disk($disk)->readStream($relativePath);
                
                if ($stream === false) {
                    Log::error('Could not read file', ['path' => $relativePath]);
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
                ]);

                // 5. Eliminar de gallery SOLO si venía de ahí
                if ($media->collection_name === 'gallery') {
                    $oldId = $media->id;
                    $media->delete();
                    Log::info('Deleted from gallery', ['old_id' => $oldId]);
                }

            } catch (\Exception $e) {
                Log::error('Error processing file', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                
                return response()->json([
                    'error' => 'Error al procesar el archivo',
                    'message' => $e->getMessage()
                ], 500);
            }

            // 6. Recargar modelo con relaciones
            $model = $model->fresh()->load(['brand', 'categories']);

            // Verificar que se creó correctamente
            $mainMedia = $model->getFirstMedia($primaryCollection);
            $galleryCount = $model->getMedia('gallery')->count();

            Log::info('Final state', [
                'model_id' => $model->id,
                'has_main' => $mainMedia !== null,
                'main_id' => $mainMedia?->id,
                'gallery_count' => $galleryCount,
            ]);

            // 7. Devolver según tipo
            return match ($type) {
                'products' => ProductResource::make($model),
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

    // ✅ TAMBIÉN CORREGIR destroy()
    public function destroy(Branch $branch, int $id)
    {
        try {
            // Buscar media sin filtro de branch primero
            $media = Media::find($id);

            if (!$media) {
                return response()->json([
                    'error' => 'Media no encontrado',
                    'message' => 'La imagen que intentas eliminar no existe'
                ], 404);
            }

            // Verificar branch
            if ($media->branch_id != $branch->id) {
                return response()->json([
                    'error' => 'No tienes permiso',
                    'message' => 'Esta imagen no pertenece a tu sucursal'
                ], 403);
            }

            // Verificar permisos del modelo propietario
            if ($media->model_type && $media->model_id) {
                $owner = $media->model;
                if ($owner) {
                    $this->authorize('update', $owner);
                }
            }

            $collection = $media->collection_name;
            $fileName = $media->file_name;
            
            $media->delete();
            
            Log::info('Media deleted', [
                'id' => $id,
                'collection' => $collection,
                'file_name' => $fileName,
            ]);
            
            return response()->json([
                'status' => 'deleted',
                'message' => 'Imagen eliminada correctamente'
            ]);

        } catch (\Exception $e) {
            Log::error('destroy failed', [
                'error' => $e->getMessage(),
                'media_id' => $id,
            ]);

            return response()->json([
                'error' => 'Error al eliminar',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

/**
 * ==========================================
 * IMPORTANTE: Verificar tabla 'media'
 * ==========================================
 * 
 * Ejecuta en MySQL/PostgreSQL:
 */

/*
-- Ver todos los media de la branch 1
SELECT id, model_type, model_id, collection_name, file_name, branch_id 
FROM media 
WHERE branch_id = 1 
ORDER BY id DESC;

-- Si branch_id es NULL, actualizar:
UPDATE media SET branch_id = 1 WHERE model_type = 'App\\Models\\Product' AND model_id = 1;

-- Ver media del producto 1
SELECT id, collection_name, file_name, branch_id 
FROM media 
WHERE model_type = 'App\\Models\\Product' 
AND model_id = 1;
*/

/**
 * ==========================================
 * Testing en Tinker
 * ==========================================
 */

/*
php artisan tinker

use Spatie\MediaLibrary\MediaCollections\Models\Media;
use App\Models\Product;

// Ver todos los media del producto 1
$media = Media::where('model_type', 'App\\Models\\Product')
    ->where('model_id', 1)
    ->get();

dump($media->map(fn($m) => [
    'id' => $m->id,
    'collection' => $m->collection_name,
    'file' => $m->file_name,
    'branch_id' => $m->branch_id,
])->toArray());

// Ver uno específico
$m = Media::find(2);
if ($m) {
    dump([
        'id' => $m->id,
        'collection' => $m->collection_name,
        'branch_id' => $m->branch_id,
        'exists' => \Storage::disk($m->disk)->exists($m->getPathRelativeToRoot()),
    ]);
}
*/
