// Páginas principales
export { default as RolesPermisos } from './RolesPermisos';
export { default as UserPermissionsDetail } from './UserPermissionsDetail';

// Componentes
export { default as DynamicTabs } from './components/DynamicTabs';

// Tabs
export { default as InformacionTab } from './tabs/InformacionTab';
export { default as RolesTab } from './tabs/RolesTab';
export { default as PermisosTab } from './tabs/PermisosTab';

// Hooks
export { useUserData } from './hooks/useUserData';
export { useUserPermissions } from './hooks/useUserPermissions';

// Utilidades
export { transformUserToRow, transformUsersToRows } from './utils/transformers';
export { globalFilterFn } from './utils/filters';

// Constantes
export { USER_DETAIL_TABS } from './constants/tabs';

// Types
export type {
    TabType,
    UserRow,
    TabConfig,
    DynamicTabsProps,
    UserPermissionsFormValues,
} from './types';
