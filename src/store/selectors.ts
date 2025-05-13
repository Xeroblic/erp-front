import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './rootReducer';

export const selectUserAuthority = createSelector(
  (state: RootState) => state.auth.user?.authority,
  (auth) => auth ?? []
);
