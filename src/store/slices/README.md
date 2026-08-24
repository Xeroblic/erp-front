# Guía de Slices (Redux Toolkit) en este proyecto

Esta guía define cómo construir slices, conectarlos a la store, tiparlos con interfaces y manejar flujos asíncronos con `createAsyncThunk` y `extraReducers`, siguiendo el estilo actual del repo.

- Identación: 4 espacios.
- Estados iniciales claros: `[]`, `null`, `false`, `''` según corresponda.
- Interfaces con: `items` (lista), `current` (detalle), flags (`loading`, `creating`, `updating`, `deleting`), `error`, y flags extra por relaciones.
- Usar `createAsyncThunk` y manejar siempre `pending / fulfilled / rejected` en `extraReducers`.
- Prefijos de API por feature con `ep()` y variables `VITE_API_*_PREFIX`.

---

## Estructura de carpetas

- `src/store/slices/<feature>/<feature>Slice.ts` → Slice por dominio/feature.
- `src/interface/*.interface.ts` → Tipos/Interfaces compartidas (`ISupplier`, `ICustomerSupplier`, etc.).
- `src/store/rootReducer.ts` → Unión de reducers estáticos + soporte de async reducers.
- `src/store/storeSetup.ts` → Configuración de la store, middlewares, persistencia e inyección dinámica.
- `src/store/hook.ts` → Hooks tipados `useAppDispatch` y `useAppSelector`.

---

## Interfaces de estado (State)

Cada slice debe declarar una interface `XxxState` con:

- `items: T[]` → Lista principal.
- `current: T | null` → Detalle seleccionado/cargado.
- `loading`, `creating`, `updating`, `deleting`: booleanos por operación.
- `error: string | null` → Mensaje de error (en caso de rechazo).
- Flags adicionales por sub-recursos (según aplique): `customers`, `customersLoading`, `attaching`, `detaching`, etc.

Estados iniciales recomendados:

- Listas: `[]`
- Entidad actual: `null`
- Booleans: `false`
- Errores: `null`

Ejemplo (patrón):

```ts
export interface FeatureState<T> {
	items: T[];
	loading: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	error: string | null;
	current: T | null;
}

const initialState: FeatureState<MyEntity> = {
	items: [],
	loading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
	current: null,
};
```

---

## Helper de endpoints y normalización

Se usa un prefijo por feature desde `.env` y un helper `ep()` para componer rutas limpias. Para payloads, utilizamos helpers de normalización que toleran respuestas con/sin `data`.

```ts
const PREFIX = (import.meta as any)?.env?.VITE_API_MY_FEATURE_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (p: string) => join(PREFIX, p);

const normalizeArray = (payload: any): any[] => {
	const raw = payload?.data ?? payload;
	return Array.isArray(raw) ? raw : [];
};

const normalizeObject = (payload: any): any => payload?.data ?? payload ?? null;
```

- Mantén un prefijo por slice/feature: `VITE_API_SUPPLIERS_PREFIX`, `VITE_API_CUSTOMER_SUPPLIERS_PREFIX`, etc.
- `normalizeArray/normalizeObject` ayudan a tolerar respuestas del backend.

---

## Thunks (createAsyncThunk)

Para cada operación remota, define un thunk tipado con:

- Tipo de retorno (entidad o lista tipada).
- Argumento de entrada (ej. `{ subsidiaryId: number; id?: number }`).
- `rejectValue: string` para propagar mensajes de error legibles.

Ejemplo (detalle por id) siguiendo tu patrón:

```ts
export const fetchCustomerSupplierById = createAsyncThunk<
	ICustomerSupplier,
	{ subsidiaryId: number; id: number },
	{ rejectValue: string }
>('customerSuppliers/fetchById', async ({ subsidiaryId, id }, { rejectWithValue }) => {
	try {
		const resp = await ApiService.fetchData<{ data?: any }>({
			url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/${id}/`),
			method: 'get',
		});
		return normalizeObject(resp.data) as ICustomerSupplier;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ??
				error?.message ??
				'No se pudo cargar el cliente-proveedor',
		);
	}
});
```

Recomendaciones:

- Usa `dedupe`/`cacheTTLms` para listas grandes.
- Ante `404` en listados, puedes devolver `[]` cuando el caso de uso lo permita.

---

## Slice + extraReducers

Define el slice con `createSlice` y maneja los thunks en `extraReducers`. Evitamos reducers manuales para flujos asíncronos al estandarizar `pending/fulfilled/rejected`.

```ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';

export interface ThingsState {
	items: IThing[];
	loading: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	error: string | null;
	current: IThing | null;
}

const initialState: ThingsState = {
	items: [],
	loading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
	current: null,
};

// Thunks de ejemplo (ver sección anterior)

