# 📋 Análisis Completo: Reglas de Validación Backend vs Frontend

## 🎯 Resumen Ejecutivo

**Situación Actual:**

- ✅ Backend tiene reglas de validación completas y robustas (`TechnicalReviewValidationController`)
- ✅ Frontend tiene thunks para consumir validaciones (`validationThunks.ts`)
- ⚠️ **PROBLEMA**: El flujo de items (`items/[itemId].tsx`) está mezclado con lógica de batches
- ⚠️ **PROBLEMA**: No se están usando las reglas de validación del backend en los formularios

---

## 🔍 Análisis del Backend

### Endpoint Principal: `TechnicalReviewValidationController`

#### **1. GET /validation/rules** - Reglas Completas

```php
public function getAllValidationRules(Branch $branch): JsonResponse
{
    $schema = $this->buildRulesSchema();
    $common = $this->buildCommonFieldsSchema();

    return response()->json([
        'success' => true,
        'data' => [
            'common' => $common,
            'types' => $schema,
        ],
    ]);
}
```

**Estructura de respuesta:**

```json
{
  "success": true,
  "data": {
    "common": {
      "brand": { "type": "string", "label": "Marca", "group": "Identificación", ... },
      "model": { ... },
      "general_condition": { ... },
      "observations": { ... },
      "extra_attributes": { ... }
    },
    "types": {
      "notebook": { /* 40+ campos */ },
      "desktop": { /* 20+ campos */ },
      "aio": { /* 30+ campos */ },
      "docking": { /* 15+ campos */ },
      "monitor": { /* 18+ campos */ }
    }
  }
}
```

#### **2. GET /validation/rules/{equipmentType}** - Por Tipo

```php
public function getValidationRules(Branch $branch, string $equipmentType): JsonResponse
{
    $types = $this->buildRulesSchema();
    $key = strtolower($equipmentType);
    $typeSchema = $types[$key] ?? [];
    $data = array_merge($this->buildCommonFieldsSchema(), $typeSchema);

    return response()->json([
        'success' => true,
        'data' => $data,
    ]);
}
```

#### **3. POST /validation/validate-field** - Validación en Tiempo Real

```php
public function validateField(Request $request, Branch $branch): JsonResponse
{
    $validated = $request->validate([
        'equipment_type' => 'required|string',
        'field_name' => 'required|string',
        'field_value' => 'required',
    ]);

    // Valida:
    // - Formato (regex pattern)
    // - Rango numérico (min/max)
    // - Valores permitidos (allowed_values)
    // - Dependencias (depends_on)

    return response()->json([
        'success' => true,
        'valid' => $isValid,
        'errors' => $errors,
        'warnings' => $warnings,
        'suggestion' => $suggestion,
        'help_text' => $rule->help_text,
    ]);
}
```

#### **4. POST /validation/suggest-grade** - Sugerencia de Grado

```php
public function suggestGrade(Request $request, Branch $branch): JsonResponse
{
    $item = TechnicalReviewItem::findOrFail($validated['item_id']);
    $scoring = $this->scoringService->calculateGrade($item);

    return response()->json([
        'success' => true,
        'data' => [
            'suggested_grade' => $gradeValue,
            'grade_label' => $gradeEnum?->label(),
            'confidence' => $scoring['confidence'],
            'total_score' => $scoring['total_score'],
            'breakdown' => $scoring['breakdown'],
            'reasoning' => $scoring['reasoning'],
            'is_auto_assignable' => $scoring['is_auto_assignable'],
            'warnings' => $this->getGradeWarnings($scoring, $item),
        ],
    ]);
}
```

---

## 📊 Reglas de Validación por Tipo

### **Campos Comunes** (Todos los tipos)

| Campo               | Tipo   | Obligatorio | Valores Permitidos                                                | Notas                                       |
| ------------------- | ------ | ----------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `brand`             | string | ❌          | -                                                                 | Marca del equipo (Dell, HP, Lenovo)         |
| `model`             | string | ❌          | -                                                                 | Modelo exacto                               |
| `general_condition` | string | ❌          | `like_new`, `good_shape`, `visible_wear`, `needs_repair`, `scrap` | Estado general                              |
| `observations`      | string | ❌          | -                                                                 | Notas libres                                |
| `extra_attributes`  | object | ❌          | -                                                                 | Contenedor para atributos no estandarizados |

