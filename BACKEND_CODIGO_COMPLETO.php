<?php
/**
 * ARCHIVO: app/Http/Controllers/BranchProductsController.php
 * 
 * Agregar estos dos métodos al controlador existente
 */

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\TogglesActiveFlag;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Branch;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use App\Models\Notifications\NotificationType;
use App\Models\Notifications\NotificationEvent;
use App\Services\Notifications\NotificationRouter;

class BranchProductsController extends Controller
{
    use TogglesActiveFlag;

    // ... métodos existentes (index, store, show, update, destroy, toggleStatus) ...

    /**
     * Establecer una imagen de la galería como principal
     * 
     * Endpoint: PATCH /api/branches/{branch}/products/media/{mediaId}/set-main
     * 
     * Lógica:
     * 1. Busca el media en la colección 'gallery'
     * 2. Limpia la colección 'main' (elimina imagen principal actual)
     * 3. Copia el archivo a la colección 'main'
     * 4. Elimina el media original de 'gallery'
     * 5. Devuelve el producto actualizado
     */
    public function setMainImage(Request $request, Branch $branch, int $mediaId)
    {
        try {
            // 1. Buscar el media en la galería
            $media = Media::where('branch_id', $branch->id)
                ->where('collection_name', 'gallery')
                ->findOrFail($mediaId);
            
            // 2. Obtener el producto dueño del media
            $product = Product::where('branch_id', $branch->id)
                ->findOrFail($media->model_id);
            
            // 3. Verificar permisos
            $this->authorize('update', $product);
            
            // 4. Limpiar colección principal (eliminar imagen principal actual si existe)
            $product->clearMediaCollection('main');
            
            // 5. Obtener la ruta relativa del archivo
            $disk = $media->disk;
            $path = $media->getPath();
            
            // Calcular ruta relativa
            $basePath = Storage::disk($disk)->path('');
            $relativePath = str_replace($basePath, '', $path);
            $relativePath = ltrim($relativePath, '/\\');
            
            // 6. Leer el archivo como stream
            $stream = Storage::disk($disk)->readStream($relativePath);
            
            if ($stream === false) {
                return response()->json([
                    'error' => 'No se pudo leer el archivo de origen',
                    'path' => $relativePath
                ], 500);
            }
            
            // 7. Copiar archivo a colección 'main'
            $newMain = $product->addMediaFromStream($stream)
                ->usingFileName($media->file_name)
                ->withCustomProperties([
                    'branch_id' => $branch->id,
                    'alt' => $media->getCustomProperty('alt', 'Imagen principal'),
                    'src_gallery_id' => $media->id,
                    'moved_at' => now()->toISOString(),
                ])
                ->toMediaCollection('main');
            
            // 8. Asignar branch_id al nuevo media
            $newMain->branch_id = $branch->id;
            $newMain->save();
            
            // 9. Eliminar el media original de 'gallery'
            $media->delete();
            
            // 10. Devolver producto actualizado
            $product = $product->fresh()->load(['brand', 'categories']);
            
            return ProductResource::make($product);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Imagen no encontrada en la galería',
                'message' => 'La imagen que intentas establecer como principal no existe o no pertenece a la galería'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error al establecer imagen principal', [
                'branch_id' => $branch->id,
                'media_id' => $mediaId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error al establecer la imagen principal',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar una imagen de la galería o principal
     * 
     * Endpoint: DELETE /api/branches/{branch}/products/media/{mediaId}
     * 
     * Puede eliminar de cualquier colección (main o gallery)
     */
    public function deleteMedia(Branch $branch, int $mediaId)
    {
        try {
            // 1. Buscar el media sin importar la colección
            $media = Media::where('branch_id', $branch->id)
                ->whereIn('collection_name', ['main', 'gallery'])
                ->findOrFail($mediaId);
            
            // 2. Obtener el producto dueño
            $product = Product::where('branch_id', $branch->id)
                ->where('id', $media->model_id)
                ->firstOrFail();
            
            // 3. Verificar permisos
            $this->authorize('update', $product);
            
            // 4. Guardar info antes de eliminar (para el log)
            $collection = $media->collection_name;
            $fileName = $media->file_name;
            
            // 5. Eliminar el media (Spatie borra archivos + conversiones automáticamente)
            $media->delete();
            
            // 6. Log de auditoría (opcional)
            \Log::info('Imagen de producto eliminada', [
                'branch_id' => $branch->id,
                'product_id' => $product->id,
                'media_id' => $mediaId,
                'collection' => $collection,
                'file_name' => $fileName,
                'user_id' => Auth::id(),
            ]);
            
            return response()->json([
                'status' => 'deleted',
                'message' => 'Imagen eliminada correctamente',
                'data' => [
                    'media_id' => $mediaId,
                    'collection' => $collection,
                ]
            ], 200);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Imagen no encontrada',
                'message' => 'La imagen que intentas eliminar no existe o no pertenece a este producto'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error al eliminar imagen', [
                'branch_id' => $branch->id,
                'media_id' => $mediaId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error al eliminar la imagen',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

/**
 * ==========================================
 * ARCHIVO: routes/api.php
 * 
 * Agregar ANTES de las rutas existentes de productos
 * ==========================================
 */

/*
Route::middleware(['auth:api'])->group(function(){
    
    // ✅ IMPORTANTE: Estas rutas DEBEN ir ANTES de las rutas resource de productos
    Route::patch('branches/{branch}/products/media/{mediaId}/set-main', 
        [BranchProductsController::class, 'setMainImage'])
        ->middleware('can:edit-product')
        ->name('products.media.set-main');
    
    Route::delete('branches/{branch}/products/media/{mediaId}', 
        [BranchProductsController::class, 'deleteMedia'])
        ->middleware('can:edit-product')
        ->name('products.media.delete');
    
    // Rutas existentes de productos
    Route::get('branches/{branch}/products', [BranchProductsController::class,'index']);
    Route::post('branches/{branch}/products', [BranchProductsController::class,'store'])->middleware('can:create-product');
    Route::get('branches/{branch}/products/{product}', [BranchProductsController::class,'show']);
    Route::match(['put','patch'], 'branches/{branch}/products/{product}', [BranchProductsController::class,'update'])->middleware('can:edit-product');
    Route::delete('branches/{branch}/products/{product}', [BranchProductsController::class,'destroy'])->middleware('can:delete-product');
    Route::patch('branches/{branch}/products/{product}/toggle-status', [BranchProductsController::class, 'toggleStatus'])->middleware('can:edit-product');
});
*/

/**
 * ==========================================
 * ARCHIVO: app/Http/Resources/ProductResource.php
 * 
 * Asegúrate de que el Resource devuelve image y gallery
 * ==========================================
 */

/*
<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'sku' => $this->sku,
            'commercial_sku' => $this->commercial_sku,
            'barcode' => $this->barcode,
            'name' => $this->name,
            
            // Brand
            'brand' => $this->brand ? [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ] : null,
            'brand_id' => $this->brand_id,
            
            // Product info
            'product_type' => $this->product_type,
            'warranty_months' => $this->warranty_months,
            'serial_tracking' => (bool) $this->serial_tracking,
            
            // Descriptions
            'short_description' => $this->short_description,
            'long_description' => $this->long_description,
            'snippet_description' => $this->snippet_description,
            
            // Stock & Pricing
            'stock' => $this->stock,
            'cost' => $this->cost ? number_format((float)$this->cost, 2, '.', '') : '0.00',
            'price' => $this->price ? number_format((float)$this->price, 2, '.', '') : '0.00',
            'offer_price' => $this->offer_price ? number_format((float)$this->offer_price, 2, '.', '') : null,
            
            // Status
            'product_status' => $this->product_status,
            'is_active' => (bool) $this->is_active,
            
            // Attributes
            'attributes_json' => $this->attributes_json ?? null,
            
            // Categories
            'category_ids' => $this->categories->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
            ])->all(),
            
            // ✅ IMPORTANTE: Usar los métodos del trait HasModelImages
            'image' => $this->primaryImagePayload(),
            'gallery' => $this->galleryPayload(),
            
            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
*/

/**
 * ==========================================
 * TESTING CON POSTMAN O CURL
 * ==========================================
 */

/*
# 1. Establecer imagen como principal
curl -X PATCH "http://localhost:8000/api/branches/1/products/media/2/set-main" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"

# 2. Eliminar imagen
curl -X DELETE "http://localhost:8000/api/branches/1/products/media/3" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
*/

/**
 * ==========================================
 * VERIFICACIÓN DE RUTAS
 * ==========================================
 */

/*
# En terminal Laravel:
php artisan route:list | grep media

# Deberías ver:
# PATCH  | api/branches/{branch}/products/media/{mediaId}/set-main | products.media.set-main
# DELETE | api/branches/{branch}/products/media/{mediaId}          | products.media.delete
*/
