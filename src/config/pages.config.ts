// src/config/pages.config.ts
export interface PageConfig {
  id: string;
  to: string;
  text: string;
  icon: string;
  authority: string[];
  feature?: string;
}

/* ---------- Auth & Public ---------- */
export const authPages = {
  loginPage:         { id:'loginPage',  to:'/login',                           text:'Login',                 icon:'HeroArrowRightOnRectangle', authority:[] },
  profilePage:       { id:'profilePage',to:'/profile',                         text:'Perfil',                icon:'HeroUser',                  authority:[] },
  aceptarInvitacion: { id:'aceptarInvitacion', to:'/invitar/aceptar/:token',   text:'Aceptar invitación',    icon:'HeroMailOpen',              authority:[] },
  recuperarPassword: { id:'recuperarPassword', to:'/recuperar-password',       text:'Recuperar contraseña',  icon:'HeroKey',                   authority:[] },
  confirmarNuevaPass:{ id:'confirmarNuevaPass',to:'/recuperar-password/confirmar/:uid/:token', text:'Confirmar nueva contraseña', icon:'HeroDocument', authority:[] },
} satisfies Record<string, PageConfig>;

/* ---------- Private ---------- */
export const privatePages: Record<string, PageConfig | { subPages: Record<string, PageConfig> }> = {
  dashboard: {
    id:'dashboard', to:'/dashboard', text:'Dashboard', icon:'HeroChartBarSquare',
    authority:['empresa:*'], feature:'dashboard',
  },
  products: {
    id:'products', to:'/productos', text:'Productos', icon:'HeroArchiveBox',
    authority:['producto:*'], feature:'products',
  },
  users: {
    id:'users', to:'/usuarios', text:'Usuarios', icon:'HeroUsers',
    authority:['usuario:*'], feature:'users',
  },
  quotes: {
    id:'quotes', to:'/cotizaciones', text:'Cotizaciones', icon:'HeroDocumentText',
    authority:['cotizacion:*'], feature:'quotes',
  },
  manage: {
    id:'manage', to:'/gestion', text:'Gestión', icon:'HeroBuildingStorefront',
    authority:['gestion_admin','super-admin'],          // ← corregido
    subPages:{
      company:{
        id:'company', to:'/gestion/empresa', text:'Empresa', icon:'HeroBuildingStorefront',
        authority:['empresa:*','gestion_admin','super-admin'], feature:'manage-company',
      },
      subsidiary:{
        id:'subsidiary', to:'/gestion/subempresa', text:'Subempresa', icon:'HeroBuildingStorefront',
        authority:['subempresa:*','gestion_admin','super-admin'], feature:'manage-subsidiary',
      },
      branch:{
        id:'branch', to:'/gestion/sucursal', text:'Sucursal', icon:'HeroBuildingStorefront',
        authority:['sucursal:*','gestion_admin','super-admin'], feature:'manage-branch',
      },
      roles:{
        id:'roles', to:'/gestion/roles-permisos', text:'Roles y permisos', icon:'HeroShieldCheck',
        authority:['rol:*','gestion_admin','super-admin'], feature:'manage-roles',
      },
      manageUsers:{
        id:'manageUsers', to:'/gestion/usuarios', text:'Usuarios', icon:'HeroUsers',
        authority:['usuario:*','gestion_admin','super-admin'], feature:'manage-users',
      },
    },
  },
};

export const pagesConfig = { ...authPages, ...privatePages };
export default pagesConfig;
