// src/routes/AppRouter.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import contentRoutes, { IRoutePersonalizada } from "./contentRoutes";

// selectors
import { selectUserAuthority } from "@/store/slices/auth/authSlice";
import { selectFeaturesList }  from "@/store/slices/featuresSlice/featuresSlice";

const AppRouter: React.FC = () => {
  const permisos = useSelector(selectUserAuthority);
  const features = useSelector(selectFeaturesList);

  const allowed = contentRoutes.filter((r: IRoutePersonalizada) => {
    if (r.public) return true;

    // permiso?
    if (r.authority && r.authority.length > 0 &&
        !r.authority.some(p => permisos.includes(p))
    ) {
      return false;
    }
    // feature?
    if (r.feature && !features.includes(r.feature)) {
      return false;
    }
    return true;
  });

  return (
    <Routes>
      {allowed.map((r, i) =>
        r.path ? <Route key={i} {...r} /> : null
      )}
      <Route path="*" element={<Navigate to="/sin-permisos" replace />} />
    </Routes>
  );
};

export default AppRouter;