---

### **Notebook** (40+ campos específicos)

#### **Hardware**

| Campo                | Tipo   | Obligatorio | Valores/Formato                           | Impact en Grado |
| -------------------- | ------ | ----------- | ----------------------------------------- | --------------- |
| `processor`          | string | ❌          | "Intel i5-8250U", "Ryzen 5 3500U"         | -               |
| `ram_size`           | string | ❌          | "8GB", "16GB", "32GB"                     | -               |
| `ram_slots`          | string | ❌          | "8x2", "16x1" (formato: total x cantidad) | -               |
| `ram_type`           | string | ❌          | "DDR4", "DDR5", "LPDDR4"                  | -               |
| `storage_size`       | string | ❌          | "256GB", "512GB", "1TB"                   | -               |
| `storage_technology` | string | ❌          | `HDD`, `SSD`, `M2`, `NVME`, `HYBRID`      | -               |

#### **Pantalla**

| Campo              | Tipo    | Obligatorio | Valores                                             | Impact en Grado |
| ------------------ | ------- | ----------- | --------------------------------------------------- | --------------- |
| `screen_inches`    | string  | ❌          | "14\"", "15.6\"", "17\""                            | -               |
| `screen_condition` | string  | ❌          | `ok`, `minor_wear`, `worn`, `dead_pixels`, `broken` | **CRÍTICO**     |
| `is_touchscreen`   | boolean | ❌          | -                                                   | -               |

**🚨 Reglas de Grado - Pantalla:**

- `ok` → Permite Grado A
- `minor_wear` → Permite Grado A (detalles leves)
- `worn` → **Máximo Grado B** (1 mancha blanca máximo)
- `broken` → **Grado M** (píxeles muertos excesivos)

#### **Carcasa**

| Campo                | Tipo   | Obligatorio | Valores                                                             | Impact en Grado |
| -------------------- | ------ | ----------- | ------------------------------------------------------------------- | --------------- |
| `cover_condition`    | string | ❌          | `ok`, `minor_wear`, `worn`, `missing_pieces`, `scratched`, `broken` | **CRÍTICO**     |
| `keyboard_condition` | string | ❌          | `ok`, `worn`, `missing_pieces`, `broken`                            | **CRÍTICO**     |
| `keyboard_layout`    | string | ❌          | `es`, `us`, `latam`                                                 | -               |
| `hinge_condition`    | string | ❌          | `ok`, `worn`, `missing_pieces`, `broken`                            | Alto            |
| `touchpad_condition` | string | ❌          | `ok`, `worn`, `missing_pieces`, `broken`                            | Medio           |
| `bottom_condition`   | string | ❌          | `ok`, `worn`, `missing_pieces`, `scratched`, `broken`               | Bajo            |

**🚨 Reglas de Grado - Carcasa:**

- `missing_pieces` en tapa → **Máximo Grado C**
- `keyboard_condition: missing_pieces` → **Máximo 1 tecla dañada = Grado C**
- **Más de 1 tecla dañada** → **Grado M automático**

#### **Batería**

| Campo                | Tipo            | Obligatorio | Valores                                                   | Impact en Grado                                  |
| -------------------- | --------------- | ----------- | --------------------------------------------------------- | ------------------------------------------------ |
| `battery_health`     | string          | ❌          | "75%", "GOOD", texto libre                                | Bajo                                             |
| `battery_status`     | string\|integer | ❌          | `excellent`, `good`, `fair`, `poor`, `no_battery` o 0-100 | Alto                                             |
| `battery_percentage` | integer         | ❌          | 0-100                                                     | Auto-calculado si se envía % en `battery_status` |

**🚨 Reglas de Grado - Batería:**

