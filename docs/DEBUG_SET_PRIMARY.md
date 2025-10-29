# 🔍 DEBUG: Imagen no se establece como principal

## Problema

Cuando haces clic en "⭐ Establecer como principal", la imagen no se mueve de `gallery` a `image`.

## ✅ Frontend está bien configurado

El frontend está enviando correctamente:

```
POST /api/branches/1/products/1/media/set-primary
Body: { "library_media_id": 2 }
```

## 🐛 Posibles Causas en el Backend

### 1. ProductResource no está usando los métodos del trait

**Verificar:** `app/Http/Resources/ProductResource.php`

```php
// ❌ INCORRECTO
'image' => $this->image,
'gallery' => $this->gallery,

// ✅ CORRECTO
'image' => $this->primaryImagePayload(),
'gallery' => $this->galleryPayload(),
```

### 2. El método setPrimary no está devolviendo ProductResource

**Verificar:** `app/Http/Controllers/Api/BranchMediaController.php`

```php
public function setPrimary(Request $request, Branch $branch, string $type, int $id)
{
    // ... código ...

    // ❌ INCORRECTO - No devuelve nada o devuelve mal
    return response()->json(['status' => 'success']);

    // ✅ CORRECTO - Debe devolver el producto con ProductResource
    return match ($type) {
        'products' => ProductResource::make($model),
        default => response()->json(['status' => 'success']),
    };
}
```

### 3. No se está moviendo el media de gallery a main

El método debe:

1. Buscar media en `gallery`
2. Limpiar colección `main`
3. Copiar archivo a `main`
4. **Eliminar** de `gallery`

## 🧪 Testing Manual

### Paso 1: Verificar estado actual en tinker

```php
php artisan tinker

$product = Product::find(1);

// Ver imagen principal
$main = $product->getFirstMedia('main');
dump([
    'main_exists' => $main !== null,
    'main_id' => $main?->id,
    'main_url' => $main?->getUrl(),
]);

// Ver galería
$gallery = $product->getMedia('gallery');
dump([
    'gallery_count' => $gallery->count(),
    'gallery_ids' => $gallery->pluck('id')->toArray(),
]);
```

### Paso 2: Probar setPrimary manualmente

```php
php artisan tinker

use App\Models\Product;
use App\Models\Branch;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Illuminate\Support\Facades\Storage;

$branch = Branch::find(1);
$product = Product::find(1);
$mediaId = 2; // ID de una imagen en gallery

// Buscar el media
$media = Media::where('branch_id', $branch->id)
    ->where('id', $mediaId)
    ->first();

echo "Media encontrado: {$media->id}\n";
echo "Colección: {$media->collection_name}\n";
echo "Archivo: {$media->file_name}\n";

// Limpiar main
$product->clearMediaCollection('main');
echo "Main limpiado\n";

// Copiar a main
$disk = $media->disk;
$path = $media->getPath();
$basePath = Storage::disk($disk)->path('');
$relativePath = ltrim(str_replace($basePath, '', $path), '/\\');

$stream = Storage::disk($disk)->readStream($relativePath);

$newMain = $product->addMediaFromStream($stream)
    ->usingFileName($media->file_name)
    ->withCustomProperties([
        'branch_id' => $branch->id,
        'alt' => $media->getCustomProperty('alt', 'Principal'),
    ])
    ->toMediaCollection('main');

$newMain->branch_id = $branch->id;
$newMain->save();

echo "Nuevo main creado: {$newMain->id}\n";

// Eliminar de gallery
$media->delete();
echo "Media eliminado de gallery\n";

// Verificar
$product = $product->fresh();
echo "Main actual: " . ($product->getFirstMedia('main')?->id ?? 'null') . "\n";
echo "Gallery count: " . $product->getMedia('gallery')->count() . "\n";
```

### Paso 3: Verificar ProductResource

```php
php artisan tinker

use App\Models\Product;
use App\Http\Resources\ProductResource;

$product = Product::with(['brand', 'categories'])->find(1);
$resource = new ProductResource($product);
$array = $resource->toArray(request());

// Ver image
dump($array['image']);
// Esperado: ['id' => X, 'url' => '...', 'thumb' => '...', 'alt' => '...']
// Si es null, el trait no está funcionando

// Ver gallery
dump($array['gallery']);
// Esperado: [['id' => X, 'url' => '...', ...], ...]
```

