import type { RootState } from './rootReducer';

// Devuelve siempre la misma referencia cuando no hay autoridad para evitar rerenders innecesarios
const EMPTY_AUTHORITY: ReadonlyArray<string> = Object.freeze([]);

export const selectUserAuthority = (state: RootState): ReadonlyArray<string> =>
  state.auth.user?.authority || EMPTY_AUTHORITY;
