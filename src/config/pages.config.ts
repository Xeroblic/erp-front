// routes.ts
// Centraliza las rutas que el Sidebar, el sistema de permisos y React‑Router utilizarán.
// Mantén los IDs estables: si cambias un `id`, recuerda actualizar los tests y los registros de permisos.

import { AUTH } from "@/constants/authority";
import { sub } from "date-fns";

// -----------------------------
// Auth & Public Pages
// -----------------------------

export interface PageConfig {
  id: string;
  to: string;
  text: string;
  icon: string;
  authority: string[];  // claves idénticas a las de tu DB
}

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
    id: 'dashboard',
    to: '/dashboard',
    text: 'Dashboard',
    icon: 'HeroChartBarSquare',
    authority: ['empresa:*']
  },
  profilePage: {
		id: 'profilePage',
		to: '/profile',
		text: 'Perfil',
		icon: 'HeroUser',
		autority: [],
	},
  productos: {
    id: 'productos',
    to: '/productos',
    text: 'Productos',
    icon: 'HeroArchiveBox',
    authority: ['producto:*']
  },
  usuarios: {
    id: 'usuarios',
    to: '/usuarios',
    text: 'Usuarios',
    icon: 'HeroUsers',
    authority: ['usuario:*']
  },
  cotizaciones: {
    id: 'cotizaciones',
    to: '/cotizaciones',
    text: 'Cotizaciones',
    icon: 'HeroDocumentText',
    authority: ['cotizacion:*']
  },
  empresa: {
    id: 'empresa',
    to: '/empresa',
    text: 'Empresa',
    icon: 'HeroBuildingStorefront',
    authority: ['empresa:*']
  },
  // aqui  se creara gestion dentro de esta ira empresa, sub empresa, sucursal dentro de la ruta de gestion anidada gestio/empresa y asi
  gestion: {
    id: 'gestion',
    to: '/gestion',
    text: 'Gestión',
    icon: 'HeroBuildingStorefront',
    authority: ['empresa:*', 'gestion_admin', 'super_admin'],
    subPages: {
      empresa: {
        id: 'empresa',
        to: '/gestion/empresa',
        text: 'Empresa',
        icon: 'HeroBuildingStorefront',
        authority: ['empresa:*', 'gestion_admin', 'super_admin'],
      },
      subempresa: {
        id: 'subempresa',
        to: '/gestion/subempresa',
        text: 'Subempresa',
        icon: 'HeroBuildingStorefront',
        authority: ['subempresa:*' ,'gestion_admin', 'super_admin'],
      },
      sucursal: {
        id: 'sucursal',
        to: '/gestion/sucursal',
        text: 'Sucursal',
        icon: 'HeroBuildingStorefront',
        authority: ['sucursal:*', 'gestion_admin', 'super_admin'],
      },
      rolesPermisos: {
        id: 'rolesPermisos',
        to: '/gestion/roles-permisos',
        text: 'Listas de usuarios',
        icon: 'HeroShieldCheck',
        authority: ['rol:*', 'gestion_admin', 'super_admin'],
      },

      usuarios: {
        id: 'usuarios',
        to: '/gestion/usuarios',
        text: 'Usuarios',
        icon: 'HeroUsers',
        authority: ['usuario:*','gestion_admin', 'super_admin'],
      },
    },
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
