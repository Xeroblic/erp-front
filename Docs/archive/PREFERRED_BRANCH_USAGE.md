# Gestión De Sucursal Preferida En El Frontend ERP 🌱

Este documento explica cómo funciona el selector global de sucursal, qué eventos emite, cómo escuchar esos cambios desde otras páginas y qué helpers estaban intervenidos en la implementación actual. Úsalo como guía de referencia cuando debas integrar filtros dependientes de la sucursal activa.

---

## 📍 ¿Dónde vive el selector global?

- **Componente:** `src/templates/layouts/Headers/_partial/SelectSucursalEmpresa.tsx`
- **Se renderiza en:** `DefaultHeaderRight.common.tsx` → `DefaultHeader.template.tsx`, por lo tanto aparece en toda la aplicación cuando se usa el layout estándar.

El selector:

1. Carga las sucursales accesibles para el usuario (`useUserBranches`).
2. Inicializa la opción actual con `personalizacion.sucursal_principal` o el branch del usuario.
3. Al cambiar la selección:
    - Hace `PUT /user/personalization` (campo `sucursal_principal`).
    - Opcionalmente hace `POST /user/switch-company` (si hay `company_id` disponible).
    - Emite el evento global `window.dispatchEvent(new CustomEvent('user-branch-changed', { detail: { branchId } }))`.
    - Muestra un toast de confirmación.

---

## 🔄 ¿Qué estado almacena la sucursal?

Todo se centraliza en el _slice_ de personalización.

- **Archivo:** `src/store/slices/personalizacion/personalizacionSlice.ts`
- Campos relevantes: `personalizacionUsuario.sucursal_principal`
- Thunks principales:
    - `obtenerPersonalizacionThunk`: trae la personalización (GET).
    - `actualizarSucursalPrincipalThunk`: guarda la sucursal preferida (PUT) y devuelve la personalización actualizada.

El slice normaliza la respuesta por si la API envía `{ personalization: { … } }` para mantener siempre un `IPersonalizacionUsuario` consistente.

---

## 📬 Evento global: `user-branch-changed`

Cualquier componente puede reaccionar a los cambios de sucursal escuchando un único evento en `window`:

```ts
useEffect(() => {
	const handler = (event: Event) => {
		const { branchId } = (event as CustomEvent<{ branchId: number | null }>).detail;
		// Aquí aplicas tus filtros, vuelves a pedir datos, etc.
	};

	window.addEventListener('user-branch-changed', handler);
	return () => window.removeEventListener('user-branch-changed', handler);
}, []);
```

> La carga útil incluye `branchId` (número) o `null`. El selector ya filtra las sucursales para que sólo emita IDs válidos para el usuario.

---

## 🧩 Cómo aplicar filtros por sucursal en una página

### 1. Importa y usa el hook `useUserBranches` si necesitas saber la lista accesible

```ts
const { branches } = useUserBranches(currentUserId, { enabled: !!currentUserId });
```

### 2. Inicializa tu estado con `personalizacion.sucursal_principal`

```ts
const personalizacion = useAppSelector(selectPersonalizacionUsuario);
const [branchId, setBranchId] = useState<number | null>(
	personalizacion?.sucursal_principal ?? null,
);
```

### 3. Escucha el evento global para sincronizar tu vista

```ts
useEffect(() => {
	const handler = (event: Event) => {
		const nextBranchId = (event as CustomEvent<{ branchId: number | null }>).detail.branchId;
		if (nextBranchId != null) {
			setBranchId(nextBranchId);
			refetchSomething(nextBranchId);
		}
	};
	window.addEventListener('user-branch-changed', handler);
	return () => window.removeEventListener('user-branch-changed', handler);
}, [refetchSomething]);
```

### 4. Usa `branchId` para filtrar tus queries

Ejemplo en un hook de datos (`useProductos` ya sigue este patrón):

```ts
useEffect(() => {
	if (!branchId) return;
	dispatch(fetchProducts({ branchId, params: filters }));
}, [dispatch, branchId, filters]);
```

> Si tu endpoint permite múltiples sucursales, puedes seguir usando `branchIds: [branchId]` o aplicar la lógica que corresponda.

---

## 🔁 Flujo resumido

1. Usuario abre selector → se listan sucursales desde `useUserBranches`.
2. Selección nueva → `actualizarSucursalPrincipalThunk` guarda en API y en Redux.
3. La API devuelve personalización actualizada → se sincroniza en Redux.
4. El selector dispara `user-branch-changed` → cualquier página suscrita reacciona.
5. Hooks de datos (`useProductos`, etc.) llaman a sus thunks con el nuevo `branchId` y actualizan la UI.

---

## 🧪 Tips para probar

- Revisa en _DevTools → Network_ que existan solicitudes `PUT /user/personalization` (y opcionalmente `POST /user/switch-company`) al cambiar la sucursal.
- Usa Redux DevTools para validar que `personalizacion.personalizacionUsuario.sucursal_principal` se actualiza.
- Confirma que la página cuya data depende de la sucursal escucha el evento y re-renderiza sin recargar la app.

---

## 📁 Archivos clave involucrados

| Función                                          | Ruta                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| Selector global de sucursal                      | `src/templates/layouts/Headers/_partial/SelectSucursalEmpresa.tsx`     |
| Slice de personalización                         | `src/store/slices/personalizacion/personalizacionSlice.ts`             |
| Hook de compañías (emite evento extra)           | `src/hooks/useCompanyManager.ts`                                       |
| Hook de sucursales de usuario                    | `src/pages/catalogos/productos/components/modals/hooks/userBranch.tsx` |
| Hook de productos (ejemplo de consumo)           | `src/pages/catalogos/productos/hooks/useProductos.ts`                  |
| Página Productos (escucha `user-branch-changed`) | `src/pages/catalogos/productos/Productos.tsx`                          |

---

## 🚀 Próximos pasos sugeridos

- Si creas una nueva pantalla que dependa de la sucursal, reusa el patrón: estado local `branchId` + listener del evento + refetch en tus hooks.
- Si necesitas otro layout, importa `SelectSucursalEmpresa` para mantener una única fuente de verdad.
- Considera normalizar todas las llamadas al backend con `branchId` vía helper o hook compartido, para reducir repetición.

---

¿Dudas adicionales? Revisa los archivos mencionados y copia el patrón a tus nuevas vistas. Mantener un único selector en el header hace que la experiencia de usuario sea consistente y evita disparidades entre módulos. ¡Happy hacking! 💻✨
