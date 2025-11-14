# Gestión De Subsidiaria Preferida En El Frontend ERP 🌱

Este documento explica cómo funciona el selector global de subsidiaria, qué eventos emite, cómo escuchar esos cambios desde otras páginas y qué helpers estaban intervenidos en la implementación actual. Úsalo como guía de referencia cuando debas integrar filtros dependientes de la subsidiaria activa.

---

## 📍 ¿Dónde viviría el selector global?

- **Componente (sugerido):** `src/templates/layouts/Headers/_partial/SelectSubsidiariaEmpresa.tsx`
- **Se renderiza en (sugerido):** `DefaultHeaderRight.common.tsx` → `DefaultHeader.template.tsx`, de la misma manera que el selector de sucursal, para que aparezca en toda la aplicación cuando se usa el layout estándar.

El selector debería:

1. Cargar las subsidiarias accesibles para el usuario (por ejemplo, reutilizando `useUserBranches` o creando `useUserSubsidiaries`).
2. Inicializar la opción actual con `personalizacion.subsidaria_principal` o la subsidiaria por defecto del usuario.
3. Al cambiar la selección:
    - Hacer `PUT /user/personalization` (campo `subsidaria_principal`).
    - Opcionalmente hacer `POST /user/switch-company` (si hay `company_id` disponible y la política lo requiere).
    - Emitir el evento global `window.dispatchEvent(new CustomEvent('user-subsidiary-changed', { detail: { subsidiaryId } }))`.
    - Mostrar un toast de confirmación.

---

## 🔄 ¿Qué estado almacena la subsidiaria?

La idea es centralizarlo en el mismo _slice_ de personalización.

- **Archivo (sugerido):** `src/store/slices/personalizacion/personalizacionSlice.ts`
- Campo relevante propuesto: `personalizacionUsuario.subsidaria_principal`
- Thunks propuestos:
    - `obtenerPersonalizacionThunk`: trae la personalización (GET).
    - `actualizarSubsidiariaPrincipalThunk`: guarda la subsidiaria preferida (PUT) y devuelve la personalización actualizada.

El slice puede normalizar la respuesta como ya hace para `personalization` y mantener siempre un `IPersonalizacionUsuario` consistente.

---

## 📬 Evento global: `user-subsidiary-changed`

Cualquier componente puede reaccionar a los cambios de subsidiaria escuchando un único evento en `window`:

```ts
useEffect(() => {
	const handler = (event: Event) => {
		const { subsidiaryId } = (event as CustomEvent<{ subsidiaryId: number | null }>).detail;
		// Aquí aplicas tus filtros, vuelves a pedir datos, etc.
	};

	window.addEventListener('user-subsidiary-changed', handler);
	return () => window.removeEventListener('user-subsidiary-changed', handler);
}, []);
```

> La carga útil incluye `subsidiaryId` (número) o `null`. El selector debe filtrar las subsidiarias para que solo emita IDs válidos para el usuario.

---

## 🧩 Cómo aplicar filtros por subsidiaria en una página

### 1. Importa y usa un hook que liste subsidiarias si lo necesitas (ejemplo `useUserSubsidiaries`)

```ts
const { subsidiaries } = useUserSubsidiaries(currentUserId, { enabled: !!currentUserId });
```

### 2. Inicializa tu estado con `personalizacion.subsidaria_principal`

```ts
const personalizacion = useAppSelector(selectPersonalizacionUsuario);
const [subsidiaryId, setSubsidiaryId] = useState<number | null>(
	personalizacion?.subsidaria_principal ?? null,
);
```

### 3. Escucha el evento global para sincronizar tu vista

```ts
useEffect(() => {
	const handler = (event: Event) => {
		const nextSubsidiaryId = (event as CustomEvent<{ subsidiaryId: number | null }>).detail
			.subsidiaryId;
		if (nextSubsidiaryId != null) {
			setSubsidiaryId(nextSubsidiaryId);
			refetchSomething(nextSubsidiaryId);
		}
	};
	window.addEventListener('user-subsidiary-changed', handler);
	return () => window.removeEventListener('user-subsidiary-changed', handler);
}, [refetchSomething]);
```

### 4. Usa `subsidiaryId` para filtrar tus queries

Ejemplo en un hook de datos (adaptar `useProductos`):

```ts
useEffect(() => {
	if (!subsidiaryId) return;
	dispatch(fetchProducts({ subsidiaryId, params: filters }));
}, [dispatch, subsidiaryId, filters]);
```

> Si tu endpoint permite múltiples subsidiarias, puedes usar `subsidiaryIds: [subsidiaryId]` o la lógica que corresponda.

---

## 🔁 Flujo resumido

1. Usuario abre selector → se listan subsidiarias desde `useUserSubsidiaries`.
2. Selección nueva → `actualizarSubsidiariaPrincipalThunk` guarda en API y en Redux.
3. La API devuelve personalización actualizada → se sincroniza en Redux.
4. El selector dispara `user-subsidiary-changed` → cualquier página suscrita reacciona.
5. Hooks de datos (`useProductos`, etc.) llaman a sus thunks con la nueva `subsidiaryId` y actualizan la UI.

---

## 🧪 Tips para probar

- Revisa en DevTools → Network que existan solicitudes `PUT /user/personalization` (y opcionalmente `POST /user/switch-company`) al cambiar la subsidiaria.
- Usa Redux DevTools para validar que `personalizacion.personalizacionUsuario.subsidaria_principal` se actualiza.
- Confirma que la página cuya data depende de la subsidiaria escucha el evento y re-renderiza sin recargar la app.

---

## 📁 Archivos clave sugeridos

| Función                                              | Ruta (sugerida)                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Selector global de subsidiaria                       | `src/templates/layouts/Headers/_partial/SelectSubsidiariaEmpresa.tsx`           |
| Slice de personalización (campo subsidiaria)         | `src/store/slices/personalizacion/personalizacionSlice.ts`                      |
| Hook de compañías (si aplica)                        | `src/hooks/useCompanyManager.ts`                                                |
| Hook de subsidiarias de usuario                      | `src/hooks/useUserSubsidiaries.ts` (o `src/pages/.../hooks/userSubsidiary.tsx`) |
| Hook de productos (ejemplo de consumo)               | `src/pages/catalogos/productos/hooks/useProductos.ts`                           |
| Página Productos (escucha `user-subsidiary-changed`) | `src/pages/catalogos/productos/Productos.tsx`                                   |

---

## 🚀 Próximos pasos sugeridos

- Si quieres, implemento ahora:
    1. `SelectSubsidiariaEmpresa.tsx` (componente de UI basado en `SelectSucursalEmpresa.tsx`).
    2. El thunk `actualizarSubsidiariaPrincipalThunk` y la adición del campo `subsidaria_principal` en el slice de `personalizacion`.
    3. Un pequeño hook `useUserSubsidiaries` para listar subsidiarias.
    4. Reemplazar/añadir listeners en las páginas que necesiten filtrar por subsidiaria.

- Dime si prefieres que cree solo la documentación (ya creada), o que además genere el código base (componentes y thunks) y lo conecte.

---

¿Lo dejo así o implemento la versión completa (componentes + thunks + hook)?
