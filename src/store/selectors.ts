import type { RootState } from './rootReducer';

export const selectUserAuthority = (state: RootState): string[] =>
  state.auth.user?.authority ?? [];