- `excellent` (>80%) → +20 puntos
- `good` (60-80%) → +15 puntos
- `fair` (40-60%) → +10 puntos
- `poor` (<40%) → +5 puntos
- `no_battery` → 0 puntos (no afecta negativamente)

#### **Puertos**

| Campo                   | Tipo    | Obligatorio | Valores | Impact en Grado |
| ----------------------- | ------- | ----------- | ------- | --------------- |
| `vga_ports`             | integer | ❌          | 0+      | -               |
| `hdmi_ports`            | integer | ❌          | 0+      | -               |
| `displayport_ports`     | integer | ❌          | 0+      | -               |
| `usb_a_ports`           | integer | ❌          | 0+      | -               |
| `usb_c_ports`           | integer | ❌          | 0+      | -               |
| `sd_readers`            | integer | ❌          | 0+      | -               |
| `rj45_ports`            | integer | ❌          | 0+      | -               |
| `all_ports_functional`  | boolean | ❌          | -       | Alto            |
| `defective_ports_count` | integer | ❌          | 0+      | **CRÍTICO**     |

**🚨 Reglas de Grado - Puertos:**

- `defective_ports_count === 1` → **Máximo Grado C**
- `defective_ports_count > 1` → **Grado M automático**
- Esta regla aplica **independientemente de todo lo demás**

#### **Accesorios**

| Campo              | Tipo    | Obligatorio | Valores                                                                       | Impact en Grado |
| ------------------ | ------- | ----------- | ----------------------------------------------------------------------------- | --------------- |
| `includes_charger` | boolean | ❌          | -                                                                             | -               |
| `charger_watts`    | string  | ❌          | "45W", "65W", "90W"                                                           | -               |
| `charger_status`   | string  | ❌          | `buen_estado`, `cable_en_mal_estado`, `no_corresponde_a_equipo`, `no_incluye` | Bajo            |

#### **Otros**

| Campo                  | Tipo    | Obligatorio | Valores                                   |
| ---------------------- | ------- | ----------- | ----------------------------------------- |
| `has_biometric`        | boolean | ❌          | -                                         |
| `has_wifi`             | boolean | ❌          | -                                         |
| `has_bluetooth`        | boolean | ❌          | -                                         |
| `has_numeric_keypad`   | boolean | ❌          | -                                         |
| `has_backlit_keyboard` | boolean | ❌          | -                                         |
| `operating_system`     | string  | ❌          | "Windows 10 Pro", "Windows 11 Home", etc. |

---

### **Desktop** (20+ campos)

Similar a Notebook pero sin:

- Batería
- Pantalla
- Bisagras
- Touchpad

Agrega:

- `has_cd_drive` (boolean)

---

### **AIO** (30+ campos)

Combina:

- Hardware de Desktop
- Pantalla de Monitor
- Base de Monitor

Campos únicos:

- `stand_condition`: `ok`, `worn`, `missing_pieces`, `scratched`, `broken`, `no_stand`

---

### **Docking** (15+ campos)

Campos básicos:

- `line` (string): Línea de producto
- `includes_power_adapter` (boolean)
- Puertos (similar a otros)
- `cover_condition`

---

### **Monitor** (18+ campos)

| Campo                            | Tipo    | Valores                  |
| -------------------------------- | ------- | ------------------------ |
| `screen_inches`                  | string  | "24\"", "27\""           |
| `resolution`                     | string  | "1920x1080", "2560x1440" |
| `screen_condition`               | string  | Similar a notebook       |
| `stand_condition`                | string  | Con opción `no_stand`    |
| `frame_condition`                | string  | Estado del marco         |
| `includes_power_cable`           | boolean | -                        |
| `includes_video_cable`           | boolean | -                        |
| `includes_stand`                 | boolean | -                        |
| `has_usb_hub`                    | boolean | -                        |
| `usb_hub_ports`                  | integer | 0+                       |
| `dvi_ports`                      | integer | 0+                       |
| `defective_ports_critical_count` | integer | Puertos HDMI/DP críticos |

**🚨 Regla Especial - Monitor:**