## 🔧 Solución Completa

### Archivo: `app/Http/Controllers/Api/BranchMediaController.php`

```php
<?php
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
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BranchMediaController extends Controller
{
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

        // Log inicio
        Log::info('setPrimary called', [
            'branch_id' => $branch->id,
            'type' => $type,
            'model_id' => $id,
            'media_id' => $mediaId,
        ]);

        // Buscar el media
        $media = Media::where('branch_id', $branch->id)
            ->where('id', $mediaId)
            ->first();

        if (!$media) {
            Log::error('Media not found', ['media_id' => $mediaId, 'branch_id' => $branch->id]);
            return response()->json([
                'error' => 'Media no encontrado'
            ], 404);
        }

        Log::info('Media found', [
            'media_id' => $media->id,
            'collection' => $media->collection_name,
            'file_name' => $media->file_name,
        ]);

        // Determinar colección principal
        $primaryCollection = match ($type) {
            'products'   => 'main',
            'brands'     => 'logo',
            'categories' => 'banner',
        };

        // 1. Limpiar main
        $model->clearMediaCollection($primaryCollection);
        Log::info('Cleared primary collection', ['collection' => $primaryCollection]);

        // 2. Copiar a main
        $disk = $media->disk;
        $path = $media->getPath();
        $basePath = Storage::disk($disk)->path('');
        $relativePath = ltrim(str_replace($basePath, '', $path), '/\\');

        $stream = Storage::disk($disk)->readStream($relativePath);

        if ($stream === false) {
            Log::error('Could not read file', ['path' => $relativePath]);
            return response()->json(['error' => 'Error al leer archivo'], 500);
        }

        $newMain = $model->addMediaFromStream($stream)
            ->usingFileName($media->file_name)
            ->withCustomProperties([
                'branch_id' => $branch->id,
                'alt' => $data['alt_text'] ?? $media->getCustomProperty('alt', 'Principal'),
                'src_media_id' => $media->id,
                'moved_at' => now()->toISOString(),
            ])
            ->toMediaCollection($primaryCollection);

        $newMain->branch_id = $branch->id;
        $newMain->save();

        Log::info('Created new main media', ['new_id' => $newMain->id]);

        // 3. Eliminar de gallery si venía de ahí
        if ($media->collection_name === 'gallery') {
            $media->delete();
            Log::info('Deleted from gallery', ['media_id' => $mediaId]);
        }

        // 4. Recargar modelo
        $model = $model->fresh()->load(['brand', 'categories']);

        Log::info('Returning updated model', [
            'model_id' => $model->id,
            'has_main' => $model->getFirstMedia('main') !== null,
            'gallery_count' => $model->getMedia('gallery')->count(),
        ]);

        // 5. Devolver según tipo
        return match ($type) {
            'products' => ProductResource::make($model),
            default => response()->json(['status' => 'success', 'data' => $model]),
        };
    }
}
```

### Archivo: `app/Http/Resources/ProductResource.php`

```php
<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            // ... otros campos ...

            // ✅ CRÍTICO: Usar métodos del trait
            'image' => $this->primaryImagePayload(),
            'gallery' => $this->galleryPayload(),

            // ... otros campos ...
        ];
    }
}
```

## 📊 Verificar Logs

Después de hacer clic en "⭐":

```bash
tail -f storage/logs/laravel.log | grep setPrimary
```

Deberías ver:

```
setPrimary called
Media found
Cleared primary collection
Created new main media
Deleted from gallery
Returning updated model
```

## 🎯 Checklist de Verificación

- [ ] ProductResource usa `primaryImagePayload()` y `galleryPayload()`
- [ ] setPrimary devuelve `ProductResource::make($model)`
- [ ] setPrimary elimina el media de gallery después de copiarlo
- [ ] Las rutas están en el orden correcto en api.php
- [ ] El modelo Product tiene el trait `HasModelImages`
- [ ] El trait define `primaryCollection()` retornando `'main'`

## 🆘 Si sigue sin funcionar

Envía el output de estos comandos:

```bash
# Ver las rutas
php artisan route:list | grep media

# Ver el log del request
tail -20 storage/logs/laravel.log

# Verificar en tinker
php artisan tinker
>>> $p = Product::find(1);
>>> $p->primaryImagePayload();
>>> $p->galleryPayload();
```
