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
    authority: ['view-dashboard'],
  },
  users: {
    id: 'users',
    to: '/usuarios',
    text: 'Usuarios',
    icon: 'HeroUsers',
    authority: ['view-user'],
  },
  manage: {
    id: 'manage',
    to: '/gestion',
    text: 'Gestión',
    icon: 'HeroBuildingStorefront',
    authority: [
      'view-company',
      'view-subsidiary',
      'view-branch',
      'view-user',
      'edit-roles'
    ],
    subPages: {
      company: {
        id: 'company',
        to: '/gestion/empresa',
        text: 'Empresa',
        icon: 'HeroBuildingStorefront',
        authority: ['view-company'],
      },
      subsidiary: {
        id: 'subsidiary',
        to: '/gestion/subempresa',
        text: 'Subempresa',
        icon: 'HeroBuildingStorefront',
        authority: ['view-subsidiary'],
      },
      branch: {
        id: 'branch',
        to: '/gestion/sucursal',
        text: 'Sucursal',
        icon: 'HeroBuildingStorefront',
        authority: ['view-branch'],
      },
      roles: {
        id: 'roles',
        to: '/gestion/roles-permisos',
        text: 'Roles y permisos',
        icon: 'HeroShieldCheck',
        authority: ['edit-roles'],
      },
      manageUsers: {
        id: 'manageUsers',
        to: '/gestion/usuarios',
        text: 'Usuarios',
        icon: 'HeroUsers',
        authority: ['view-user'],
      },
    },
  },
};


export const pagesConfig = { ...authPages, ...privatePages };
export default pagesConfig;
