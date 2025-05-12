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
//   { path: privatePages.productos.to,    element: <Productos />,    authority: privatePages.productos.authority },
//   { path: privatePages.usuarios.to,     element: <Usuarios />,     authority: privatePages.usuarios.authority },
//   { path: privatePages.invitaciones.to, element: <Invitaciones />, authority: privatePages.invitaciones.authority },

  // genéricos
  { path: "/sin-permisos", element: <SinPermisos />, authority: [] },
  { path: "/",             element: <Dashboard />,   authority: [] },
  { path: "*",             element: <NotFoundPage />,authority: [] },
];

export default contentRoutes;