- `defective_ports_critical_count === 1` → **Máximo Grado C**
- `defective_ports_critical_count > 1` → **Grado M automático**
- Puertos críticos: HDMI, DisplayPort (esenciales para operación)

---

## 🔧 Frontend Actual

### **Items Flow** (`items/[itemId].tsx`)

**Problema Detectado:**

```typescript
// ❌ MEZCLANDO FLUJOS
const { itemId, batchId: batchIdFromPath } = useParams<{ itemId: string; batchId?: string }>();
const batchIdFromQuery = query.get('batch_id');
const batchIdToUse = batchIdFromPath || batchIdFromQuery;
const isBatchFlow = Boolean(batchIdToUse);
```

**Lógica actual:**

- Acepta `batchId` desde path o query
- Determina si es "flujo de batch" dinámicamente
- Mezcla responsabilidades de 2 flujos diferentes

### **Thunks de Validación** (`validationThunks.ts`)

✅ **BIEN IMPLEMENTADO:**

```typescript
export const fetchValidationRules = createAsyncThunk<IValidationRules, ...>(...);
export const fetchValidationRulesByType = createAsyncThunk<IValidationRule[], ...>(...);
export const validateField = createAsyncThunk<{ valid: boolean; message?: string }, ...>(...);
export const suggestGrade = createAsyncThunk<{ suggested_grade: string; ... }, ...>(...);
export const getMyCommonErrors = createAsyncThunk<any[], ...>(...);
export const getErrorStatistics = createAsyncThunk<any, ...>(...);
```

### **Formularios** (NotebookForm, DesktopForm, etc.)

⚠️ **USO PARCIAL:**

```typescript
// En NotebookForm.tsx
const validationRules = useAppSelector((s) => s.technicalReviews.validationRules);
const validationLoading = useAppSelector((s) => s.technicalReviews.validationRulesLoading);

useEffect(() => {
	if (branchId) {
		dispatch(fetchValidationRulesByType({ branchId, equipmentType: 'notebook' }));
	}
}, [dispatch, branchId]);
```

**Pero:**

- ❌ No se usan las reglas para generar campos dinámicamente
- ❌ No se usa `validateField` en tiempo real
- ❌ No se usa `suggestGrade` después de completar
- ❌ Opciones hardcodeadas en componentes

---

## 🚨 Problemas Identificados

### **1. Separación de Flujos**

**Items Flow vs Batches Flow:**

| Aspecto              | Items (`/items/create`)           | Batches (`/batches/{id}/items/create`)              |
| -------------------- | --------------------------------- | --------------------------------------------------- |
| URL                  | `/technical-reviews/items/create` | `/technical-reviews/batches/{batchId}/items/create` |
| batch_id             | ❌ null (opcional)                | ✅ Requerido desde path                             |
| warehouse_id         | ✅ Requerido                      | ❌ No aplica (heredado de batch)                    |
| customer_supplier_id | ✅ Requerido                      | ❌ No aplica (heredado de batch)                    |
| Navegación Back      | `/technical-reviews/items`        | `/technical-reviews/batches/{batchId}`              |
| Auto-save            | ✅ Con warehouse tracking         | ✅ Con batch tracking                               |

**Problema Actual:**

```typescript
// items/[itemId].tsx - Línea 58
const { itemId, batchId: batchIdFromPath } = useParams<{ itemId: string; batchId?: string }>();
// ❌ Este componente NO debería recibir batchId
```

**Solución:**

```typescript
// items/[itemId].tsx
const { itemId } = useParams<{ itemId: string }>();
// ✅ Solo itemId, sin batchId
```

### **2. Validaciones No Utilizadas**

**Backend provee:**

- ✅ Validación en tiempo real por campo
- ✅ Sugerencia de grado automática
- ✅ Warnings basados en reglas
- ✅ Historial de errores comunes

**Frontend usa:**

- ✅ Fetching de reglas
- ❌ **NO** valida campos en tiempo real
- ❌ **NO** muestra sugerencia de grado
- ❌ **NO** muestra warnings
- ❌ **NO** rastrea errores comunes

