/**
 * notebook.groups.ts
 * Agrupación de campos del formulario de Notebook por sección.
 * Define el orden de renderizado de los grupos y qué campos pertenecen a cada uno.
 */

export type NotebookGroup =
	| 'Identificación'
	| 'Condición'
	| 'Hardware'
	| 'Pantalla'
	| 'Carcasa'
	| 'Batería'
	| 'Puertos'
	| 'Accesorios'
	| 'Software'
	| 'Otros'
	| 'Notas'
	| 'Extras';

/** Orden de renderizado de los grupos en el formulario */
export const NOTEBOOK_GROUP_ORDER: NotebookGroup[] = [
	'Identificación',
	'Hardware',
	'Pantalla',
	'Carcasa',
	'Batería',
	'Puertos',
	'Accesorios',
	'Software',
	'Condición',
	'Otros',
	'Notas',
	'Extras',
];

/** Mapeo campo → grupo */
export const NOTEBOOK_FIELD_GROUPS: Record<string, NotebookGroup> = {
	// Identificación
	brand: 'Identificación',
	model: 'Identificación',

	// Hardware
	processor: 'Hardware',
	ram_size: 'Hardware',
	ram_slots: 'Hardware',
	ram_type: 'Hardware',
	storage_size: 'Hardware',
	storage_technology: 'Hardware',

	// Pantalla
	screen_inches: 'Pantalla',
	screen_condition: 'Pantalla',
	is_touchscreen: 'Pantalla',

	// Carcasa
	cover_condition: 'Carcasa',
	keyboard_condition: 'Carcasa',
	keyboard_layout: 'Carcasa',
	hinge_condition: 'Carcasa',
	touchpad_condition: 'Carcasa',
	bottom_condition: 'Carcasa',
	has_numeric_keypad: 'Carcasa',
	has_backlit_keyboard: 'Carcasa',

	// Batería
	battery_health: 'Batería',
	battery_status: 'Batería',
	battery_percentage: 'Batería',
	has_second_battery: 'Batería',
	second_battery_status: 'Batería',
	second_battery_percentage: 'Batería',
	second_battery_condition: 'Batería',

	// Puertos
	vga_ports: 'Puertos',
	hdmi_ports: 'Puertos',
	displayport_ports: 'Puertos',
	usb_c_ports: 'Puertos',
	usb_a_ports: 'Puertos',
	sd_readers: 'Puertos',
	rj45_ports: 'Puertos',
	all_ports_functional: 'Puertos',
	defective_ports_count: 'Puertos',

	// Accesorios
	includes_charger: 'Accesorios',
	charger_watts: 'Accesorios',
	charger_status: 'Accesorios',

	// Software
	operating_system: 'Software',

	// Condición
	general_condition: 'Condición',

	// Otros
	has_biometric: 'Otros',
	has_wifi: 'Otros',
	has_bluetooth: 'Otros',

	// Notas
	observations: 'Notas',

	// Extras
	extra_attributes: 'Extras',
};

/** Campos agrupados por sección (inverso de NOTEBOOK_FIELD_GROUPS) */
export const NOTEBOOK_FIELDS_BY_GROUP: Record<NotebookGroup, string[]> = {
	Identificación: ['brand', 'model'],
	Hardware: ['processor', 'ram_size', 'ram_slots', 'ram_type', 'storage_size', 'storage_technology'],
	Pantalla: ['screen_inches', 'screen_condition', 'is_touchscreen'],
	Carcasa: [
		'cover_condition',
		'keyboard_condition',
		'keyboard_layout',
		'hinge_condition',
		'touchpad_condition',
		'bottom_condition',
		'has_numeric_keypad',
		'has_backlit_keyboard',
	],
	Batería: [
		'battery_health',
		'battery_status',
		'battery_percentage',
		'has_second_battery',
		'second_battery_status',
		'second_battery_percentage',
		'second_battery_condition',
	],
	Puertos: [
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_c_ports',
		'usb_a_ports',
		'sd_readers',
		'rj45_ports',
		'all_ports_functional',
		'defective_ports_count',
	],
	Accesorios: ['includes_charger', 'charger_watts', 'charger_status'],
	Software: ['operating_system'],
	Condición: ['general_condition'],
	Otros: ['has_biometric', 'has_wifi', 'has_bluetooth'],
	Notas: ['observations'],
	Extras: ['extra_attributes'],
};
