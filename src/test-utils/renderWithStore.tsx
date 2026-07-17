import { PropsWithChildren, ReactElement } from 'react';
import { configureStore, Reducer } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, renderHook, RenderHookOptions } from '@testing-library/react';

/**
 * Estado parcial del store para tests. No exigimos el `RootState` completo: los
 * hooks bajo prueba solo leen las porciones que les interesan, así que basta con
 * proveer esas ramas y el resto queda `undefined`.
 */
export type PreloadedTestState = Record<string, unknown>;

/**
 * Crea un store mínimo cuyo reducer es un passthrough: devuelve siempre el
 * `preloadedState`. Suficiente para hooks/selectores de solo lectura, sin cargar
 * los slices reales ni redux-persist.
 */
export const createTestStore = (preloadedState: PreloadedTestState = {}) => {
	const passthrough: Reducer<PreloadedTestState> = (state = preloadedState) => state;
	return configureStore({
		reducer: passthrough,
		preloadedState,
		middleware: (getDefault) => getDefault({ serializableCheck: false }),
	});
};

/** Wrapper con `<Provider>` para `renderHook`/`render`. */
export const withStore = (preloadedState: PreloadedTestState = {}) => {
	const store = createTestStore(preloadedState);
	const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
		<Provider store={store}>{children}</Provider>
	);
	return { store, Wrapper };
};

/** `renderHook` envuelto en un store de Redux con el `preloadedState` dado. */
export const renderHookWithStore = <TResult, TProps>(
	callback: (props: TProps) => TResult,
	preloadedState: PreloadedTestState = {},
	options?: Omit<RenderHookOptions<TProps>, 'wrapper'>,
) => {
	const { store, Wrapper } = withStore(preloadedState);
	const utils = renderHook(callback, { wrapper: Wrapper, ...options });
	return { store, ...utils };
};

/** `render` de un componente envuelto en un store de Redux. */
export const renderWithStore = (
	ui: ReactElement,
	preloadedState: PreloadedTestState = {},
) => {
	const { store, Wrapper } = withStore(preloadedState);
	return { store, ...render(ui, { wrapper: Wrapper }) };
};

/**
 * Helper para construir la rama `auth` que consumen useAuthorization/useCan.
 * Pasa permisos/roles y, opcionalmente, sucursales/subsidiarias visibles/accesibles.
 */
export const buildAuthState = (opts: {
	loading?: boolean;
	permisos?: string[];
	roles?: string[];
	visibleBranches?: Array<{ id: number; name?: string }>;
	accessBranches?: Array<{ id: number; name?: string }>;
	visibleSubsidiaries?: Array<{ id: number; company?: { id: number } }>;
	accessSubsidiaries?: Array<{ id: number; company?: { id: number } }>;
} = {}) => ({
	auth: {
		loading: opts.loading ?? false,
		user: {
			permisos: opts.permisos ?? [],
			roles: opts.roles ?? [],
			visible: {
				branches: opts.visibleBranches ?? [],
				subsidiaries: opts.visibleSubsidiaries ?? [],
			},
			access: {
				branches: opts.accessBranches ?? [],
				subsidiaries: opts.accessSubsidiaries ?? [],
			},
		},
	},
});
