# 📋 Sistema de Permisos: `access` vs `visible`

## 🎯 Concepto General

El backend (endpoint `/api/perfil`) devuelve dos objetos clave para el control de acceso del usuario:

- **`access`**: Lo que el usuario **PUEDE MODIFICAR/GESTIONAR**
- **`visible`**: Lo que el usuario **PUEDE VER/CONSULTAR**

---

## 🏗️ Estructura de Datos

### Respuesta del endpoint `/api/perfil`:

```json
{
  "user": {
    "pk": 1,
    "email": "usuario@ejemplo.cl",
    "branch": {
      "id": 1,
      "branch_name": "Casa Matriz",
      "subsidiary_id": 1
    }
  },
  "access": {
    "subsidiaries": [
      { "id": 1, "name": "EcoPC", "source": "direct" },
      { "id": 2, "name": "EcoTI", "source": "direct" },
      { "id": 3, "name": "RentaPC", "source": "direct" }
    ],
    "branches": [
      { "id": 1, "name": "Casa Matriz", "subsidiary": {...}, "is_primary": true },
      { "id": 2, "name": "Sucursal Ñuñoa", "subsidiary": {...} }
    ]
  },
  "visible": {
    "subsidiaries": [
      { "id": 1, "name": "EcoPC" },
      { "id": 2, "name": "EcoTI" },
      { "id": 3, "name": "RentaPC" },
      { "id": 4, "name": "Digital Innovate" }  // ← PUEDE VER pero NO modificar
    ],
    "branches": [
      { "id": 1, "name": "Casa Matriz" },
      { "id": 2, "name": "Sucursal Ñuñoa" },
      { "id": 5, "name": "Casa Matriz Digital Innovate" },  // ← PUEDE VER pero NO modificar
      { "id": 6, "name": "Centro Desarrollo" }
    ]
  }
}
```

---

## 🔐 `access` - Control de Escritura

### ¿Para qué sirve?

Define las **subsidiarias y sucursales** donde el usuario tiene **permisos de modificación**:

- ✅ Crear productos
- ✅ Editar clientes
- ✅ Eliminar proveedores
- ✅ Gestionar inventario
- ✅ Realizar transferencias

### Uso en el Frontend:

```typescript
// Validar antes de hacer POST/PUT/DELETE
const accessibleSubsidiaryIds = user.access.subsidiaries.map((s) => s.id);
// [1, 2, 3]

if (!accessibleSubsidiaryIds.includes(subsidiaryId)) {
	// ❌ NO permitir la acción
	toast.error('No tienes permisos para modificar esta subsidiaria');
	return;
}

// ✅ OK, proceder con la acción
dispatch(createProduct({ subsidiaryId, ...data }));
```

### Ejemplo de Casos de Uso:

| Acción                              | Requiere `access` | Validación            |
| ----------------------------------- | ----------------- | --------------------- |
| Ver listado de productos            | ❌ No             | Usar `visible`        |
| Crear nuevo producto                | ✅ Sí             | `access.subsidiaries` |
| Editar cliente                      | ✅ Sí             | `access.subsidiaries` |
| Eliminar proveedor                  | ✅ Sí             | `access.subsidiaries` |
| Transferir inventario entre bodegas | ✅ Sí             | `access.branches`     |

---

## 👁️ `visible` - Control de Lectura

### ¿Para qué sirve?

Define las **subsidiarias y sucursales** que el usuario puede **ver en dropdowns y consultas**:

- ✅ Ver en selector de subsidiarias (dropdown)
- ✅ Consultar listados (GET requests)
- ✅ Ver reportes de solo lectura
- ✅ Comparar datos entre subsidiarias

### Uso en el Frontend:

```typescript
// Poblar dropdown de selección de subsidiaria
const visibleSubsidiaries = user.visible.subsidiaries;
// [1, 2, 3, 4] ← Incluye subsidiaria 4 que NO está en access

<Select
  options={visibleSubsidiaries.map(s => ({
    value: s.id,
    label: s.name
  }))}
  onChange={handleChange}
/>
```

### Ejemplo de Casos de Uso:

| Acción                            | Requiere `visible` | Validación             |
| --------------------------------- | ------------------ | ---------------------- |
| Dropdown de subsidiarias          | ✅ Sí              | `visible.subsidiaries` |
| Ver productos de otra subsidiaria | ✅ Sí              | `visible.subsidiaries` |
| Comparar inventarios              | ✅ Sí              | `visible.subsidiaries` |
| Reportes multi-subsidiaria        | ✅ Sí              | `visible.subsidiaries` |

---

## 🎯 Diferencia Clave: `subsidiaryId` vs `branchId`

### `subsidiaryId` (Subsidiaria)

- **Nivel**: Empresa > **Subsidiaria** > Sucursal
- **Ejemplo**: "EcoPC", "EcoTI", "RentaPC"
- **Uso**: Control de acceso a nivel de **división de negocio**
- **En API**: `/api/subsidiaries/{subsidiaryId}/products`

### `branchId` (Sucursal)

- **Nivel**: Empresa > Subsidiaria > **Sucursal**
- **Ejemplo**: "Casa Matriz EcoPC", "EcoPC Ñuñoa", "Laboratorio EcoTI"
- **Uso**: Control de acceso a nivel de **ubicación física**
- **En API**: `/api/branches/{branchId}/warehouses`

### Jerarquía Visual:

```
🏢 EcoTech SPA (Company)
    ├── 🏭 EcoPC (Subsidiary ID: 1)
    │   ├── 📍 Casa Matriz EcoPC (Branch ID: 1)
    │   └── 📍 EcoPC Ñuñoa (Branch ID: 2)
    │
    ├── 🏭 EcoTI (Subsidiary ID: 2)
    │   └── 📍 Laboratorio EcoTI (Branch ID: 3)
    │
    └── 🏭 RentaPC (Subsidiary ID: 3)
        └── 📍 Oficina RentaPC (Branch ID: 4)

🏢 Digital Innovate SpA (Company)
    └── 🏭 Digital Innovate Centro (Subsidiary ID: 4)
        ├── 📍 Casa Matriz DI (Branch ID: 5)
        └── 📍 Centro Desarrollo DI (Branch ID: 6)
```

---

## 🔄 Flujo Típico en el Frontend

### 1️⃣ Usuario selecciona subsidiaria del dropdown

```
Usuario ve dropdown con: [EcoPC, EcoTI, RentaPC, Digital Innovate]
                          ↑ De visible.subsidiaries (4 opciones)

Usuario selecciona: "Digital Innovate" (ID: 4)
```

### 2️⃣ Validación de acceso antes de acción

```
¿Usuario quiere crear producto?
  ↓
Verificar: ¿4 está en access.subsidiaries?
  ↓
NO → [1, 2, 3] ← Solo tiene acceso a estas
  ↓
❌ Mostrar error: "No tienes permisos para modificar esta subsidiaria"
```

### 3️⃣ Permitir solo lectura

```
¿Usuario quiere VER productos?
  ↓
Verificar: ¿4 está en visible.subsidiaries?
  ↓
SÍ → [1, 2, 3, 4] ← Puede ver estas
  ↓
✅ Hacer GET /api/subsidiaries/4/products (solo lectura)
```

---

## 📚 Patrones de Implementación

### ✅ Patrón Correcto: Validación Doble

```typescript
// 1. Dropdown usa VISIBLE
const dropdownOptions = user.visible.subsidiaries;

// 2. Al seleccionar, validar si tiene ACCESS
const handleSelectSubsidiary = (subsidiaryId: number) => {
	const hasAccess = user.access.subsidiaries.some((s) => s.id === subsidiaryId);

	if (hasAccess) {
		// ✅ Mostrar botones: Crear, Editar, Eliminar
		setCanModify(true);
	} else {
		// 👁️ Solo lectura: Mostrar datos pero deshabilitar acciones
		setCanModify(false);
		toast.info('Solo puedes consultar esta subsidiaria');
	}

	// Cargar datos (siempre permitido para visible)
	dispatch(fetchProducts({ subsidiaryId }));
};
```

### ❌ Patrón Incorrecto: Usar solo visible

```typescript
// ❌ MAL: Asume que si puede ver, puede modificar
const dropdownOptions = user.visible.subsidiaries;

// Usuario selecciona subsidiaria 4
dispatch(createProduct({ subsidiaryId: 4, ...data }));
// ❌ Backend devuelve 403 Forbidden - Usuario no tiene acceso
```

---

## 🎨 UI/UX Recomendado

