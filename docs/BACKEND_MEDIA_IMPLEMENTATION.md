# Implementación de Media en el Backend

## Problema Actual

Las imágenes no se están visualizando correctamente porque el `ProductResource` no está usando los métodos del trait `HasModelImages`.

## Solución

### 1. Actualizar ProductResource

Archivo: `App\Http\Resources\ProductResource.php`

```php
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
```

### 2. Agregar Rutas de Media

Archivo: `routes/api.php`

```php
<?php
use App\Http\Controllers\Api\BranchMediaController;
use App\Http\Controllers\BranchProductsController;

Route::middleware(['auth:api'])->group(function(){

    // Biblioteca de medios de la sucursal
    Route::post('branches/{branch}/library/media', [BranchMediaController::class, 'uploadToLibrary']);
    Route::get('branches/{branch}/library/media', [BranchMediaController::class, 'listLibrary']);

    // Media para productos/marcas/categorías - SUBIDA
    Route::post('branches/{branch}/{type}/{id}/media/upload-multiple', [BranchMediaController::class, 'uploadMultipleDirect'])
        ->where('type', 'products|brands|categories');

    Route::post('branches/{branch}/{type}/{id}/media/attach-from-library', [BranchMediaController::class, 'attachFromLibrary'])
        ->where('type', 'products|brands|categories');

    Route::get('branches/{branch}/{type}/{id}/media', [BranchMediaController::class, 'listFor'])
        ->where('type', 'products|brands|categories');

    // ✅ NUEVAS RUTAS NECESARIAS - Gestión de imágenes de productos
    // IMPORTANTE: Estas rutas DEBEN estar ANTES de la ruta resource de productos
    Route::patch('branches/{branch}/products/media/{mediaId}/set-main', [BranchProductsController::class, 'setMainImage'])
        ->middleware('can:edit-product');

    Route::delete('branches/{branch}/products/media/{mediaId}', [BranchProductsController::class, 'deleteMedia'])
        ->middleware('can:edit-product');

    // Rutas de productos (ya existentes)
    Route::get('branches/{branch}/products', [BranchProductsController::class,'index']);
    Route::post('branches/{branch}/products', [BranchProductsController::class,'store'])->middleware('can:create-product');
    Route::get('branches/{branch}/products/{product}', [BranchProductsController::class,'show']);
    Route::match(['put','patch'], 'branches/{branch}/products/{product}', [BranchProductsController::class,'update'])->middleware('can:edit-product');
    Route::delete('branches/{branch}/products/{product}', [BranchProductsController::class,'destroy'])->middleware('can:delete-product');
    Route::patch('branches/{branch}/products/{product}/toggle-status', [BranchProductsController::class, 'toggleStatus'])->middleware('can:edit-product');
});
```

**NOTA IMPORTANTE**: Las rutas de media deben ir ANTES de las rutas resource de productos para evitar conflictos de routing.

### 3. Agregar Métodos en BranchProductsController

Archivo: `App\Http\Controllers\BranchProductsController.php`

Agregar estos métodos al controlador de productos (NO en BranchMediaController):

