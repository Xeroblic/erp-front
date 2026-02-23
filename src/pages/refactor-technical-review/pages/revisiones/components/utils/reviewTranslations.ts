/**
 * Traducciones y helpers para la sección de resumen de revisión técnica.
 * Reutiliza las traducciones existentes del módulo de revisión técnica.
 */
import { getNotebookLabel, GENERAL_CONDITION_LABELS, STORAGE_TECHNOLOGY_LABELS, CHARGER_STATUS_LABELS, SCREEN_CONDITION_LABELS, COVER_CONDITION_LABELS, KEYBOARD_CONDITION_LABELS, KEYBOARD_LAYOUT_LABELS, HINGE_CONDITION_LABELS } from '@/pages/refactor-technical-review/components/translations/notebook.labels';
import { getDesktopLabel } from '@/pages/refactor-technical-review/components/translations/desktop.labels';
import { getAioLabel } from '@/pages/refactor-technical-review/components/translations/aio.labels';
import { getMonitorLabel } from '@/pages/refactor-technical-review/components/translations/monitor.labels';
import { getDockingLabel } from '@/pages/refactor-technical-review/components/translations/docking.labels';

/** Mapa de funciones de label por tipo de equipo */
const LABEL_GETTERS: Record<string, (field: string) => string> = {
    notebook: getNotebookLabel,
    desktop: getDesktopLabel,
    aio: getAioLabel,
    monitor: getMonitorLabel,
    docking: getDockingLabel,
};

// Traducciones de valores comunes que no están en los archivos de labels por tipo
const VALUE_TRANSLATIONS: Record<string, string> = {
    // Condiciones genéricas
    ...GENERAL_CONDITION_LABELS,
    ...STORAGE_TECHNOLOGY_LABELS,
    ...CHARGER_STATUS_LABELS,
    ...SCREEN_CONDITION_LABELS,
    ...COVER_CONDITION_LABELS,
    ...KEYBOARD_CONDITION_LABELS,
    ...KEYBOARD_LAYOUT_LABELS,
    ...HINGE_CONDITION_LABELS,

    // Condiciones legibles extras
    excellent: 'Excelente',
    good: 'Bueno',
    fair: 'Regular',
    poor: 'Malo',

    // Estados de revisión
    pending: 'Pendiente',
    in_review: 'En Revisión',
    reviewed: 'Revisado',
    approved: 'Aprobado',
    rejected: 'Rechazado',

    // Tipos de equipo
    notebook: 'Notebook',
    desktop: 'Desktop',
    aio: 'All-in-One',
    docking: 'Docking Station',
    monitor: 'Monitor',

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
 * Traduce un nombre de campo a su etiqueta en español,
 * usando el mapa de traducciones correspondiente al tipo de equipo.
 */
export const translateField = (field: string, equipmentType?: string): string => {
    const getter = equipmentType ? LABEL_GETTERS[equipmentType] : undefined;
    if (getter) return getter(field);
    // Fallback: intentar notebook (el más completo) y luego formatear
    return getNotebookLabel(field);
};

/** Traduce un valor (string, objeto o booleano) a su representación legible */
export const translateValue = (value: any): string => {
    if (value === null || value === undefined) return '-';

    // Si es un objeto, extraer el valor primero
    if (typeof value === 'object' && value !== null) {
        const extractedValue = value.value || value.label || value.description;
        if (extractedValue) {
            value = extractedValue;
        } else {
            return '-';
        }
    }

    const strValue = String(value).toLowerCase();
    return VALUE_TRANSLATIONS[strValue] || String(value);
};

/** Extrae el valor primitivo de un campo que puede ser un objeto */
export const extractValue = (field: any): string => {
    if (!field) return 'N/A';
    if (typeof field === 'object') {
        return field.value || field.label || JSON.stringify(field);
    }
    return String(field);
};

/** Calcula la duración de la revisión a partir del item */
export const calculateReviewDuration = (item: any): string | null => {
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
export const generateConnectivityText = (item: any): string => {
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
        const value = item.details[field];
        const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;

        if (numValue > 0) {
            activePorts.push(label);
        }
    });

    if (activePorts.length === 0) return '';

    return `Conectividad:\n${activePorts.join('\n')}`;
};