### Caso 1: Subsidiaria con `access` ✅

```
┌─────────────────────────────────────┐
│ 🏭 EcoPC                            │
│ ┌────────┐ ┌────────┐ ┌──────────┐│
│ │+ Crear │ │✏️ Editar│ │🗑️ Eliminar││
│ └────────┘ └────────┘ └──────────┘│
│                                     │
│ [Lista de productos editable]       │
└─────────────────────────────────────┘
```

### Caso 2: Subsidiaria con solo `visible` 👁️

```
┌─────────────────────────────────────┐
│ 🏭 Digital Innovate (Solo lectura) │
│ ℹ️ No tienes permisos de edición   │
│                                     │
│ [Lista de productos - solo vista]   │
│ ❌ Botones de acción deshabilitados │
└─────────────────────────────────────┘
```

---

## 🚨 Casos Especiales

### 1. Usuario sin `access` ni `visible`

```typescript
// Usuario nuevo o sin asignaciones
access.subsidiaries = [];
visible.subsidiaries = [];

// ❌ No mostrar dropdown
// ❌ Mostrar mensaje: "No tienes subsidiarias asignadas"
```

### 2. Usuario con `access` pero sin `visible` (raro)

```typescript
// Caso edge: puede modificar pero no ve en dropdown
access.subsidiaries = [1, 2, 3];
visible.subsidiaries = [];

// ⚠️ Usar access.subsidiaries como fallback para visible
const subsidiariesToShow =
	visible.subsidiaries.length > 0 ? visible.subsidiaries : access.subsidiaries;
```

### 3. `branch.subsidiary_id` - Subsidiaria actual del usuario

```typescript
user.branch = {
	id: 1,
	name: 'Casa Matriz EcoPC',
	subsidiary_id: 1, // ← Usuario está asignado a subsidiaria 1
};

// ✅ Usar como subsidiaria por defecto en selección
const defaultSubsidiaryId = user.branch.subsidiary_id;
```

---

## 📝 Checklist para Nuevas Funcionalidades

Cuando implementes una nueva página o funcionalidad:

- [ ] **1. Dropdown/Selector:** Usar `visible.subsidiaries` o `visible.branches`
- [ ] **2. Acciones de escritura (POST/PUT/DELETE):** Validar con `access.subsidiaries`
- [ ] **3. Acciones de lectura (GET):** Permitir si está en `visible.subsidiaries`
- [ ] **4. UI:** Deshabilitar botones de acción si solo tiene `visible` pero no `access`
- [ ] **5. Mensajes:** Informar al usuario cuando está en modo solo lectura
- [ ] **6. Fallback:** Si `visible` vacío, usar `access` como fallback
- [ ] **7. Default:** Usar `user.branch.subsidiary_id` como subsidiaria inicial

---

## 🎓 Reglas Mnemotécnicas

| Concepto         | Regla                         | Emoji |
| ---------------- | ----------------------------- | ----- |
| **access**       | "Puedo **TOCAR** (modificar)" | ✋    |
| **visible**      | "Puedo **VER** (consultar)"   | 👁️    |
| **subsidiaryId** | "**DIVISIÓN** de negocio"     | 🏭    |
| **branchId**     | "**UBICACIÓN** física"        | 📍    |

### Nemotecnia Visual:

```
¿Qué puedo hacer?
  ↓
👁️ VISIBLE → Ver dropdown, consultar datos (GET)
✋ ACCESS → Crear, Editar, Eliminar (POST/PUT/DELETE)
```

---

## 🪝 Hooks Personalizados para Filtrado

### `useClientes` y `useProveedores`

Estos hooks encapsulan toda la lógica de validación de acceso y filtrado de datos.

#### 📦 Ubicación:

- `src/pages/catalogos/clientes/components/hooks/useClientes.ts`
- `src/pages/catalogos/proveedores/components/hooks/useProveedores.ts`

#### 🎯 Propósito:

1. **Extraer subsidiarias accesibles** desde `user.access.subsidiaries`
2. **Validar el subsidiaryId** antes de hacer fetch
3. **Retornar null** si el usuario no tiene acceso
4. **Evitar llamadas 404** al backend

#### 📝 Firma del Hook:

