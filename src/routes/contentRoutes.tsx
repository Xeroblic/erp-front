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
const PermissionsAdmin = lazy(() => import("@/pages/admin/PermissionsAdmin.tsx"));

export interface IRoutePersonalizada extends PathRouteProps {
  authority?: string[];
  feature?: string;
  public?: boolean;
}

const cfg = pagesConfig as any;

const contentRoutes: IRoutePersonalizada[] = [
  // Rutas públicas...
  { path: cfg.loginPage.to, element: <LoginPage />, public: true },
  { path: cfg.recuperarPassword.to, element: <RecuperarPassword />, public: true },
  // ...otras rutas públicas...

  // Rutas privadas (protegidas por permisos)...
  { path: cfg.profilePage.to, element: <ProfilePage />, authority: cfg.profilePage.authority },
  { path: cfg.dashboard.to, element: <Dashboard />, authority: cfg.dashboard.authority },

  // Gestión (rutas anidadas bajo "Gestión")
  { path: cfg.manage.subPages.company.to, element: <EmpresaPage />, authority: cfg.manage.subPages.company.authority },
  { path: cfg.manage.subPages.subsidiary.to, element: <SubEmpresa />, authority: cfg.manage.subPages.subsidiary.authority },
  { path: cfg.manage.subPages.branch.to, element: <Sucursales />, authority: cfg.manage.subPages.branch.authority },
  { path: cfg.manage.subPages.roles.to, element: <RolesPermisos />, authority: cfg.manage.subPages.roles.authority },
  { path: cfg.manage.subPages.manageUsers.to, element: <GestionUsuarios />, authority: cfg.manage.subPages.manageUsers.authority },
  { path: cfg.manage.subPages.permissionsAdmin.to, element: <PermissionsAdmin />, authority: cfg.manage.subPages.permissionsAdmin.authority },

  // ... (eventualmente aquí se agregarían rutas para Categorías, Fabricantes, Clientes, etc., con sus respectivos authority)

  // Rutas genéricas
  { path: '/sin-permisos', element: <SinPermisos />, public: true },
  { path: '/', element: <Dashboard />, authority: cfg.dashboard.authority },  // Redirección raíz al dashboard
  { path: '*', element: <NotFoundPage />, public: true }
];


export default contentRoutes;
