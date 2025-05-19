// src/config/pages.config.ts
export interface PageConfig {
  id: string;
  to: string;
  text: string;
  icon: string;
  authority: string[];   // permisos que exige
  feature?: string;      // clave de feature que exige (si aplica)
}

// -----------------------------
// Auth & Public Pages
// -----------------------------
export const authPages: Record<string, PageConfig> = {
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
// Private (post-login) Pages
// -----------------------------
export const privatePages: Record<string, PageConfig | { subPages: Record<string, PageConfig> }> = {
  dashboard: {
    id: 'dashboard',
    to: '/dashboard',
    text: 'Dashboard',
    icon: 'HeroChartBarSquare',
    authority: ['empresa:*'],
    feature:   'dashboard',
  },
  productos: {
    id: 'productos',
    to: '/productos',
    text: 'Productos',
    icon: 'HeroArchiveBox',
    authority: ['producto:*'],
    feature:   'productos',
  },
  usuarios: {
    id: 'usuarios',
    to: '/usuarios',
    text: 'Usuarios',
    icon: 'HeroUsers',
    authority: ['usuario:*'],
    feature:   'usuarios',
  },
  cotizaciones: {
    id: 'cotizaciones',
    to: '/cotizaciones',
    text: 'Cotizaciones',
    icon: 'HeroDocumentText',
    authority: ['cotizacion:*'],
    feature:   'cotizaciones',
  },
  gestion: {
    id: 'gestion',
    to: '/gestion',
    text: 'Gestión',
    icon: 'HeroBuildingStorefront',
    authority: ['gestion_admin', 'super_admin'],
    // no feature base, lo definen subPages
    subPages: {
      empresa: {
        id: 'empresa',
        to: '/gestion/empresa',
        text: 'Empresa',
        icon: 'HeroBuildingStorefront',
        authority: ['empresa:*','gestion_admin','super_admin'],
        feature:   'gestion-empresa',
      },
      subempresa: {
        id: 'subempresa',
        to: '/gestion/subempresa',
        text: 'Subempresa',
        icon: 'HeroBuildingStorefront',
        authority: ['subempresa:*','gestion_admin','super_admin'],
        feature:   'gestion-subempresa',
      },
      sucursal: {
        id: 'sucursal',
        to: '/gestion/sucursal',
        text: 'Sucursal',
        icon: 'HeroBuildingStorefront',
        authority: ['sucursal:*','gestion_admin','super_admin'],
        feature:   'gestion-sucursal',
      },
      rolesPermisos: {
        id: 'rolesPermisos',
        to: '/gestion/roles-permisos',
        text: 'Roles y permisos',
        icon: 'HeroShieldCheck',
        authority: ['rol:*','gestion_admin','super_admin'],
        feature:   'gestion-roles',
      },
      usuarios: {
        id: 'usuariosGestion',
        to: '/gestion/usuarios',
        text: 'Usuarios',
        icon: 'HeroUsers',
        authority: ['usuario:*','gestion_admin','super_admin'],
        feature:   'gestion-usuarios',
      },
    },
  },
};

export const pagesConfig = {
  ...authPages,
  ...privatePages,
};

export default pagesConfig;
