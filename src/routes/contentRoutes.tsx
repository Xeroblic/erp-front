import { lazy } from "react";
import { PathRouteProps } from "react-router-dom";   // 👈 cambia RouteProps → PathRouteProps
import { authPages, privatePages } from "../config/pages.config";

import NotFoundPage        from "@/pages/NotFound.page";
import SinPermisos         from "@/pages/SinPermisos";
import LoginPage           from "@/pages/Login.page";
import RecuperarPassword   from "@/pages/ResetPassword/RecuperarPassword";
import ConfirmarNuevaPass  from "@/pages/ResetPassword/ConfirmarNuevaPass";
import AceptarInvitacion   from "@/pages/InvitacionEmpresa/AceptarInvitacionEmpresa";

const ProfilePage  = lazy(() => import("@/pages/Perfil"));
const Dashboard    = lazy(() => import("@/pages/Dashboard"));
const Empresa      = lazy(() => import("@/pages/empresa/empresa/Empresa"));
const RolesPermisos= lazy(() => import("@/pages/empresa/roles y permisos/RolesPermisos"));
const SubEmpresa   = lazy(() => import("@/pages/empresa/subempresa/SubEmpresa"));
const Sucursales   = lazy(() => import("@/pages/empresa/sucursales/Sucursales"));
const Usuarios     = lazy(() => import("@/pages/empresa/usuarios/Usuarios"));

// const Productos    = lazy(() => import("@/pages/Productos"));
// const Usuarios     = lazy(() => import("@/pages/Usuarios"));
// const Invitaciones = lazy(() => import("@/pages/Invitaciones"));

export type IRoutePersonalizada = PathRouteProps & { authority: string[] };

const contentRoutes: IRoutePersonalizada[] = [
  // públicas / auth
  { path: authPages.loginPage.to,               element: <LoginPage />,          authority: [] },
  { path: authPages.profilePage.to,             element: <ProfilePage />,        authority: [] },
  { path: authPages.aceptarInvitacionEmpresa.to,element: <AceptarInvitacion />,  authority: [] },
  { path: authPages.recuperarPassword.to,       element: <RecuperarPassword />,  authority: [] },
  { path: authPages.confirmarNuevaPass.to,      element: <ConfirmarNuevaPass />, authority: [] },

  // privadas
  { path: privatePages.dashboard.to,    element: <Dashboard />,    authority: privatePages.dashboard.authority },
  { path: privatePages.gestion.subPages.empresa.to,    element: <Empresa />,   authority: privatePages.gestion.subPages.empresa.authority },
  { path: privatePages.gestion.subPages.subempresa.to, element: <SubEmpresa />,authority: privatePages.gestion.subPages.subempresa.authority },
  { path: privatePages.gestion.subPages.sucursal.to, element: <Sucursales />,authority: privatePages.gestion.subPages.sucursal.authority },
  { path: privatePages.gestion.subPages.rolesPermisos.to, element: <RolesPermisos />,authority: privatePages.gestion.subPages.rolesPermisos.authority },
  { path: privatePages.gestion.subPages.usuarios.to, element: <Usuarios />,authority: privatePages.gestion.subPages.usuarios.authority },

//   { path: privatePages.productos.to,    element: <Productos />,    authority: privatePages.productos.authority },
//   { path: privatePages.usuarios.to,     element: <Usuarios />,     authority: privatePages.usuarios.authority },
//   { path: privatePages.invitaciones.to, element: <Invitaciones />, authority: privatePages.invitaciones.authority },

  // genéricos
  { path: "/sin-permisos", element: <SinPermisos />, authority: [] },
  { path: "/",             element: <Dashboard />,   authority: privatePages.dashboard.authority },
  { path: "*",             element: <NotFoundPage />,authority: [] },
];

export default contentRoutes;
