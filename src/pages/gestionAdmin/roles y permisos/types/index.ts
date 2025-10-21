import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

export type TabType = 'informacion' | 'roles' | 'permisos' | 'acceso_jerarquico';

export interface UserRow extends UserWithDetails {
    displayName: string;
    cargoResolved: string;
    companyResolved: string;
    uniqueRoles: string[];
    directPermissionsCount: number;
    totalPermissionsCount: number;
    searchText: string;
}

export interface TabConfig {
    id: TabType;
    label: string;
    icon: string;
}

export interface DynamicTabsProps {
    tabs: TabConfig[];
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    className?: string;
}

export interface UserPermissionsFormValues {
    roles: string[];
    permisos: string[];
}
