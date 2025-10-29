# 🔍 Queries de Debug para el Error "No query results for model"

## El Problema

Estás usando `App\Models\Media\Media` pero esa clase **NO ES** el modelo de Spatie.

El modelo correcto de Spatie es: `Spatie\MediaLibrary\MediaCollections\Models\Media`

---

## 1️⃣ Verificar qué modelo estás usando

Abre `app/Http/Controllers/Api/BranchMediaController.php` y busca:

```php
use App\Models\Media\Media as SpatieMedia;  // ❌ INCORRECTO
```

**Debe ser:**

```php
use Spatie\MediaLibrary\MediaCollections\Models\Media;  // ✅ CORRECTO
```

---

## 2️⃣ Verificar si existe App\Models\Media\Media

Ejecuta en terminal:

```bash
# Ver si existe ese archivo
ls app/Models/Media/Media.php

# Si existe, ábrelo y verás algo como:
cat app/Models/Media/Media.php
```

**Si existe**, probablemente sea una clase que creaste tú o alguien más, pero **NO ES** la de Spatie.

---

## 3️⃣ Testing en Tinker

```bash
php artisan tinker
```

```php
// Ver qué clase estás usando actualmente
$wrongClass = \App\Models\Media\Media::class;
echo $wrongClass; // App\Models\Media\Media

// Ver la clase correcta de Spatie
$correctClass = \Spatie\MediaLibrary\MediaCollections\Models\Media::class;
echo $correctClass; // Spatie\MediaLibrary\MediaCollections\Models\Media

// Intentar buscar con tu clase (dará error o no encontrará)
try {
    $m = \App\Models\Media\Media::find(1);
    dump($m);
} catch (\Exception $e) {
    echo "Error con App\Models\Media\Media: " . $e->getMessage();
}

// Buscar con la clase correcta de Spatie
$m = \Spatie\MediaLibrary\MediaCollections\Models\Media::find(1);
dump($m);

// Ver todos los media de branch 1
$allMedia = \Spatie\MediaLibrary\MediaCollections\Models\Media::where('branch_id', 1)->get();
dump($allMedia->map(fn($m) => [
    'id' => $m->id,
    'collection' => $m->collection_name,
    'file' => $m->file_name,
    'model' => $m->model_type,
])->toArray());
```

---

## 4️⃣ Query directo en la base de datos

```sql
-- Ver qué IDs de media existen en branch 1
SELECT id, model_type, model_id, collection_name, file_name, branch_id
FROM media
WHERE branch_id = 1
ORDER BY id DESC;

-- Ver el media con ID 1
SELECT * FROM media WHERE id = 1;

-- Si branch_id es NULL, actualizar:
UPDATE media
SET branch_id = 1
WHERE model_type = 'App\\Models\\Product'
AND model_id = 1
AND branch_id IS NULL;
```

---

## 5️⃣ Verificar la tabla media

```bash
php artisan tinker
```

```php
// Ver estructura de la tabla
DB::select("DESCRIBE media");

// Ver si existe la columna branch_id
$hasBranchId = \Schema::hasColumn('media', 'branch_id');
echo $hasBranchId ? "✅ Tiene branch_id" : "❌ NO tiene branch_id";

// Ver cuántos media tienes en total
$count = DB::table('media')->count();
echo "Total de media: {$count}";

// Ver cuántos tienen branch_id = 1
$countBranch1 = DB::table('media')->where('branch_id', 1)->count();
echo "Media en branch 1: {$countBranch1}";

// Ver cuántos tienen branch_id = NULL
$countNull = DB::table('media')->whereNull('branch_id')->count();
echo "Media sin branch_id: {$countNull}";
```

---

## 6️⃣ Solución paso a paso

### Paso 1: Cambiar el import en el controller

En `app/Http/Controllers/Api/BranchMediaController.php`:

```php
// ❌ BORRAR esta línea:
use App\Models\Media\Media as SpatieMedia;

// ✅ AGREGAR esta línea:
use Spatie\MediaLibrary\MediaCollections\Models\Media;
```

### Paso 2: Cambiar todas las referencias

En todos los métodos del controller, donde usabas `SpatieMedia`, ahora usa `Media`:

```php
// Antes:
$media = SpatieMedia::where('branch_id', $branch->id)->findOrFail($id);

// Después:
$media = Media::where('branch_id', $branch->id)->findOrFail($id);
```

También cambia esto:

```php
// Antes:
$query = \App\Models\Media\Media::query()

// Después:
$query = Media::query()
```

### Paso 3: Verificar que no uses tu clase personalizada

Si tienes `app/Models/Media/Media.php`, **NO LA BORRES** todavía. Primero verifica si la usas en otros lugares:

```bash
# Buscar referencias a esa clase
grep -r "App\\Models\\Media\\Media" app/
grep -r "use App\\Models\\Media\\Media" app/
```

Si solo aparece en `BranchMediaController`, puedes proceder. Si aparece en otros lugares, tendrás que analizar cada caso.

### Paso 4: Limpiar cachés

```bash
php artisan config:clear
php artisan route:clear
php artisan cache:clear
composer dump-autoload
```

---

## 7️⃣ Testing final

Después de hacer los cambios:

```bash
php artisan tinker
```

```php
use App\Models\Product;
use App\Models\Branch;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

// Verificar que ahora encuentra el media
$media = Media::find(1);
dump($media);

// Probar el flujo completo
$branch = Branch::find(1);
$product = Product::find(1);

// Ver media del producto
$productMedia = Media::where('model_type', 'App\\Models\\Product')
    ->where('model_id', $product->id)
    ->where('branch_id', $branch->id)
    ->get();

dump($productMedia->map(fn($m) => [
    'id' => $m->id,
    'collection' => $m->collection_name,
    'file' => $m->file_name,
])->toArray());
```

---

## Resumen del Error

El error `No query results for model [App\\Models\\Media\\Media] 1` ocurre porque:

1. ❌ Estás usando `App\Models\Media\Media` (tu clase o inexistente)
2. ✅ Debes usar `Spatie\MediaLibrary\MediaCollections\Models\Media` (clase de Spatie)

El modelo de Spatie es el que tiene acceso a la tabla `media` creada por la migración de Spatie. Tu clase personalizada (si existe) probablemente no tiene configuración de base de datos o usa otra tabla.

---

## Logs para verificar

Después de hacer los cambios, revisa los logs:

```bash
tail -f storage/logs/laravel.log
```

Busca las líneas con:

- "Media found successfully"
- "Media not found"
- "setPrimary failed"

Eso te dirá exactamente qué está pasando.
