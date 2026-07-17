import { configureStore, type ReducersMapObject } from '@reduxjs/toolkit';

/**
 * Store de INTEGRACIÓN: usa los reducers REALES de los slices bajo prueba
 * (a diferencia de `renderWithStore`, cuyo store es un passthrough de lectura).
 * Los thunks despachados aquí ejecutan su lógica completa contra ApiService,
 * cuyo HTTP se intercepta con MSW en cada test.
 */
export const makeIntegrationStore = <S>(reducers: ReducersMapObject<S>) =>
	configureStore({
		reducer: reducers,
		middleware: (getDefault) => getDefault({ serializableCheck: false }),
	});
