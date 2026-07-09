# Changelog — Pestaña Atributos de Producto

## 2026-06-19 — v4: Select de revisiones + búsqueda inteligente por modelo

### Cambios
- **Select en vez de cards**: Las revisiones encontradas se muestran en un `<select>` con `<optgroup>` por grado, en vez de grilla de cards. Escala bien con muchas revisiones.
- **Botón Importar**: Al lado del select, botón violeta "Importar" que trae los datos de la revisión seleccionada.
- **Formato de opciones**: Cada opción muestra `SERIAL — Nombre producto [GRADO]`

## 2026-06-19 — v3: Búsqueda inteligente + fix endpoint attributes

### Cambios
- **Búsqueda progresiva por modelo**: En vez de buscar por SKU o nombre completo (que no matchea), extrae términos del nombre del producto en orden de prioridad:
  1. Primeras 3 palabras limpias (sin "Grado", "Grade", etc.)
  2. Modelo alfanumérico (ej: "M70a" de "AIO LENOVO M70a")
  3. SKU como fallback
- **Filtro flexible**: Primero intenta filtrar por `product.id` exacto; si no hay match muestra todos los resultados del API (la búsqueda ya hizo el matching)
- **React Query**: Hook `useProductReviews` usa `@tanstack/react-query` con `staleTime: 120s`
- **equipment_type filter**: Pasa el tipo de equipo al API para acotar resultados
- **Fix endpoint attributes**: `fetchProductAttributes` y `patchProductAttributes` ahora siempre usan `branches/{branchId}` en vez de seguir el `mode` (el backend no soporta `/subsidiaries/{id}/products/{id}/attributes`)

### Archivos modificados
- `hooks/useProductReviews.ts` — Búsqueda progresiva con `buildSearchTerms()`
- `hooks/useProductDetail.ts` — Attributes siempre via branches
- `AttributesTabPanel.tsx` — Usa `useProductReviews` con params expandidos

---

## 2026-06-19 — v2: Consolidación de tabs + auto-match por product.id

### Cambios
- **Tabs consolidadas**: De 11 tabs → 6 (JSON, Identificación, Hardware & Pantalla, Condición, Puertos, Extras & Notas)
- **JSON al inicio**: La tab JSON es la primera (se abre por defecto para ver el estado actual)
- **Auto-match por product.id**: Ya no busca por SKU sino que filtra items donde `item.product.id === product.id`, usando el endpoint `/branches/{id}/technical-reviews/items?search={sku}&per_page=30`
- **Agrupación por grado**: Las revisiones encontradas se agrupan por grado (A, B, C, M) con badges de color
- **Import con 1 clic**: Cada serial es un botón que importa directamente los `details` sin modal intermedio
- **Sin búsqueda manual**: Se eliminó el modal de búsqueda por serial — la búsqueda es automática y transparente
- **Toast de feedback**: Al importar muestra "Datos importados del serial XXXXX"
- **Secciones consolidadas**: `HardwareScreenSection` (hardware + pantalla), `ConditionSection` (carcasa + teclado + batería), `ExtrasSection` (accesorios + software + observaciones)

### Archivos nuevos
- `sections/HardwareScreenSection.tsx` — Sección unificada hardware + pantalla
- `sections/ConditionSection.tsx` — Sección unificada condición + teclado + batería
- `sections/ExtrasSection.tsx` — Sección unificada accesorios + software + observaciones

### Archivos eliminados (ya no se usan)
- `sections/HardwareSection.tsx`, `sections/ScreenSection.tsx`, `sections/AestheticsSection.tsx`
- `sections/BatterySection.tsx`, `sections/InputSection.tsx`, `sections/AccessoriesSection.tsx`
- `sections/SoftwareSection.tsx`, `sections/ObservationsSection.tsx`
- `components/ImportReviewModal.tsx`

---

## 2026-06-19 — Implementación inicial

### Contexto
La pestaña "Atributos" del producto necesitaba los mismos campos de inspección que las revisiones técnicas (`refactor-technical-review`), sin modificar el módulo de revisiones. Los datos deben vivir en `attributes_json.review` del producto.

### Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `AttributesTabPanel.tsx` | Componente principal con sub-tabs, auto-búsqueda de revisiones, botón importar |
| `index.ts` | Barrel export |
| `types.ts` | `ReviewData`, `ProductKind`, `SubTabConfig`, `ReviewSectionProps` |
| **constants/** | |
| `tabs.config.ts` | Configuración de sub-tabs visibles por tipo de equipo (6 tabs consolidadas) |
| `review-options.ts` | Allowed values para selects — mismos valores que `refactor-technical-review/components/validation/constants/*.rules.ts` |
| **hooks/** | |
| `useReviewAttributes.ts` | Lee/escribe `attributes_json.review` vía Formik; detecta `productKind`; función `importFromReview()` |
| **sections/** | |
| `BasicInfoSection.tsx` | Marca, modelo, línea, condición general |
| `HardwareScreenSection.tsx` | Procesador, RAM, almacenamiento + pantalla (condición, pulgadas, táctil, base, marco) |
| `ConditionSection.tsx` | Carcasa, bisagras, touchpad, parte inferior + teclado + batería (todo según tipo) |
| `PortsSection.tsx` | VGA, HDMI, DP, USB-C/A, SD, RJ45, DVI, USB Hub + funcionalidad |
| `ExtrasSection.tsx` | Accesorios (cargador/cables) + software (OS, WiFi, BT, CD) + observaciones |
| `JsonPreviewSection.tsx` | Vista previa del `attributes_json` completo |
| **components/** | |
| `ImportReviewModal.tsx` | Modal de búsqueda manual por serial → importar datos de revisión técnica |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `AtributosTab.tsx` | Switcher "Revisión técnica" / "Catálogo (specs)" — la vista Revisión usa `AttributesTabPanel`, la vista Catálogo mantiene el `DynamicAttributesEditor` original |

### Campos por tipo de equipo

| Sub-tab | Notebook | Desktop | AIO | Monitor | Docking |
|---------|----------|---------|-----|---------|---------|
| Identificación | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hardware & Pantalla | ✅ (HW + pantalla) | ✅ (solo HW) | ✅ (HW + pantalla + base) | ✅ (solo pantalla + base + marco) | ❌ |
| Condición | ✅ (carcasa + bisagras + touchpad + bottom + teclado + batería) | ✅ (solo carcasa) | ✅ (carcasa) | ✅ (solo condición general) | ✅ (carcasa) |
| Puertos | ✅ | ✅ | ✅ | ✅ (+ DVI, USB Hub) | ✅ |
| Extras & Notas | ✅ (cargador + OS + WiFi + BT + biométrico + obs.) | ✅ (cargador + OS + WiFi + BT + CD + obs.) | ✅ (adaptador + OS + WiFi + BT + CD + obs.) | ✅ (cables + base + obs.) | ✅ (adaptador + obs.) |
| JSON | ✅ | ✅ | ✅ | ✅ | ✅ |

### Allowed values (fuente de verdad)

Los valores permitidos se copiaron de las rules de revisión técnica para mantener consistencia:
- `notebook.rules.ts` → `SCREEN_CONDITIONS_NOTEBOOK`, `COVER_CONDITIONS_NOTEBOOK`, `CHARGER_STATUSES_NOTEBOOK`, etc.
- `desktop.rules.ts` → `COVER_CONDITIONS_DESKTOP`, `CHARGER_STATUSES_DESKTOP`
- `aio.rules.ts` → `SCREEN_CONDITIONS_AIO`, `STAND_CONDITIONS`
- `monitor.rules.ts` → `SCREEN_CONDITIONS_MONITOR`, `STAND_CONDITIONS_MONITOR`, `FRAME_CONDITIONS`
- `docking.rules.ts` → `COVER_CONDITIONS_GENERIC`

### Auto-importación desde revisiones

Al abrir la pestaña Atributos, se busca automáticamente revisiones aprobadas asociadas al SKU del producto usando:
```
GET /branches/{branchId}/technical-reviews/items?search={sku}&review_status=approved&per_page=5
```
Los resultados aparecen como botones "chip" con serial + grado. Al hacer clic se importan los `details` de la revisión al `attributes_json.review`.

### Estructura del JSON

```json
{
  "product_kind": "notebook",
  "category_grade": "A",
  "cpu": { ... },
  "ram": { ... },
  "review": {
    "brand": "Lenovo",
    "model": "ThinkPad T480",
    "general_condition": "good_shape",
    "processor": "Intel Core i5-8350U",
    "ram_size": "8GB",
    "screen_condition": "ok",
    "cover_condition": "minor_wear",
    "battery_status": "good",
    "battery_percentage": 82,
    "all_ports_functional": true,
    "includes_charger": true,
    "operating_system": "Windows 10 Pro",
    "observations": "Equipo en buen estado"
  }
}
```