```typescript
interface UseClientesParams {
  subsidiaryId?: number | null;  // Subsidiaria a consultar
  filters: ICustomerSupplierFilters;  // Filtros de búsqueda
}

function useClientes({ subsidiaryId, filters }: UseClientesParams) {
  return {
    customers: ICustomerSupplier[],  // Datos filtrados
    stats: { total_customers, with_suppliers, ... },  // Estadísticas
    loading: boolean,  // Estado de carga
    activeSubsidiaryId: number | null  // ID validado o null
  }
}
```

#### 🔧 Uso en Componente:

```typescript
// ❌ ANTES: Sin validación
const Clientes = () => {
  const subsidiaryId = useAppSelector(s => s.personalizacion.sucursal_principal);

  useEffect(() => {
    // Problema: No valida si tiene acceso
    dispatch(fetchCustomerSuppliers({ subsidiaryId }));
  }, [subsidiaryId]);
};

// ✅ AHORA: Con hook de validación
const Clientes = () => {
  const subsidiaryId = useAppSelector(s => s.personalizacion.sucursal_principal);

  const {
    customers,      // Ya filtrados y validados
    stats,          // Estadísticas calculadas
    loading,        // Estado de carga
    activeSubsidiaryId  // null si no tiene acceso
  } = useClientes({
    subsidiaryId,
    filters: { search: '' }
  });

  // El hook ya hizo toda la validación internamente
  if (!activeSubsidiaryId) {
    return <NoAccessMessage />;
  }

  return <CustomersList customers={customers} />;
};
```

#### 🔍 Lógica Interna del Hook:

```typescript
// 1. Extraer subsidiarias accesibles
const accessibleSubsidiaryIds = useMemo(() => {
	const subsidiaries = new Set<number>();

	user.access?.subsidiaries?.forEach((sub: any) => {
		if (sub?.id) subsidiaries.add(sub.id);
	});

	return subsidiaries; // Set(1, 2, 3)
}, [currentUser]);

// 2. Validar subsidiaryId antes de fetch
const activeSubsidiaryId = useMemo(() => {
	// Validaciones básicas
	if (!subsidiaryId || subsidiaryId === 0) return null;

	// ✅ VALIDACIÓN CLAVE: ¿Usuario tiene acceso?
	if (currentUser && accessibleSubsidiaryIds.size > 0) {
		if (!accessibleSubsidiaryIds.has(subsidiaryId)) {
			console.warn('🚫 Usuario NO tiene acceso a subsidiaria:', subsidiaryId);
			return null; // ❌ Bloquear fetch
		}
	}

	return subsidiaryId; // ✅ OK, permitir fetch
}, [subsidiaryId, accessibleSubsidiaryIds, currentUser]);

// 3. Fetch solo si activeSubsidiaryId es válido
useEffect(() => {
	if (!activeSubsidiaryId) return; // No hace fetch si no tiene acceso

	dispatch(
		fetchCustomerSuppliers({
			subsidiaryId: activeSubsidiaryId,
			search: filters.search,
		}),
	);
}, [activeSubsidiaryId, filters.search]);
```

#### 🎨 Ventajas del Patrón:

| Beneficio         | Descripción                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| **Encapsulación** | Toda la lógica de validación en un solo lugar                           |
| **Reutilizable**  | Mismo patrón para clientes, proveedores, productos                      |
| **Seguridad**     | Imposible hacer fetch sin validar acceso                                |
| **Performance**   | Evita llamadas 404 innecesarias                                         |
| **Debugging**     | Logs centralizados: `🔐 useClientes - Subsidiarias accesibles: [1,2,3]` |

#### 🔄 Flujo Completo:

```
Usuario cambia subsidiaria
  ↓
useClientes({ subsidiaryId: 4, filters })
  ↓
Hook extrae: user.access.subsidiaries = [1, 2, 3]
  ↓
Valida: ¿4 está en [1, 2, 3]?
  ↓
NO → activeSubsidiaryId = null
  ↓
useEffect ve null → NO hace fetch
  ↓
Componente recibe: activeSubsidiaryId = null
  ↓
Muestra: "No tienes acceso a esta subsidiaria"
```

#### 🚨 Casos Edge Manejados:

