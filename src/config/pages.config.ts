// src/config/pages.config.ts
export interface PageConfig {
  id: string;
  to: string;
  text: string;
  icon: string;
  authority: string[];
  /** Roles específicos requeridos */
  roles?: string[];
  /** Empresa específica requerida */
  companyId?: number;
  /** Requerir todos los permisos (modo AND) */
  requireAll?: boolean;
}

export const authPages = {
  loginPage: { id: 'loginPage', to: '/login', text: 'Login', icon: 'HeroArrowRightOnRectangle', authority: [] },
  profilePage: { id: 'profilePage', to: '/profile', text: 'Perfil', icon: 'HeroUser', authority: [] },
  aceptarInvitacion: { id: 'aceptarInvitacion', to: '/invitar/aceptar/:token', text: 'Aceptar invitación', icon: 'HeroMailOpen', authority: [] },
  recuperarPassword: { id: 'recuperarPassword', to: '/recuperar-password', text: 'Recuperar contraseña', icon: 'HeroKey', authority: [] },
  confirmarNuevaPass: { id: 'confirmarNuevaPass', to: '/recuperar-password/confirmar/:uid/:token', text: 'Confirmar nueva contraseña', icon: 'HeroDocument', authority: [] },
} satisfies Record<string, PageConfig>;

export const privatePages = {
  dashboard: {
    id: 'dashboard',
    to: '/dashboard',
    text: 'Dashboard',
    icon: 'HeroChartBarSquare',
    authority: [], // Temporalmente sin permisos para testing
    roles: ['super-admin', 'company-admin', 'subsidiary-admin', 'branch-admin', 'employee'],
  },
  users: {
    id: 'users',
    to: '/usuarios',
    text: 'Usuarios',
    icon: 'HeroUsers',
    authority: ['view-users', 'manage-users'],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
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
      'view-users',
      'edit-roles'
    ],
    roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
    subPages: {
      company: {
        id: 'company',
        to: '/gestion/empresa',
        text: 'Empresa',
        icon: 'HeroBuildingStorefront',
        authority: ['view-company', 'edit-company'],
        roles: ['super-admin', 'company-admin'],
      },
      subsidiary: {
        id: 'subsidiary',
        to: '/gestion/subempresa',
        text: 'Subempresa',
        icon: 'HeroBuildingStorefront',
        authority: ['view-subsidiary', 'edit-subsidiary'],
        roles: ['super-admin', 'company-admin'],
      },
      branch: {
        id: 'branch',
        to: '/gestion/sucursal',
        text: 'Sucursal',
        icon: 'HeroBuildingStorefront',
        authority: ['view-branch', 'edit-branch'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
      },
      roles: {
        id: 'roles',
        to: '/gestion/roles-permisos',
        text: 'Roles y permisos',
        icon: 'HeroShieldCheck',
        authority: ['edit-roles'],
        roles: ['super-admin'],
        requireAll: true,
      },
      manageUsers: {
        id: 'manageUsers',
        to: '/gestion/usuarios',
        text: 'Usuarios',
        icon: 'HeroUsers',
        authority: ['view-users', 'manage-users'],
        roles: ['super-admin', 'company-admin', 'subsidiary-admin'],
      },
      permissionsAdmin: {
        id: 'permissionsAdmin',
        to: '/admin/permisos',
        text: 'Administrar Permisos',
        icon: 'HeroShieldCheck',
        authority: ['manage-permissions'],
        roles: ['super-admin'],
        requireAll: true,
      },
    },
  },
  humanResources: {
    id: 'humanResources',
    to: '/rrhh',
    text: 'Recursos Humanos',
    icon: 'HeroUserGroup',
    authority: [], // Sin restricciones de permisos específicos
    roles: ['super-admin', 'hr'],
    requireAll: false,
    subPages: {
      invitationsAdmin: {
        id: 'invitationsAdmin',
        to: '/admin/invitaciones',
        text: 'Gestionar Invitaciones',
        icon: 'HeroPaperAirplane',
        authority: ['manage-invitations'],
        roles: ['', 'hr'],
        requireAll: false,
      },
    },
  },
};


export const pagesConfig = { ...authPages, ...privatePages };
export default pagesConfig;
