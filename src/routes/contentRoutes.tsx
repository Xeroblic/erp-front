// src/routes/contentRoutes.tsx
import React, { lazy } from "react";
import { PathRouteProps } from "react-router-dom";
import pagesConfig from "@/config/pages.config";

import LoginPage from "@/pages/Login.page";
import RecuperarPassword from "@/pages/ResetPassword/RecuperarPassword";
import ConfirmarNuevaPass from "@/pages/ResetPassword/ConfirmarNuevaPass";
import AceptarInvitacion from "@/pages/InvitacionEmpresa/AceptarInvitacionEmpresa";
import SinPermisos from "@/pages/SinPermisos";
import NotFoundPage from "@/pages/NotFound.page";

const ProfilePage = lazy(() => import("@/pages/Perfil"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
// const ProductosPage = lazy(() => import("@/pages/Productos"));
// const UsuariosPage  = lazy(() => import("@/pages/Usuarios"));
// const Cotizaciones  = lazy(() => import("@/pages/Cotizaciones"));
const EmpresaPage = lazy(() => import("@/pages/gestionAdmin/empresa/Empresa.tsx"));
const SubEmpresa = lazy(() => import("@/pages/gestionAdmin/subempresa/SubEmpresa.tsx"));
const Sucursales = lazy(() => import("@/pages/gestionAdmin/sucursales/Sucursales.tsx"));
const RolesPermisos = lazy(() => import("@/pages/gestionAdmin/roles y permisos/RolesPermisos.tsx"));
const GestionUsuarios = lazy(() => import("@/pages/gestionAdmin/usuarios/Usuarios.tsx"));

export interface IRoutePersonalizada extends PathRouteProps {
  authority?: string[];
  feature?: string;
  public?: boolean;
}

const cfg = pagesConfig as Record<string, any>;

const contentRoutes: IRoutePersonalizada[] = [
  // públicas
  { path: cfg.loginPage.to, element: <LoginPage />, public: true },
  { path: cfg.recuperarPassword.to, element: <RecuperarPassword />, public: true },
  { path: cfg.confirmarNuevaPass.to, element: <ConfirmarNuevaPass />, public: true },
  { path: cfg.aceptarInvitacionEmpresa.to, element: <AceptarInvitacion />, public: true },

  // privadas
  {
    path: cfg.profilePage.to,
    element: <ProfilePage />,
    authority: cfg.profilePage.authority,
  },
  {
    path: cfg.dashboard.to,
    element: <Dashboard />,
    authority: cfg.dashboard.authority,
    feature: cfg.dashboard.feature,
  },
  // {
  //   path: cfg.productos.to,
  //   element: <ProductosPage />,
  //   authority: cfg.productos.authority,
  //   feature:   cfg.productos.feature,
  // },
  // {
  //   path: cfg.usuarios.to,
  //   element: <UsuariosPage />,
  //   authority: cfg.usuarios.authority,
  //   feature:   cfg.usuarios.feature,
  // },
  // {
  //   path: cfg.cotizaciones.to,
  //   element: <Cotizaciones />,
  //   authority: cfg.cotizaciones.authority,
  //   feature:   cfg.cotizaciones.feature,
  // },

  // gestión anidada
  {
    path: cfg.gestion.subPages.empresa.to,
    element: <EmpresaPage />,
    authority: cfg.gestion.subPages.empresa.authority,
    feature: cfg.gestion.subPages.empresa.feature,
  },
  {
    path: cfg.gestion.subPages.subempresa.to,
    element: <SubEmpresa />,
    authority: cfg.gestion.subPages.subempresa.authority,
    feature: cfg.gestion.subPages.subempresa.feature,
  },
  {
    path: cfg.gestion.subPages.sucursal.to,
    element: <Sucursales />,
    authority: cfg.gestion.subPages.sucursal.authority,
    feature: cfg.gestion.subPages.sucursal.feature,
  },
  {
    path: cfg.gestion.subPages.rolesPermisos.to,
    element: <RolesPermisos />,
    authority: cfg.gestion.subPages.rolesPermisos.authority,
    feature: cfg.gestion.subPages.rolesPermisos.feature,
  },
  {
    path: cfg.gestion.subPages.usuarios.to,
    element: <GestionUsuarios />,
    authority: cfg.gestion.subPages.usuarios.authority,
    feature: cfg.gestion.subPages.usuarios.feature,
  },

  // genéricos
  { path: "/sin-permisos", element: <SinPermisos />, public: true },
  { path: "/", element: <Dashboard />, authority: cfg.dashboard.authority, feature: cfg.dashboard.feature },
  { path: "*", element: <NotFoundPage />, public: true },
];

export default contentRoutes;