```typescript
// 1. currentUser aún no cargado
if (!currentUser) {
	return null; // Esperar carga del usuario
}

// 2. subsidiaryId es null/undefined/0
if (!subsidiaryId) {
	return null; // No hacer fetch
}

// 3. access.subsidiaries vacío (usuario sin asignaciones)
if (accessibleSubsidiaryIds.size === 0) {
	console.warn('⚠️ Usuario sin subsidiarias accesibles');
	// Permitir fetch como fallback (puede ser super admin)
}

// 4. subsidiaryId no está en access
if (!accessibleSubsidiaryIds.has(subsidiaryId)) {
	console.warn('🚫 Usuario NO tiene acceso');
	return null; // Bloquear fetch
}
```

#### 📊 Logs de Debugging:

El hook genera logs claros para debugging:

```
🔐 useClientes - Subsidiarias accesibles: [1, 2, 3] User: 1 access: {...}
🔄 useClientes - Calculando activeSubsidiaryId: {subsidiaryId: 4, currentUser: 1, accessibleCount: 3}
� useClientes - Usuario NO tiene acceso a subsidiaria: 4 - Accesibles: [1, 2, 3]
⚠️ useClientes - subsidiaryId inválido: null
```

---

## 🎓 Cómo Crear un Nuevo Hook Similar

Para módulos nuevos (ej: productos, bodegas), sigue este patrón:

```typescript
// src/pages/inventario/productos/hooks/useProductos.ts
export function useProductos({ subsidiaryId, filters }: UseProductosParams) {
	const dispatch = useAppDispatch();
	const { items, loading } = useAppSelector((s) => s.productos);
	const currentUser = useAppSelector((s) => s.auth.user);

	// 1️⃣ Extraer subsidiarias accesibles
	const accessibleSubsidiaryIds = useMemo(() => {
		const subsidiaries = new Set<number>();
		(currentUser as any)?.access?.subsidiaries?.forEach((sub: any) => {
			if (sub?.id) subsidiaries.add(sub.id);
		});
		return subsidiaries;
	}, [currentUser]);

	// 2️⃣ Validar subsidiaryId
	const activeSubsidiaryId = useMemo<number | null>(() => {
		if (!subsidiaryId) return null;

		if (currentUser && accessibleSubsidiaryIds.size > 0) {
			if (!accessibleSubsidiaryIds.has(subsidiaryId)) {
				console.warn('🚫 useProductos - Sin acceso a subsidiaria:', subsidiaryId);
				return null;
			}
		}

		return subsidiaryId;
	}, [subsidiaryId, accessibleSubsidiaryIds, currentUser]);

	// 3️⃣ Fetch con validación
	useEffect(() => {
		if (!activeSubsidiaryId) return;

		void dispatch(
			fetchProductos({
				subsidiaryId: activeSubsidiaryId,
				...filters,
			}),
		);
	}, [dispatch, activeSubsidiaryId, filters]);

	// 4️⃣ Retornar datos procesados
	return {
		productos: items,
		loading,
		activeSubsidiaryId,
	};
}
```

---

## �🔗 Referencias en el Código

### Frontend:

- **Store:** `src/store/slices/auth/authSlice.ts` - Guarda `access` y `visible` en `state.auth.user`
- **Hooks:**
    - `src/pages/catalogos/clientes/components/hooks/useClientes.ts` - Validación de acceso para clientes
    - `src/pages/catalogos/proveedores/components/hooks/useProveedores.ts` - Validación de acceso para proveedores
- **Componentes:** `src/templates/layouts/Headers/_partial/SelectSucursalEmpresa.tsx`

### Backend:

- **Endpoint:** `GET /api/perfil`
- **Response:** Incluye objetos `access` y `visible` con subsidiaries y branches

---

## ✅ Resumen Ejecutivo

| Pregunta                                 | Respuesta                                 |
| ---------------------------------------- | ----------------------------------------- |
| ¿Qué usar para dropdown?                 | `visible.subsidiaries`                    |
| ¿Qué usar para validar creación/edición? | `access.subsidiaries`                     |
| ¿Puedo ver subsidiaria 4?                | Si está en `visible` → SÍ                 |
| ¿Puedo editar subsidiaria 4?             | Si está en `access` → SÍ                  |
| ¿subsidiaryId vs branchId?               | subsidiary = división, branch = ubicación |
| ¿Cuál es la subsidiaria por defecto?     | `user.branch.subsidiary_id`               |

---

**Última actualización:** 3 de noviembre de 2025  
**Autor:** Sistema de Documentación ERP Frontend
