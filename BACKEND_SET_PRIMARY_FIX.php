<?php
/**
 * AGREGAR ESTOS MÉTODOS AL BranchMediaController
 * Archivo: app/Http/Controllers/Api/BranchMediaController.php
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
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BranchMediaController extends Controller
{
    // ... métodos existentes ...

    /**
     * Establecer una imagen YA EXISTENTE de gallery como principal
     * POST /api/branches/{branch}/products/{id}/media/set-primary
     * 
     * Body: { "library_media_id": 2 }  (en este caso es el media_id de gallery, no library)
     */
    public function setPrimary(Request $request, Branch $branch, string $type, int $id)
    {
        $data = $request->validate([
            'library_media_id' => ['required','integer','exists:media,id'],
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

        // Buscar el media - puede estar en 'library' o en 'gallery'
        $media = Media::where('branch_id', $branch->id)
            ->where('id', $mediaId)
            ->first();

        if (!$media) {
            return response()->json([
                'error' => 'Media no encontrado',
                'message' => 'El archivo que intentas establecer como principal no existe'
            ], 404);
        }

        // Determinar colección principal según el tipo
        $primaryCollection = match ($type) {
            'products'   => 'main',
            'brands'     => 'logo',
            'categories' => 'banner',
        };

        // 1. Limpiar colección principal actual
        $model->clearMediaCollection($primaryCollection);

        // 2. Obtener ruta del archivo
        $disk = $media->disk;
        $path = $media->getPath();
        $basePath = Storage::disk($disk)->path('');
        $relativePath = ltrim(str_replace($basePath, '', $path), '/\\');

        // 3. Leer archivo como stream
        $stream = Storage::disk($disk)->readStream($relativePath);
        
        if ($stream === false) {
            return response()->json([
                'error' => 'Error al leer archivo',
                'message' => 'No se pudo leer el archivo de origen'
            ], 500);
        }

        // 4. Copiar a colección principal
        $newMain = $model->addMediaFromStream($stream)
            ->usingFileName($media->file_name)
            ->withCustomProperties([
                'branch_id' => $branch->id,
                'alt' => $data['alt_text'] ?? $media->getCustomProperty('alt', 'Imagen principal'),
                'src_media_id' => $media->id,
                'moved_at' => now()->toISOString(),
            ])
            ->toMediaCollection($primaryCollection);

        $newMain->branch_id = $branch->id;
        $newMain->save();

        // 5. Si el media original estaba en 'gallery', eliminarlo
        if ($media->collection_name === 'gallery') {
            $media->delete();
        }

        // 6. Devolver modelo actualizado según el tipo
        $model = $model->fresh()->load(['brand', 'categories']);

        return match ($type) {
            'products' => ProductResource::make($model),
            default => response()->json([
                'status' => 'success',
                'data' => $model,
                'message' => 'Imagen establecida como principal correctamente'
            ]),
        };
    }

    /**
     * SOBRESCRIBIR destroy() para que funcione con cualquier media
     * DELETE /api/branches/{branch}/media/{id}
     */
    public function destroy(Branch $branch, int $id)
    {
        $media = Media::where('branch_id', $branch->id)->findOrFail($id);
        
        // Obtener el modelo propietario para verificar permisos
        if ($media->model_type && $media->model_id) {
            $owner = $media->model;
            if ($owner) {
                $this->authorize('update', $owner);
            }
        }
        
        $media->delete();
        
        return response()->json([
            'status' => 'deleted',
            'message' => 'Imagen eliminada correctamente'
        ]);
    }
}

/**
 * ==========================================
 * VERIFICAR QUE LAS RUTAS ESTÉN EN routes/api.php
 * ==========================================
 */

/*
Route::middleware(['auth:api'])->group(function () {
    
    // ✅ IMPORTANTE: Estas rutas DEBEN estar en este orden
    
    // Establecer imagen principal (desde gallery o library)
    Route::post('/branches/{branch}/{type}/{id}/media/set-primary', 
        [BranchMediaController::class, 'setPrimary'])
        ->whereIn('type', ['products','brands','categories'])
        ->whereNumber('id')
        ->name('branches.media.setPrimary');
    
    // Eliminar media por ID
    Route::delete('/branches/{branch}/media/{id}', 
        [BranchMediaController::class, 'destroy'])
        ->whereNumber('id')
        ->name('branches.media.destroy');
    
    // ... resto de rutas existentes ...
});
*/

/**
 * ==========================================
 * TESTING
 * ==========================================
 */

/*
# 1. Establecer imagen de gallery como principal
curl -X POST "http://localhost:8000/api/branches/1/products/1/media/set-primary" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"library_media_id": 2}'

# Respuesta esperada:
{
  "data": {
    "id": 1,
    "image": {
      "id": 10,  // Nuevo ID en colección 'main'
      "url": "http://localhost:8000/storage/...",
      "thumb": "http://localhost:8000/storage/.../thumb.jpg",
      "alt": "Imagen principal"
    },
    "gallery": [
      // ID 2 ya no está, se movió a 'main'
    ]
  }
}

# 2. Eliminar imagen
curl -X DELETE "http://localhost:8000/api/branches/1/media/3" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"

# Respuesta esperada:
{
  "status": "deleted",
  "message": "Imagen eliminada correctamente"
}
*/

/**
 * ==========================================
 * NOTAS IMPORTANTES
 * ==========================================
 */

/*
1. El parámetro se llama 'library_media_id' pero en realidad acepta cualquier media_id
   - Puede ser de la colección 'library'
   - Puede ser de la colección 'gallery'
   - El código detecta automáticamente de dónde viene

2. Cuando mueves una imagen de 'gallery' a 'main':
   - Se copia el archivo a la colección 'main'
   - Se ELIMINA el original de 'gallery'
   - Evita duplicados

3. El método destroy() ahora verifica permisos del modelo propietario
   antes de eliminar

4. Ambos métodos están protegidos por:
   - Middleware 'auth:api'
   - Verificación de branch_id
   - Policy authorize() del modelo propietario
*/
