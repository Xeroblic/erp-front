/**
 * Technical Reviews - Equipment Types Constants
 * Constantes compartidas para tipos de equipos
 */
import type { TSelectOption } from '@/components/form/SelectReact';
import type { EquipmentType } from '@/interface/technicalReviews.interface';

/**
 * Tipos de equipos soportados
 */
export const EQUIPMENT_TYPES = {
    NOTEBOOK: 'notebook',
    DESKTOP: 'desktop',
    AIO: 'aio',
    DOCKING: 'docking',
    MONITOR: 'monitor',
} as const;

/**
 * Opciones para select de tipos de equipo
 */
export const EQUIPMENT_TYPE_OPTIONS: TSelectOption[] = [
    { value: 'notebook', label: 'Notebook' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'aio', label: 'All-in-One (AIO)' },
    { value: 'docking', label: 'Docking Station' },
    { value: 'monitor', label: 'Monitor' },
];

/**
 * Labels para tipos de equipo
 */
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
    notebook: 'Notebook',
    desktop: 'Desktop',
    aio: 'All-in-One (AIO)',
    docking: 'Docking Station',
    monitor: 'Monitor',
};

/**
 * Iconos por tipo de equipo (Hero Icons)
 */
export const EQUIPMENT_TYPE_ICONS: Record<EquipmentType, string> = {
    notebook: 'HeroComputerDesktop',
    desktop: 'HeroServerStack',
    aio: 'HeroDeviceTablet',
    docking: 'HeroCpuChip',
    monitor: 'HeroTv',
};

/**
 * Helper para obtener label de tipo de equipo
 */
export const getEquipmentTypeLabel = (type: EquipmentType | string | null | undefined): string => {
    if (!type) return 'No especificado';
    return EQUIPMENT_TYPE_LABELS[type as EquipmentType] || type;
};

/**
 * Helper para obtener icono de tipo de equipo
 */
export const getEquipmentTypeIcon = (type: EquipmentType | string | null | undefined): string => {
    if (!type) return 'HeroQuestionMarkCircle';
    return EQUIPMENT_TYPE_ICONS[type as EquipmentType] || 'HeroQuestionMarkCircle';
};

/**
 * Helper para validar si un string es un tipo de equipo válido
 */
export const isValidEquipmentType = (type: string): type is EquipmentType => {
    return Object.values(EQUIPMENT_TYPES).includes(type as EquipmentType);
};
