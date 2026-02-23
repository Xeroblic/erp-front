/**
 * allowedValuesMap.ts
 * Centralized map of constrained field values per equipment type.
 *
 * Used by the autosave `transformData` to dynamically strip any field value
 * that is not in the backend's allowed_values list — preventing 422 errors.
 *
 * Each key is a field name; each value is the array of allowed values.
 * If a field is not in the map for a given equipment type, it is not constrained.
 */

import {
	ALLOWED_GENERAL_CONDITIONS as NB_GENERAL,
	ALLOWED_STORAGE_TECHNOLOGIES as NB_STORAGE,
	ALLOWED_CHARGER_STATUSES as NB_CHARGER,
	ALLOWED_SCREEN_CONDITIONS as NB_SCREEN,
	ALLOWED_COVER_CONDITIONS as NB_COVER,
	ALLOWED_KEYBOARD_CONDITIONS as NB_KEYBOARD,
	ALLOWED_HINGE_CONDITIONS as NB_HINGE,
	ALLOWED_BATTERY_STATUSES as NB_BATTERY,
	ALLOWED_TOUCHPAD_CONDITIONS as NB_TOUCHPAD,
	ALLOWED_BOTTOM_CONDITIONS as NB_BOTTOM,
	ALLOWED_KEYBOARD_LAYOUTS as NB_KB_LAYOUT,
} from './notebook.rules';

import {
	ALLOWED_GENERAL_CONDITIONS as DK_GENERAL,
	ALLOWED_STORAGE_TECHNOLOGIES as DK_STORAGE,
	ALLOWED_CHARGER_STATUSES as DK_CHARGER,
	ALLOWED_COVER_CONDITIONS as DK_COVER,
} from './desktop.rules';

import {
	ALLOWED_GENERAL_CONDITIONS as AIO_GENERAL,
	ALLOWED_STORAGE_TECHNOLOGIES as AIO_STORAGE,
	ALLOWED_CHARGER_STATUSES as AIO_CHARGER,
	ALLOWED_SCREEN_CONDITIONS as AIO_SCREEN,
	ALLOWED_STAND_CONDITIONS as AIO_STAND,
	ALLOWED_COVER_CONDITIONS as AIO_COVER,
} from './aio.rules';

import {
	ALLOWED_GENERAL_CONDITIONS as DCK_GENERAL,
	ALLOWED_COVER_CONDITIONS as DCK_COVER,
} from './docking.rules';

import {
	ALLOWED_GENERAL_CONDITIONS as MON_GENERAL,
	ALLOWED_SCREEN_CONDITIONS as MON_SCREEN,
	ALLOWED_STAND_CONDITIONS as MON_STAND,
	ALLOWED_FRAME_CONDITIONS as MON_FRAME,
} from './monitor.rules';

// ─── Type ─────────────────────────────────────────────────────────────────────

type AllowedValuesMap = Record<string, readonly string[]>;

// ─── Maps per equipment type ──────────────────────────────────────────────────

const NOTEBOOK_ALLOWED: AllowedValuesMap = {
	general_condition: NB_GENERAL,
	storage_technology: NB_STORAGE,
	charger_status: NB_CHARGER,
	screen_condition: NB_SCREEN,
	cover_condition: NB_COVER,
	keyboard_condition: NB_KEYBOARD,
	keyboard_layout: NB_KB_LAYOUT,
	hinge_condition: NB_HINGE,
	battery_status: NB_BATTERY,
	touchpad_condition: NB_TOUCHPAD,
	bottom_condition: NB_BOTTOM,
};

const DESKTOP_ALLOWED: AllowedValuesMap = {
	general_condition: DK_GENERAL,
	storage_technology: DK_STORAGE,
	charger_status: DK_CHARGER,
	cover_condition: DK_COVER,
};

const AIO_ALLOWED: AllowedValuesMap = {
	general_condition: AIO_GENERAL,
	storage_technology: AIO_STORAGE,
	charger_status: AIO_CHARGER,
	screen_condition: AIO_SCREEN,
	stand_condition: AIO_STAND,
	cover_condition: AIO_COVER,
};

const DOCKING_ALLOWED: AllowedValuesMap = {
	general_condition: DCK_GENERAL,
	cover_condition: DCK_COVER,
};

const MONITOR_ALLOWED: AllowedValuesMap = {
	general_condition: MON_GENERAL,
	screen_condition: MON_SCREEN,
	stand_condition: MON_STAND,
	frame_condition: MON_FRAME,
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

const EQUIPMENT_ALLOWED_MAP: Record<string, AllowedValuesMap> = {
	notebook: NOTEBOOK_ALLOWED,
	desktop: DESKTOP_ALLOWED,
	aio: AIO_ALLOWED,
	'all-in-one': AIO_ALLOWED,
	docking: DOCKING_ALLOWED,
	monitor: MONITOR_ALLOWED,
};

/**
 * Returns the allowed values map for a given equipment type.
 * Returns empty map if the equipment type is unknown.
 */
export const getAllowedValuesMap = (equipmentType: string): AllowedValuesMap => {
	return EQUIPMENT_ALLOWED_MAP[equipmentType.toLowerCase()] ?? {};
};

/**
 * Sanitizes form data by removing any constrained field whose value
 * is not in the allowed values list for the given equipment type.
 *
 * This prevents 422 errors when autosave sends stale/invalid values.
 */
export const sanitizeByAllowedValues = (
	data: Record<string, unknown>,
	equipmentType: string,
): Record<string, unknown> => {
	const allowedMap = getAllowedValuesMap(equipmentType);

	// No constraints for this equipment type → return as-is
	if (Object.keys(allowedMap).length === 0) return data;

	const result = { ...data };

	for (const [field, allowedValues] of Object.entries(allowedMap)) {
		const value = result[field];
		if (value !== undefined && value !== null && value !== '') {
			if (!allowedValues.includes(value as string)) {
				// Strip invalid value — backend would reject it
				delete result[field];
			}
		}
	}

	return result;
};
