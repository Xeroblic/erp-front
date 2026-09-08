/**
 * equipment.labels.ts
 * Rótulo en español de un campo, resuelto por tipo de equipo.
 *
 * Cada tipo ya tenía su mapa y su getter, pero no había forma de rotular un campo
 * cuando el tipo de equipo es un dato en tiempo de ejecución, como en el autosave, que
 * es genérico para los cinco formularios.
 */
import { AIO_LABELS } from './aio.labels';
import { DESKTOP_LABELS } from './desktop.labels';
import { DOCKING_LABELS } from './docking.labels';
import { MONITOR_LABELS } from './monitor.labels';
import { NOTEBOOK_LABELS } from './notebook.labels';

/** Mapa por tipo de equipo, expuesto como los mapas por tipo de cada archivo hermano. */
export const LABELS_BY_EQUIPMENT: Record<string, Record<string, string>> = {
	notebook: NOTEBOOK_LABELS,
	desktop: DESKTOP_LABELS,
	aio: AIO_LABELS,
	'all-in-one': AIO_LABELS,
	docking: DOCKING_LABELS,
	monitor: MONITOR_LABELS,
};

const humanize = (field: string): string =>
	field.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

/**
 * Los nombres de campo se comparten entre tipos, así que un tipo desconocido cae al mapa
 * de notebook —el más completo— antes de degradar al nombre crudo del campo.
 */
export const getEquipmentFieldLabel = (field: string, equipmentType?: string): string => {
	const labels = equipmentType ? LABELS_BY_EQUIPMENT[equipmentType.toLowerCase()] : undefined;

	return labels?.[field] ?? NOTEBOOK_LABELS[field] ?? humanize(field);
};