### **3. Hardcoded Options**

**NotebookForm.tsx:**

```typescript
// ❌ HARDCODED
const storageOptions = [
	{ value: 'HDD', label: 'Disco duro (HDD)' },
	{ value: 'SSD', label: 'Unidad sólida (SSD)' },
	{ value: 'M2', label: 'M.2' },
	{ value: 'NVME', label: 'NVMe' },
	{ value: 'HYBRID', label: 'Híbrido' },
];
```

**Debería ser:**

```typescript
// ✅ DINÁMICO
const storageOptions = useMemo(() => {
	const rule = validationRules?.storage_technology;
	return rule?.options || [];
}, [validationRules]);
```

---

## ✅ Recomendaciones

### **1. Separar Flujos Completamente**

#### **Opción A: Eliminar lógica de batch de items/[itemId].tsx**

```typescript
// items/[itemId].tsx
const { itemId } = useParams<{ itemId: string }>();
// NO aceptar batchId en absoluto
// Siempre requerir warehouse_id y customer_supplier_id
```

#### **Opción B: Mantener componente compartido pero con props claras**

```typescript
// components/ItemReviewForm.tsx (componente compartido)
interface ItemReviewFormProps {
	mode: 'standalone' | 'batch';
	batchId?: number; // Solo si mode === 'batch'
	itemId?: string;
}
```

**Recomendación:** **Opción A** - Separación completa es más limpia

### **2. Implementar Validación en Tiempo Real**

```typescript
// Hook personalizado
const useFieldValidation = (equipmentType: EquipmentType, fieldName: string) => {
	const [error, setError] = useState<string | null>(null);
	const [warning, setWarning] = useState<string | null>(null);

	const validate = useCallback(
		async (value: any) => {
			const result = await dispatch(
				validateField({
					branchId,
					data: {
						equipment_type: equipmentType,
						field_name: fieldName,
						field_value: value,
					},
				}),
			).unwrap();

			if (!result.valid) {
				setError(result.errors?.[0] || 'Error de validación');
			} else {
				setError(null);
			}

			setWarning(result.warnings?.[0] || null);
		},
		[dispatch, branchId, equipmentType, fieldName],
	);

	return { validate, error, warning };
};
```

**Uso:**

```typescript
const { validate, error } = useFieldValidation('notebook', 'processor');

<Input
    value={processor}
    onChange={(e) => {
        setProcessor(e.target.value);
        validate(e.target.value);
    }}
    invalidFeedback={error}
    isValid={!error}
/>
```

### **3. Generar Campos Dinámicamente**

```typescript
// components/DynamicForm.tsx
const DynamicForm: React.FC<{ equipmentType: EquipmentType }> = ({ equipmentType }) => {
    const validationRules = useAppSelector((s) => s.technicalReviews.validationRules);
    const typeRules = validationRules?.types?.[equipmentType] || {};
    const commonRules = validationRules?.common || {};

    const allFields = useMemo(() => {
        return Object.entries({ ...commonRules, ...typeRules }).map(([key, rule]) => ({
            name: key,
            ...rule
        }));
    }, [commonRules, typeRules]);

    return (
        <div>
            {allFields.map((field) => (
                <DynamicField key={field.name} field={field} />
            ))}
        </div>
    );
};
```

### **4. Mostrar Sugerencia de Grado**

```typescript
// Step 3: Grading
const [gradePreview, setGradePreview] = useState<any>(null);

useEffect(() => {
    if (item && item.id && currentStep === 'grading') {
        dispatch(suggestGrade({ branchId, itemId: item.id }))
            .unwrap()
            .then((result) => setGradePreview(result));
    }
}, [item, currentStep]);

return (
    <Card>
        <CardHeader>
            <h3>Sugerencia de Grado Automático</h3>
        </CardHeader>
        <CardBody>
            {gradePreview && (
                <>
                    <div className="text-4xl font-bold text-blue-600">
                        {gradePreview.suggested_grade}
                    </div>
                    <div className="text-sm text-gray-600">
                        Confianza: {gradePreview.confidence}%
                    </div>
                    <div className="mt-4">
                        <h4>Desglose:</h4>
                        <pre>{JSON.stringify(gradePreview.breakdown, null, 2)}</pre>
                    </div>
                    {gradePreview.warnings?.map((w: any) => (
                        <Alert key={w.type} color="warning">{w.message}</Alert>
                    ))}
                </>
            )}
        </CardBody>
    </Card>
);
```

