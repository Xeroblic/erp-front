// src/config/pages.config.ts
export interface PageConfig {
  id: string;
  to: string;
  text: string;
  icon: string;
  authority: string[];
}

export const authPages = {
  loginPage:         { id: 'loginPage', to: '/login', text: 'Login', icon: 'HeroArrowRightOnRectangle', authority: [] },
  profilePage:       { id: 'profilePage', to: '/profile', text: 'Perfil', icon: 'HeroUser', authority: [] },
  aceptarInvitacion: { id: 'aceptarInvitacion', to: '/invitar/aceptar/:token', text: 'Aceptar invitación', icon: 'HeroMailOpen', authority: [] },
  recuperarPassword: { id: 'recuperarPassword', to: '/recuperar-password', text: 'Recuperar contraseña', icon: 'HeroKey', authority: [] },
  confirmarNuevaPass:{ id: 'confirmarNuevaPass', to: '/recuperar-password/confirmar/:uid/:token', text: 'Confirmar nueva contraseña', icon: 'HeroDocument', authority: [] },
} satisfies Record<string, PageConfig>;

export const privatePages = {
  dashboard: {
    id: 'dashboard',
    to: '/dashboard',
    text: 'Dashboard',
    icon: 'HeroChartBarSquare',
    authority: ['dashboard.view'],
  },
  products: {
    id: 'products',
    to: '/productos',
    text: 'Productos',
    icon: 'HeroArchiveBox',
    authority: ['product.view'],
  },
  users: {
    id: 'users',
    to: '/usuarios',
    text: 'Usuarios',
    icon: 'HeroUsers',
    authority: ['user.view'],
  },
  quotes: {
    id: 'quotes',
    to: '/cotizaciones',
    text: 'Cotizaciones',
    icon: 'HeroDocumentText',
    authority: ['quote.view'],
  },
  manage: {
    id: 'manage',
    to: '/gestion',
    text: 'Gestión',
    icon: 'HeroBuildingStorefront',
    authority: ['company.view', 'subsidiary.view', 'branch.view', 'user.view', 'role.view'],
    subPages: {
      company: {
        id: 'company',
        to: '/gestion/empresa',
        text: 'Empresa',
        icon: 'HeroBuildingStorefront',
        authority: ['companies.view'],
      },
      subsidiary: {
        id: 'subsidiary',
        to: '/gestion/subempresa',
        text: 'Subempresa',
        icon: 'HeroBuildingStorefront',
        authority: ['subsidiaries.view'],
      },
      branch: {
        id: 'branch',
        to: '/gestion/sucursal',
        text: 'Sucursal',
        icon: 'HeroBuildingStorefront',
        authority: ['branches.view'],
      },
      roles: {
        id: 'roles',
        to: '/gestion/roles-permisos',
        text: 'Roles y permisos',
        icon: 'HeroShieldCheck',
        authority: ['user.edit-roles'],
      },
      manageUsers: {
        id: 'manageUsers',
        to: '/gestion/usuarios',
        text: 'Usuarios',
        icon: 'HeroUsers',
        authority: ['user.view'],
      },
    },
  },
};

export const pagesConfig = { ...authPages, ...privatePages };
export default pagesConfig;