const slice = createSlice({
	name: 'things',
	initialState,
	reducers: {
		// Reducers síncronos opcionales: setCurrent, clearError, etc.
		clearError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		// List
		builder.addCase(fetchThings.pending, (state) => {
			state.loading = true;
			state.error = null;
		});
		builder.addCase(fetchThings.fulfilled, (state, action) => {
			state.loading = false;
			state.items = action.payload;
		});
		builder.addCase(fetchThings.rejected, (state, action) => {
			state.loading = false;
			state.error = action.payload ?? 'Error al cargar';
		});

		// Create
		builder.addCase(createThing.pending, (state) => {
			state.creating = true;
			state.error = null;
		});
		builder.addCase(createThing.fulfilled, (state, action) => {
			state.creating = false;
			state.items.unshift(action.payload);
			state.current = action.payload;
		});
		builder.addCase(createThing.rejected, (state, action) => {
			state.creating = false;
			state.error = action.payload ?? 'Error al crear';
		});

		// Update: set updating, reemplazar item por id y actualizar current si aplica
		// Delete: set deleting, filtrar item por id y limpiar current si coincide
	},
});

export const { clearError } = slice.actions;
export default slice.reducer;

// Selectores
export const selectThings = (state: RootState) => state.things.items;
export const selectThingsLoading = (state: RootState) => state.things.loading;
export const selectCurrentThing = (state: RootState) => state.things.current;
```

Pautas:

- Usa `builder.addCase` para cada `pending/fulfilled/rejected`.
- En `update`, reemplaza en `items` por `id` y actualiza `current` si corresponde.
- En `delete`, filtra `items` por `id` y limpia `current` si coincide.

---

## Conexión con el Root Reducer

Archivo: `src/store/rootReducer.ts`

- Importa el reducer por defecto del slice: `import things from './slices/things/thingsSlice';`
- Declara su tipo en `RootState` como `ReturnType<typeof things>` (o `XxxState` exportado desde el slice).
- Agrega el slice en `staticReducers` para registro estático:

```ts
const staticReducers = {
	// ...otros reducers
	things,
	[RtkQueryService.reducerPath]: RtkQueryService.reducer,
};
```

El `rootReducer` además:

- Combina reducers estáticos + async (`combineReducers({...static, ...async})`).
- Resetea el estado completo al `logout`.

---

## Store, persistencia y async reducers

Archivo: `src/store/storeSetup.ts`

- Se usa `configureStore` con `redux-persist` y `RtkQueryService.middleware`.
- `persistReducer(persistConfig, rootReducer())` envuelve la raíz.
- `injectReducer(key, reducer)` permite agregar reducers dinámicamente (code-splitting).

Puntos a considerar al agregar un nuevo slice:

- Registro estático (lo más común):
    - Importar el slice en `rootReducer.ts` y añadirlo a `staticReducers`.
    - Tipar `RootState` con `ReturnType<typeof mySlice>` o `MySliceState`.
- Registro dinámico:
    - Llamar `injectReducer('things', thingsReducer)` desde el módulo que se carga bajo demanda.

---

## Hooks tipados y selectores

- Usa siempre `useAppDispatch` y `useAppSelector` desde `src/store/hook.ts`.
- Exporta desde cada slice selectores simples: `selectItems`, `selectLoading`, `selectCurrent`.

Ejemplo de uso en componentes:

```tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { fetchThings, selectThings, selectThingsLoading } from '@/store/slices/things/thingsSlice';

function MiComponente() {
	const dispatch = useAppDispatch();
	const items = useAppSelector(selectThings);
	const loading = useAppSelector(selectThingsLoading);

	useEffect(() => {
		dispatch(fetchThings({ subsidiaryId: 1 }));
	}, [dispatch]);

	if (loading) return <Spinner />;
	return <Lista data={items} />;
}
```

---

## Flujo completo (resumen)

1. La UI despacha un thunk (`dispatch(fetchXxx())`).
2. `ApiService` llama al endpoint `ep('/ruta')`.
3. `extraReducers` del slice actualiza flags (`loading`, `error`) y datos (`items`, `current`).
4. Componentes leen mediante selectores (`useAppSelector`).

---

## Checklist de un nuevo slice

- [ ] Crear `/<feature>/<feature>Slice.ts` con:
    - [ ] Interface `XxxState` (items, current, flags, error)
    - [ ] `initialState` con valores por defecto
    - [ ] Thunks tipados (`rejectValue: string`)
    - [ ] `createSlice` + `extraReducers` para cada thunk
    - [ ] Selectores exportados
- [ ] Agregar a `rootReducer.ts` en `staticReducers` y tipar `RootState`.
- [ ] Usar `useAppDispatch/useAppSelector` en componentes.

---

## Notas de estilo

- 4 espacios de identación, nombres consistentes.
- Nombres de acción: `'feature/accion'` (ej. `'suppliers/fetchSupplierById'`).
- Prefijos API por feature (`VITE_API_..._PREFIX`).
- `error` como `string | null`, nunca como objeto.
- Mantén los `extraReducers` completos: define `pending`, `fulfilled`, `rejected` para cada thunk.

---

## Referencias útiles del proyecto

- `src/store/rootReducer.ts` → Cómo se tipa `RootState` y se agregan reducers.
- `src/store/storeSetup.ts` → Persistencia, middlewares, `injectReducer`.
- `src/store/hook.ts` → Hooks tipados para usar en componentes.
- Slices de referencia: `src/store/slices/suppliers/suppliersSlice.ts`, `src/store/slices/customerSuppliers/customerSuppliersSlice.ts`.

Si quieres, puedo generar un template base de slice vacío para copiar/pegar con la estructura estándar.