### **5. Tracking de Errores Comunes**

```typescript
// Mostrar errores frecuentes del usuario
const MyCommonErrors: React.FC = () => {
    const [errors, setErrors] = useState<any[]>([]);

    useEffect(() => {
        dispatch(getMyCommonErrors({ branchId }))
            .unwrap()
            .then(setErrors);
    }, []);

    return (
        <Card>
            <CardHeader>
                <h4>Tus Errores Más Comunes</h4>
            </CardHeader>
            <CardBody>
                {errors.map((error, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2">
                        <span>{error.field_name}: {error.message}</span>
                        <Badge>{error.occurrences}x</Badge>
                    </div>
                ))}
            </CardBody>
        </Card>
    );
};
```

---

## 📝 Plan de Implementación

### **Fase 1: Separación de Flujos** (Prioridad Alta)

1. ✅ Remover lógica de `batchId` de `items/[itemId].tsx`
2. ✅ Asegurar que `batch` use su propio componente
3. ✅ Actualizar routing para evitar ambigüedad

### **Fase 2: Validación en Tiempo Real** (Prioridad Media)

1. ⏳ Crear `useFieldValidation` hook
2. ⏳ Integrar en NotebookForm
3. ⏳ Extender a otros formularios

### **Fase 3: Campos Dinámicos** (Prioridad Baja)

1. ⏳ Crear `DynamicForm` component
2. ⏳ Migrar formularios existentes

### **Fase 4: Sugerencia de Grado** (Prioridad Media)

1. ⏳ Integrar `suggestGrade` en Step 3
2. ⏳ Mostrar breakdown visual
3. ⏳ Permitir override manual

### **Fase 5: Analytics** (Prioridad Baja)

1. ⏳ Dashboard de errores comunes
2. ⏳ Estadísticas de validación
3. ⏳ Reportes de calidad

---

## 🔮 Mejoras Futuras

### **1. Auto-fill Inteligente**

```typescript
// Basado en errores comunes, sugerir valores
if (field.name === 'ram_size' && mostCommonError === 'formato incorrecto') {
	setHelpText('Usa formato: 8GB, 16GB, etc.');
	setSuggestedValue('16GB');
}
```

### **2. Validación Cruzada**

```typescript
// Validar dependencias entre campos
if (field.depends_on) {
	const dependencyValue = values[field.depends_on.field];
	if (dependencyValue !== field.depends_on.value) {
		setWarning(`Este campo requiere ${field.depends_on.field} = ${field.depends_on.value}`);
	}
}
```

### **3. Scoring en Vivo**

```typescript
// Mostrar score parcial mientras se llena
const [partialScore, setPartialScore] = useState<number>(0);

useEffect(() => {
	// Calcular score local basado en campos completados
	const score = calculatePartialScore(values);
	setPartialScore(score);
}, [values]);
```

---

## ✅ Conclusión

**Estado Actual:**

- ✅ Backend: Completo y robusto
- ⚠️ Frontend: Parcialmente implementado
- ❌ Separación de flujos: Mezclados

**Próximos Pasos:**

1. **Inmediato**: Separar flujos items/batches completamente
2. **Corto plazo**: Implementar validación en tiempo real
3. **Mediano plazo**: Campos dinámicos y sugerencia de grado
4. **Largo plazo**: Analytics y auto-fill inteligente

**Beneficios Esperados:**

- 🎯 UX mejorada con validación instantánea
- 📉 Reducción de errores de entrada
- ⚡ Scoring automático más confiable
- 📊 Insights sobre calidad de revisiones
