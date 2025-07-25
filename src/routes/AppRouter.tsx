// src/routes/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import contentRoutes, { IRoutePersonalizada } from './contentRoutes';
import { selectUserAuthority } from '@/store/slices/auth/authSlice';
import { selectFeaturesList } from '@/store/slices/featuresSlice/featuresSlice';
import { hasPermission } from '@/utils/acl';

const AppRouter: React.FC = () => {
  const permisos = useSelector(selectUserAuthority); // array<string>
  const features = useSelector(selectFeaturesList);  // array<string>

  const allowed = contentRoutes.filter((r: IRoutePersonalizada) => {
    if (r.public) return true;

    // ► permisos
    if (
      r.authority &&
      r.authority.length > 0 &&
      !r.authority.some(req => hasPermission(req, permisos))
    ) {
      return false;
    }

    // ► features
    if (r.feature && !features.includes(r.feature)) {
      return false;
    }

    return true;
  });

  return (
    <Routes>
      {allowed.map((r, i) => (r.path ? <Route key={i} {...r} /> : null))}
      <Route path="*" element={<Navigate to="/sin-permisos" replace />} />
    </Routes>
  );
};

export default AppRouter;