```php
/**
 * Establecer una imagen de la galería como principal
 * PATCH /api/branches/{branch}/products/media/{mediaId}/set-main
 *
 * Lógica:
 * 1. Encuentra el media en la colección 'gallery'
 * 2. Limpia la colección 'main' (elimina la imagen principal actual)
 * 3. Copia el archivo seleccionado a la colección 'main'
 * 4. Elimina el media de 'gallery'
 * 5. Devuelve el producto actualizado con image + gallery actualizadas
 */
public function setMainImage(Request $request, Branch $branch, int $mediaId)
{
    // Buscar el media en la galería
    $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::where('branch_id', $branch->id)
        ->where('collection_name', 'gallery')
        ->findOrFail($mediaId);

    // Obtener el producto dueño del media
    $product = Product::where('branch_id', $branch->id)
        ->findOrFail($media->model_id);

    $this->authorize('update', $product);

    // 1. Limpiar colección principal (eliminar imagen principal actual)
    $product->clearMediaCollection('main');

    // 2. Copiar archivo a colección 'main'
    $relative = method_exists($media, 'getPathRelativeToRoot')
        ? $media->getPathRelativeToRoot()
        : ltrim(str_replace(\Storage::disk($media->disk)->path(''), '', $media->getPath()), '/');

    $stream = \Storage::disk($media->disk)->readStream($relative);
    abort_if($stream === false, 500, 'No se pudo leer el archivo.');

    $newMain = $product->addMediaFromStream($stream)
        ->usingFileName($media->file_name)
        ->withCustomProperties([
            'branch_id' => $branch->id,
            'alt'  => $media->getCustomProperty('alt'),
            'src_gallery_id' => $media->id,
        ])
        ->toMediaCollection('main');

    $newMain->branch_id = $branch->id;
    $newMain->save();

    // 3. Eliminar el media de 'gallery' (ya está en 'main')
    $media->delete();

    // 4. Devolver producto actualizado
    return ProductResource::make($product->fresh()->load(['brand', 'categories']));
}

/**
 * Eliminar una imagen de la galería o principal
 * DELETE /api/branches/{branch}/products/media/{mediaId}
 *
 * Puede eliminar de cualquier colección (main o gallery)
 */
public function deleteMedia(Branch $branch, int $mediaId)
{
    // Buscar el media sin importar la colección
    $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::where('branch_id', $branch->id)
        ->whereIn('collection_name', ['main', 'gallery'])
        ->findOrFail($mediaId);

    // Obtener el producto dueño
    $product = Product::where('branch_id', $branch->id)
        ->findOrFail($media->model_id);

    $this->authorize('update', $product);

    // Eliminar el media (Spatie borra archivos + conversiones automáticamente)
    $media->delete();

    return response()->json([
        'status' => 'deleted',
        'message' => 'Imagen eliminada correctamente'
    ]);
}
```

**Agregar estos `use` al inicio del archivo:**

```php
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Illuminate\Support\Facades\Storage;
```

### 4. Verificar Modelo Media

Asegúrate de que el modelo `Media` tiene el campo `branch_id`:

Archivo: `database/migrations/xxxx_add_branch_id_to_media_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('media', function (Blueprint $table) {
            if (!Schema::hasColumn('media', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id');
                $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
                $table->index('branch_id');
            }
        });
    }

    public function down()
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
```

## Testing

### 1. Verificar que el ProductResource devuelve las imágenes correctamente:

```bash
GET /api/branches/1/products/1
```

Respuesta esperada cuando TODO está bien configurado:

```json
{
	"data": {
		"id": 1,
		"name": "Producto Test",
		"image": {
			"id": 10,
			"url": "http://localhost:8000/storage/media/branch-1/product/1/imagen-principal.webp",
			"thumb": "http://localhost:8000/storage/media/.../conversions/imagen-principal-thumb.jpg",
			"alt": "Imagen principal"
		},
		"gallery": [
			{
				"id": 2,
				"url": "http://localhost:8000/storage/media/...",
				"thumb": "http://localhost:8000/storage/media/.../thumb.jpg",
				"alt": "Imagen 1",
				"sort": 0
			},
			{
				"id": 3,
				"url": "http://localhost:8000/storage/media/...",
				"thumb": "http://localhost:8000/storage/media/.../thumb.jpg",
				"alt": "Imagen 2",
				"sort": 1
			}
		]
	}
}
```

**IMPORTANTE**: En tu caso actual, `image` es `null` y todas las imágenes están en `gallery`. Esto es correcto SI el producto aún no tiene una imagen establecida como principal.

### 2. Establecer imagen principal (mover de gallery a image):

```bash
PATCH /api/branches/1/products/media/2/set-main
```

**¿Qué debe pasar?**

1. La imagen con ID `2` se elimina de `gallery`
2. Se crea una nueva entrada en la colección `main`
3. El response devuelve:
    - `image`: con la nueva imagen principal
    - `gallery`: sin la imagen que se movió

Respuesta esperada:

```json
{
	"data": {
		"id": 1,
		"image": {
			"id": 11, // ← Nuevo ID (porque es una copia)
			"url": "http://localhost:8000/storage/...",
			"thumb": "http://localhost:8000/storage/.../thumb.jpg",
			"alt": "Imagen 1"
		},
		"gallery": [
			{
				"id": 3, // ← ID 2 ya no está porque se movió a 'main'
				"url": "...",
				"thumb": "...",
				"alt": "Imagen 2",
				"sort": 1
			}
		]
	}
}
```

### 3. Eliminar imagen de la galería:

```bash
DELETE /api/branches/1/products/media/3
```

Respuesta esperada:

```json
{
	"status": "deleted",
	"message": "Imagen eliminada correctamente"
}
```

