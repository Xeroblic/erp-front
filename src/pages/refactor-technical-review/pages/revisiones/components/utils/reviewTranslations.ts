/**
 * Traducciones y helpers para la sección de resumen de revisión técnica.
 * Reutiliza las traducciones existentes del módulo de revisión técnica.
 */
import type { EquipmentType } from '@/interface/technicalReviews.interface';
import {
    getNotebookLabel,
    NOTEBOOK_LABELS,
    GENERAL_CONDITION_LABELS,
    STORAGE_TECHNOLOGY_LABELS,
    CHARGER_STATUS_LABELS,
    SCREEN_CONDITION_LABELS,
    COVER_CONDITION_LABELS,
    KEYBOARD_CONDITION_LABELS,
    KEYBOARD_LAYOUT_LABELS,
    HINGE_CONDITION_LABELS,
} from '@/pages/refactor-technical-review/components/translations/notebook.labels';
import { getDesktopLabel, DESKTOP_LABELS } from '@/pages/refactor-technical-review/components/translations/desktop.labels';
import { getAioLabel, AIO_LABELS } from '@/pages/refactor-technical-review/components/translations/aio.labels';
import { getMonitorLabel, MONITOR_LABELS } from '@/pages/refactor-technical-review/components/translations/monitor.labels';
import { getDockingLabel, DOCKING_LABELS } from '@/pages/refactor-technical-review/components/translations/docking.labels';
import { EQUIPMENT_TYPE_OPTIONS } from '@/pages/refactor-technical-review/components/constants/technicalReview.constants';
import { COMMERCIAL_STATUS_CONFIG } from '@/pages/refactor-technical-review/components/constants/statuses.constant';

/** Mapa de funciones de label por tipo de equipo */
const LABEL_GETTERS: Record<EquipmentType, (field: string) => string> = {
    notebook: getNotebookLabel,
    desktop: getDesktopLabel,
    aio: getAioLabel,
    monitor: getMonitorLabel,
    docking: getDockingLabel,
};

/** Mapa de labels (keys = campos válidos) por tipo de equipo */
const LABELS_BY_TYPE: Record<EquipmentType, Record<string, string>> = {
    notebook: NOTEBOOK_LABELS,
    desktop: DESKTOP_LABELS,
    aio: AIO_LABELS,
    monitor: MONITOR_LABELS,
    docking: DOCKING_LABELS,
};

/** Mapa de tipos de equipo value → label, derivado de la constante existente */
const EQUIPMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
    EQUIPMENT_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

/** Mapa de estados de revisión value → label, derivado de la constante existente */
const REVIEW_STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    in_review: 'En Revisión',
    reviewed: 'Revisado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
};

/** Mapa de estados comerciales value → label, derivado de COMMERCIAL_STATUS_CONFIG */
const COMMERCIAL_STATUS_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(COMMERCIAL_STATUS_CONFIG).map(([key, cfg]) => [key, cfg.label]),
);

// Traducciones de valores comunes compuestas dinámicamente
const VALUE_TRANSLATIONS: Record<string, string> = {
    // Condiciones desde labels de notebook
    ...GENERAL_CONDITION_LABELS,
    ...STORAGE_TECHNOLOGY_LABELS,
    ...CHARGER_STATUS_LABELS,
    ...SCREEN_CONDITION_LABELS,
    ...COVER_CONDITION_LABELS,
    ...KEYBOARD_CONDITION_LABELS,
    ...KEYBOARD_LAYOUT_LABELS,
    ...HINGE_CONDITION_LABELS,

    // Extras no incluidos en los labels por tipo
    excellent: 'Excelente',
    good: 'Bueno',
    fair: 'Regular',
    poor: 'Malo',

    // Estados de revisión (derivados)
    ...REVIEW_STATUS_LABELS,

    // Estados comerciales (derivados)
    ...COMMERCIAL_STATUS_LABELS,

    // Tipos de equipo (derivados)
    ...EQUIPMENT_TYPE_LABELS,

    // Booleanos
    true: 'Sí',
    false: 'No',
    null: '-',

    // Tecnologías
    m2: 'M.2',
    ssd: 'SSD',
    hdd: 'HDD',
    ddr4: 'DDR4',
    ddr5: 'DDR5',
};

/**
 * Retorna el set de campos válidos para un tipo de equipo.
 * Usado para filtrar qué detalles mostrar en el resumen lateral.
 */
export const getFieldsForType = (equipmentType: EquipmentType): Set<string> | null => {
    const labels = LABELS_BY_TYPE[equipmentType];
    return labels ? new Set(Object.keys(labels)) : null;
};

/**
 * Traduce un nombre de campo a su etiqueta en español,
 * usando el mapa de traducciones correspondiente al tipo de equipo.
 */
export const translateField = (field: string, equipmentType?: EquipmentType): string => {
    const getter = equipmentType ? LABEL_GETTERS[equipmentType] : undefined;
    if (getter) return getter(field);
    return getNotebookLabel(field);
};

/** Tipo para valores que pueden venir del backend como string, objeto o primitivo */
export type TranslatableValue = string | number | boolean | null | undefined | { value?: string; label?: string; description?: string };

/** Traduce un valor (string, objeto o booleano) a su representación legible */
export const translateValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';

    // Si es un objeto con propiedades conocidas, extraer el valor
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        const extractedValue = (obj.value || obj.label || obj.description) as string | undefined;
        if (extractedValue) {
            return VALUE_TRANSLATIONS[extractedValue.toLowerCase()] || extractedValue;
        }
        return '-';
    }

    const strValue = String(value).toLowerCase();
    return VALUE_TRANSLATIONS[strValue] || String(value);
};

/** Extrae el valor primitivo de un campo que puede ser un objeto */
export const extractValue = (field: unknown): string => {
    if (!field) return 'N/A';
    if (typeof field === 'object' && field !== null) {
        const obj = field as Record<string, unknown>;
        return (obj.value as string) || (obj.label as string) || JSON.stringify(field);
    }
    return String(field);
};

/** Calcula la duración de la revisión a partir del item */
export const calculateReviewDuration = (item: { review_started_at?: string; reviewed_at?: string } | null): string | null => {
    if (!item?.review_started_at || !item?.reviewed_at) return null;

    const start = new Date(item.review_started_at);
    const end = new Date(item.reviewed_at);
    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) return null;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
        return `${minutes}min ${seconds}seg`;
    } else {
        return `${seconds}seg`;
    }
};

/** Genera texto de conectividad para observaciones/clipboard */
export const generateConnectivityText = (item: { details?: Record<string, unknown> | null } | null): string => {
    if (!item?.details) return '';

    const allPortsOk = extractValue(item.details.all_ports_functional);
    if (allPortsOk === 'true' || allPortsOk === 'Sí') return '';

    const portFields: Record<string, string> = {
        usb_a_ports: 'USB-A',
        usb_c_ports: 'USB-C',
        hdmi_ports: 'HDMI',
        displayport_ports: 'DisplayPort',
        vga_ports: 'VGA',
        rj45_ports: 'RJ45',
        sd_readers: 'Lector SD',
    };

    const activePorts: string[] = [];

    Object.entries(portFields).forEach(([field, label]) => {
        const value = item.details?.[field];
        const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;

        if (numValue > 0) {
            activePorts.push(label);
        }
    });

    if (activePorts.length === 0) return '';

    return `Conectividad:\n${activePorts.join('\n')}`;
};
