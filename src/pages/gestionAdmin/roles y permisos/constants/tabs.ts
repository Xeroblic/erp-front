import type { TabConfig } from '../types';

export const USER_DETAIL_TABS: TabConfig[] = [
    {
        id: 'informacion',
        label: 'Información General',
        icon: 'HeroUser',
    },
    {
        id: 'roles',
        label: 'Roles',
        icon: 'HeroShieldCheck',
    },
    {
        id: 'permisos',
        label: 'Permisos',
        icon: 'HeroLockClosed',
    },
    {
        id: 'acceso_jerarquico',
        label: 'Acceso Jerárquico',
        icon: 'HeroUsers',
    },
];
