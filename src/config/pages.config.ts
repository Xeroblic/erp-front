// routes.ts
// Centraliza las rutas que el Sidebar, el sistema de permisos y React‑Router utilizarán.
// Mantén los IDs estables: si cambias un `id`, recuerda actualizar los tests y los registros de permisos.

import { AUTH } from "@/constants/authority";

// -----------------------------
// Auth & Public Pages
// -----------------------------
export const authPages = {
  loginPage: {
    id: "loginPage",
    to: "/login",
    text: "Login",
    icon: "HeroArrowRightOnRectangle",
    authority: [],
  },
  profilePage: {
    id: "profilePage",
    to: "/profile",
    text: "Perfil",
    icon: "HeroUser",
    authority: [],
  },
  aceptarInvitacionEmpresa: {
    id: "aceptarInvitacionEmpresa",
    to: "/invitar/aceptar/:token", 
    text: "Aceptar invitación",
    icon: "HeroMailOpen",
    authority: [],
  },
  recuperarPassword: {
    id: "recuperarPassword",
    to: "/recuperar-password",
    text: "Recuperar contraseña",
    icon: "HeroKey",
    authority: [],
  },
  confirmarNuevaPass: {
    id: "confirmarNuevaPass",
    to: "/recuperar-password/confirmar/:uid/:token",
    text: "Confirmar nueva contraseña",
    icon: "HeroDocument",
    authority: [],
  },
};

// -----------------------------
// Private (post‑login) Pages
// -----------------------------
export const privatePages = {
  dashboard: {
    id: "dashboard",
    to: "/",
    text: "Dashboard",
    icon: "HeroChartBarSquare",
    authority: [AUTH.ORG_EMPRESA],
  },
  productos: {
    id: "productos",
    to: "/productos",
    text: "Productos",
    icon: "HeroArchiveBox",
    authority: [AUTH.PRODUCTOS_CRUD],
  },
  usuarios: {
    id: "usuarios",
    to: "/usuarios",
    text: "Usuarios",
    icon: "HeroUsers",
    authority: [AUTH.USUARIOS_READ],
  },
  invitaciones: {
    id: "invitaciones",
    to: "/usuarios/invitaciones",
    text: "Invitaciones",
    icon: "HeroEnvelopeOpen",
    authority: [AUTH.USUARIOS_INVITE],
  },
  empresa: {
    id: "empresa",
    to: "/empresa",
    text: "Empresa",
    icon: "empresa-icon",
    authority: [AUTH.ORG_EMPRESA], 
  },
};

// -----------------------------
// Export combinado
// -----------------------------
export const pagesConfig = {
  ...authPages,
  ...privatePages,
};

// opcional, si lo necesitas también como named export:
export const Pages = pagesConfig;

// default export para importarlo sin llaves
export default pagesConfig;
