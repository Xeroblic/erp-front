# 🔍 Debug: Media ID no existe en la base de datos

## El Problema Real

Tu modelo `App\Models\Media\Media` SÍ extiende de Spatie correctamente:

```php
class Media extends BaseMedia
{
    protected $fillable = ['branch_id'];
}
```

Entonces el error `No query results for model [App\\Models\\Media\\Media] 1` significa:

**❌ El media con ID 1 NO EXISTE en tu tabla `media`**

---

## 1️⃣ Verificar qué IDs existen en la base de datos

### SQL directo:

```sql
-- Ver TODOS los media que existen
SELECT id, model_type, model_id, collection_name, file_name, branch_id
FROM media
ORDER BY id DESC;

-- Ver específicamente si existe el ID 1
SELECT * FROM media WHERE id = 1;

-- Ver los media del producto 1 en branch 1
SELECT id, collection_name, file_name, branch_id
FROM media
WHERE model_type = 'App\\Models\\Product'
AND model_id = 1
AND branch_id = 1;
```

---

## 2️⃣ Tinker para ver qué IDs tienes

```bash
php artisan tinker
```

```php
use App\Models\Media\Media;

// Ver TODOS los media
$allMedia = Media::all();
dump($allMedia->map(fn($m) => [
    'id' => $m->id,
    'collection' => $m->collection_name,
    'file' => $m->file_name,
    'branch_id' => $m->branch_id,
    'model' => $m->model_type,
    'model_id' => $m->model_id,
])->toArray());

// Ver los IDs que existen
$ids = Media::pluck('id')->toArray();
dump("IDs existentes: " . implode(', ', $ids));

// Ver media de branch 1
$branch1Media = Media::where('branch_id', 1)->get();
dump("Media en branch 1:", $branch1Media->pluck('id')->toArray());

// Ver media del producto 1
$product1Media = Media::where('model_type', 'App\\Models\\Product')
    ->where('model_id', 1)
    ->get();
dump("Media del producto 1:", $product1Media->map(fn($m) => [
    'id' => $m->id,
    'collection' => $m->collection_name,
    'branch_id' => $m->branch_id,
])->toArray());
```

---

## 3️⃣ Ver qué ID está enviando el frontend

Abre el **Network Tab** en el navegador y busca la request que falla:

```
POST /api/branches/1/products/1/media/set-primary
```

**Payload:**

```json
{
	"library_media_id": 1 // ← ¿Este ID existe?
}
```

**Probablemente el ID que estás enviando NO EXISTE en la base de datos.**

---

## 4️⃣ Solución: Usar el ID correcto

### Opción A: Ver qué IDs tienes disponibles

En el frontend, cuando cargas el producto, mira en la consola:

```typescript
// En ProductDetail.tsx o ImagesProduct.tsx
console.log('Gallery images:', product.gallery);
console.log('Main image:', product.image);
```

Los IDs que ves ahí son los que **SÍ EXISTEN** en la base de datos.

### Opción B: Crear un media de prueba

```bash
php artisan tinker
```

```php
use App\Models\Product;
use App\Models\Branch;

$product = Product::find(1);
$branch = Branch::find(1);

// Crear un media de prueba en gallery
$media = $product->addMedia(public_path('images/test.jpg'))
    ->withCustomProperties([
        'branch_id' => $branch->id,
        'alt' => 'Imagen de prueba',
    ])
    ->toMediaCollection('gallery');

// Actualizar branch_id
$media->branch_id = $branch->id;
$media->save();

echo "Media creado con ID: {$media->id}";

// Ahora intenta setear este ID como principal desde el frontend
```

---

## 5️⃣ Mejorar el endpoint para dar mejor info

Actualiza tu método `setPrimary` para mostrar qué IDs están disponibles:

```php
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

    // Buscar el media
    $media = Media::find($mediaId);

    if (!$media) {
        // ✅ Mostrar qué IDs SÍ existen
        $availableIds = Media::where('branch_id', $branch->id)
            ->where('model_type', get_class($model))
            ->where('model_id', $model->id)
            ->pluck('id')
            ->toArray();

        Log::error('Media not found', [
            'requested_id' => $mediaId,
            'branch_id' => $branch->id,
            'available_ids' => $availableIds,
        ]);

        return response()->json([
            'error' => 'Media no encontrado',
            'message' => "La imagen con ID {$mediaId} no existe",
            'requested_id' => $mediaId,
            'available_ids' => $availableIds, // ← Mostrar qué IDs SÍ existen
        ], 404);
    }

    // ... resto del código
}
```

---

## 6️⃣ Verificar en ProductResource

Es posible que el frontend esté recibiendo IDs incorrectos. Verifica tu `ProductResource`:

```php
// app/Http/Resources/ProductResource.php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        // ...

        // ✅ Asegúrate de que esto devuelve los IDs correctos
        'image' => $this->image ? [
            'id' => $this->image->id,  // ← Este ID debe existir
            'url' => $this->image->url,
            'alt' => $this->image->alt,
        ] : null,

        'gallery' => $this->gallery->map(fn($img) => [
            'id' => $img->id,  // ← Estos IDs deben existir
            'url' => $img->url,
            'thumbnail_url' => $img->thumbnail_url,
            'alt' => $img->alt,
        ]),
    ];
}
```

---

## 7️⃣ Testing frontend

En `ImagesProduct.tsx`, agrega logs para ver qué IDs estás enviando:

```typescript
const handleSetAsMain = async (imageId: number) => {
	console.log('🔍 Setting image as main:', {
		imageId,
		productId: product?.id,
		branchId: effectiveBranchId,
		allGalleryIds: product?.gallery?.map((img) => img.id),
	});

	await onSetMainImage?.(imageId);
};
```

---

## Resumen

El error NO es por el modelo, sino porque:

1. **El frontend está enviando `library_media_id: 1`**
2. **Pero el media con ID 1 no existe en la tabla `media`**
3. **Los IDs reales probablemente son otros (2, 3, 4, etc.)**

**Solución:**

- Ejecuta las queries SQL/Tinker para ver qué IDs **SÍ EXISTEN**
- Verifica en el frontend qué ID estás enviando (Network tab)
- Asegúrate de que `product.gallery[].id` corresponde a IDs reales de la tabla `media`

¿Ejecutas las queries de Tinker y me dices qué IDs tienes en la base de datos? 😄