### 4. Eliminar imagen principal:

```bash
DELETE /api/branches/1/products/media/11
```

**Resultado**:

- `image` se convierte en `null`
- El producto queda sin imagen principal

## Flujo Completo de Uso

### Escenario 1: Producto nuevo sin imágenes

1. Usuario sube 3 imágenes → Todas van a `gallery`
2. Response: `image: null`, `gallery: [img1, img2, img3]`
3. Usuario hace clic en "⭐ Establecer como principal" en img2
4. Response: `image: img2`, `gallery: [img1, img3]`

### Escenario 2: Cambiar imagen principal

1. Estado actual: `image: img2`, `gallery: [img1, img3]`
2. Usuario hace clic en "⭐" en img3
3. Qué pasa en backend:
    - Se elimina img2 de colección `main`
    - Se copia img3 a colección `main`
    - Se elimina img3 de colección `gallery`
4. Response: `image: img3`, `gallery: [img1]`

### Escenario 3: Eliminar imagen principal

1. Estado actual: `image: img3`, `gallery: [img1]`
2. Usuario hace clic en "🗑️ Eliminar" en la imagen principal
3. Response: `image: null`, `gallery: [img1]`

## Notas Importantes

1. **Conversiones**: Spatie automáticamente genera las conversiones definidas en `registerMediaConversions()` del modelo Product
2. **Permisos**: Las rutas ya tienen `can:edit-product` en las rutas principales
3. **Branch Scoping**: Todos los media queries filtran por `branch_id` para multi-tenancy
4. **Colecciones**:
    - `main` para imagen principal (singleFile)
    - `gallery` para galería de imágenes (múltiples archivos)
5. **Movimiento de imágenes**: Cuando estableces una imagen como principal:
    - Se COPIA el archivo de `gallery` a `main`
    - Se ELIMINA el original de `gallery`
    - Esto evita duplicados y mantiene la lógica clara

## Debugging y Troubleshooting

### Problema: "image" siempre es null

**Causa**: No hay ninguna imagen en la colección `main`

**Solución**:

1. Verifica que el método `primaryImagePayload()` del trait está siendo llamado
2. Ejecuta en tinker:

```php
$product = Product::find(1);
$product->getFirstMedia('main'); // Debe devolver un Media o null
```

### Problema: Todas las imágenes están en "gallery"

**Causa**: Las imágenes se subieron directamente a `gallery`, ninguna fue establecida como principal

**Solución**: Esto es correcto. El usuario debe hacer clic en "⭐ Establecer como principal" para mover una a `main`

### Problema: Error 404 en las rutas

**Causa**: Las rutas no están registradas o están en orden incorrecto

**Solución**:

1. Verifica que las rutas de media estén ANTES de las rutas resource
2. Ejecuta: `php artisan route:list | grep media`
3. Debe mostrar:

```
PATCH  | branches/{branch}/products/media/{mediaId}/set-main
DELETE | branches/{branch}/products/media/{mediaId}
```

### Verificar colecciones de un producto

```php
// En tinker o en un controller
$product = Product::find(1);

// Ver imagen principal
$main = $product->getFirstMedia('main');
dd([
    'main_exists' => $main !== null,
    'main_url' => $main?->getUrl(),
    'main_id' => $main?->id,
]);

// Ver galería
$gallery = $product->getMedia('gallery');
dd([
    'gallery_count' => $gallery->count(),
    'gallery_ids' => $gallery->pluck('id'),
    'gallery_urls' => $gallery->map(fn($m) => $m->getUrl()),
]);
```

### Migración manual de imagen a principal

Si necesitas establecer manualmente una imagen como principal desde tinker:

```php
$product = Product::find(1);
$gallery = $product->getMedia('gallery');
$firstImage = $gallery->first();

if ($firstImage) {
    // Copiar a main
    $stream = Storage::disk($firstImage->disk)->readStream($firstImage->getPathRelativeToRoot());
    $newMain = $product->addMediaFromStream($stream)
        ->usingFileName($firstImage->file_name)
        ->withCustomProperties([
            'branch_id' => $product->branch_id,
            'alt' => $firstImage->getCustomProperty('alt'),
        ])
        ->toMediaCollection('main');

    $newMain->branch_id = $product->branch_id;
    $newMain->save();

    // Eliminar de gallery
    $firstImage->delete();

    echo "✅ Imagen establecida como principal\n";
}
```
