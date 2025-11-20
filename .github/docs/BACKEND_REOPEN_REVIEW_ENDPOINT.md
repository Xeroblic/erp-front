# Endpoint Faltante: Reabrir Revisión

## 📋 Problema Actual

El frontend necesita poder volver un item de estado `reviewed` a `in_review` para permitir modificaciones y recalcular el grado.

Actualmente:

- ✅ `POST /start-review` - Solo funciona con `pending`
- ❌ No existe endpoint para reabrir desde `reviewed`
- ❌ `PATCH /items/{id}` no acepta `review_status`
- ❌ `PATCH /items/{id}/details` no acepta `review_status`

## 🔧 Solución Requerida

### 1. Agregar Ruta en `api.php`

```php
// En: routes/technical-reviews.php (línea ~44, después de complete-review)

Route::prefix('items')->group(function () {
    // ... rutas existentes ...

    Route::post('/{item}/complete-review', [TechnicalReviewItemController::class, 'completeReview']);
    Route::post('/{item}/reopen-review', [TechnicalReviewItemController::class, 'reopenReview']); // ← NUEVO
    Route::post('/{item}/approve', [TechnicalReviewItemController::class, 'approve']);
});
```

### 2. Agregar Método en el Controlador

```php
// En: App\Http\Controllers\Api\TechnicalReviewItemController.php

/**
 * Reopen a reviewed item to allow modifications
 * Vuelve el item de REVIEWED a IN_REVIEW para permitir re-edición
 */
public function reopenReview(Branch $branch, TechnicalReviewItem $item): JsonResponse
{
    $item = $this->ensureItemBelongsToBranch($branch, $item);
    $this->authorize('review', $item);

    // Solo permitir reabrir si está en estado REVIEWED (no APPROVED)
    if ($item->review_status !== ReviewStatus::REVIEWED) {
        return response()->json([
            'success' => false,
            'message' => 'Solo se pueden reabrir equipos que estén en estado "Revisado". Estado actual: ' . $item->review_status->label(),
        ], 422);
    }

    DB::beginTransaction();
    try {
        // Volver a estado IN_REVIEW
        $item->update([
            'review_status' => ReviewStatus::IN_REVIEW,
            'reviewed_at' => null, // Limpiar fecha de revisión
            'suggested_grade' => null, // Limpiar grado sugerido anterior
            'scoring_confidence' => null,
            'scoring_breakdown' => null,
            'updated_by' => auth()->id(),
        ]);

        // Actualizar trazabilidad
        if ($item->traceability) {
            $this->traceabilityService->changeStatus(
                $item->traceability,
                EquipmentStatus::IN_REVIEW,
                'Revisión reabierta para modificaciones'
            );
        }

        // Decrementar contador de lote si existía
        if ($item->batch) {
            $item->batch->decrement('completed_quantity');
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Revisión reabierta exitosamente',
            'data' => new TechnicalReviewItemResource($this->loadItemWithRelations($item->fresh())),
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Error al reabrir revisión: ' . $e->getMessage(),
        ], 500);
    }
}
```

## 🎯 Validaciones del Endpoint

### ✅ Permitir Reabrir:

- Item en estado `REVIEWED` (no aprobado aún)
- Usuario con permiso `review`

### ❌ Rechazar:

- Item en estado `APPROVED` → No modificable
- Item en estado `IN_REVIEW` → Ya está abierto
- Item en estado `PENDING` → No ha sido revisado

## 📊 Flujo Completo

```
┌─────────────┐
│  REVIEWED   │ ← Estado inicial (grado calculado)
└──────┬──────┘
       │
       │ POST /reopen-review
       ▼
┌─────────────┐
│  IN_REVIEW  │ ← Permite editar details
└──────┬──────┘
       │
       │ Usuario modifica campos
       │ PATCH /details (varias veces)
       ▼
┌─────────────┐
│  IN_REVIEW  │ ← Campos actualizados
└──────┬──────┘
       │
       │ POST /complete-review
       ▼
┌─────────────┐
│  REVIEWED   │ ← Nuevo grado calculado
└──────┬──────┘
       │
       │ POST /approve
       ▼
┌─────────────┐
│  APPROVED   │ ← Estado final (inmutable)
└─────────────┘
```

## 🔐 Permisos Requeridos

- **Autorización**: Mismo permiso que `review` (ya existente)
- **Usuario**: Debe tener rol de revisor técnico

## 📝 Response Examples

### Éxito (200)

```json
{
  "success": true,
  "message": "Revisión reabierta exitosamente",
  "data": {
    "id": 9,
    "review_status": {
      "value": "in_review",
      "label": "En Revisión"
    },
    "suggested_grade": null,
    "reviewed_at": null,
    ...
  }
}
```

### Error - Ya Aprobado (422)

```json
{
	"success": false,
	"message": "Solo se pueden reabrir equipos que estén en estado \"Revisado\". Estado actual: Aprobado"
}
```

## 🧪 Testing

```php
// tests/Feature/TechnicalReviews/ReopenReviewTest.php

public function test_can_reopen_reviewed_item()
{
    $item = TechnicalReviewItem::factory()->reviewed()->create();

    $response = $this->postJson("/api/branches/1/technical-reviews/items/{$item->id}/reopen-review");

    $response->assertOk();
    $this->assertEquals('in_review', $item->fresh()->review_status);
}

public function test_cannot_reopen_approved_item()
{
    $item = TechnicalReviewItem::factory()->approved()->create();

    $response = $this->postJson("/api/branches/1/technical-reviews/items/{$item->id}/reopen-review");

    $response->assertStatus(422);
}
```

## 📌 Frontend Integration

Una vez implementado el endpoint, el frontend usará:

```typescript
// src/store/slices/technicalReviews/thunks/reviewThunks.ts

export const reopenReview = createAsyncThunk<...>(
    'technicalReviews/reopenReview',
    async ({ branchId, itemId }, { rejectWithValue }) => {
        const response = await ApiService.fetchData({
            url: ep(branchId, `/items/${itemId}/reopen-review`),
            method: 'post', // ← POST, no PATCH
        });
        return normalizeObject(response.data);
    }
);
```

---

**🚀 Prioridad**: Alta - Bloqueante para feature de recalcular grado
**⏱️ Estimación**: 30 minutos de desarrollo + 15 minutos de testing
