/**
 * aio.fields.ts
 * Source of truth for field definitions, groups, and validation hints for AIO.
 * Used by useFormCompleteness hook.
 */

export const AIO_FIELDS_METADATA = {
	brand: {
		type: 'string',
		label: 'Marca',
		group: 'Identificación',
		hint: 'Fabricante del equipo (Dell, HP, Lenovo, Apple, etc.)',
	},
	model: {
		type: 'string',
		label: 'Modelo',
		group: 'Identificación',
		hint: 'Modelo exacto del equipo para referencia',
	},
	line: {
		type: 'string',
		label: 'Línea',
		group: 'Identificación',
		hint: 'Serie o línea comercial (ej. OptiPlex, iMac)',
	},
	general_condition: {
		type: 'string',
		label: 'Condición general',
		group: 'Condición',
		allowed_values: [
			'like_new',
			'good_shape',
			'visible_wear',
			'needs_repair',
			'scrap',
		],
		hint: 'Estado general del equipo',
	},
	observations: {
		type: 'string',
		label: 'Observaciones',
		group: 'Notas',
		hint: 'Notas libres relevantes encontradas durante la revisión',
	},
	processor: {
		type: 'string',
		label: 'Procesador',
		group: 'Hardware',
	},
	ram_size: {
		type: 'string',
		label: 'RAM',
		group: 'Hardware',
	},
	ram_slots: {
		type: 'string',
		label: 'Slots RAM',
		group: 'Hardware',
	},
	ram_type: {
		type: 'string',
		label: 'Tipo de RAM',
		group: 'Hardware',
	},
	storage_size: {
		type: 'string',
		label: 'Almacenamiento',
		group: 'Hardware',
	},
	storage_technology: {
		type: 'string',
		label: 'Tecnología de disco',
		group: 'Hardware',
		allowed_values: ['HDD', 'SSD', 'M2', 'NVME', 'HYBRID'],
	},
	includes_power_adapter: {
		type: 'boolean',
		label: 'Incluye adaptador',
		group: 'Accesorios',
	},
	charger_status: {
		type: 'string',
		label: 'Estado adaptador',
		group: 'Accesorios',
		allowed_values: [
			'good_condition',
			'damaged_cable',
			'not_matching_equipment',
			'not_included',
			'broken_charger',
			'broken_port',
		],
	},
	screen_inches: {
		type: 'string',
		label: 'Pulgadas pantalla',
		group: 'Pantalla',
	},
	screen_condition: {
		type: 'string',
		label: 'Condición de pantalla',
		group: 'Pantalla',
		allowed_values: [
			'ok',
			'minor_wear',
			'worn',
			'missing_pieces',
			'dead_pixels',
			'broken',
			'spots',
		],
	},
	stand_condition: {
		type: 'string',
		label: 'Condición de base',
		group: 'Pantalla',
		allowed_values: ['ok', 'worn', 'missing_pieces', 'scratched', 'broken', 'no_stand'],
	},
	is_touchscreen: {
		type: 'boolean',
		label: 'Pantalla táctil',
		group: 'Pantalla',
	},
	cover_condition: {
		type: 'string',
		label: 'Carcasa / Tapa trasera',
		group: 'Carcasa',
		allowed_values: [
			'ok',
			'minor_wear',
			'worn',
			'missing_pieces',
			'scratched',
			'broken',
		],
	},
	vga_ports: {
		type: 'integer',
		label: 'Puertos VGA',
		group: 'Puertos',
		min: 0,
	},
	hdmi_ports: {
		type: 'integer',
		label: 'Puertos HDMI',
		group: 'Puertos',
		min: 0,
	},
	displayport_ports: {
		type: 'integer',
		label: 'Puertos DisplayPort',
		group: 'Puertos',
		min: 0,
	},
	usb_c_ports: {
		type: 'integer',
		label: 'Puertos USB-C',
		group: 'Puertos',
		min: 0,
	},
	usb_a_ports: {
		type: 'integer',
		label: 'Puertos USB-A',
		group: 'Puertos',
		min: 0,
	},
	rj45_ports: {
		type: 'integer',
		label: 'Puertos RJ45',
		group: 'Puertos',
		min: 0,
	},
	sd_readers: {
		type: 'integer',
		label: 'Lectores SD',
		group: 'Puertos',
		min: 0,
	},
	all_ports_functional: {
		type: 'boolean',
		label: 'Todos los puertos funcionales',
		group: 'Puertos',
	},
	defective_ports_count: {
		type: 'integer',
		label: 'Puertos defectuosos',
		group: 'Puertos',
		min: 0,
	},
	has_wifi: {
		type: 'boolean',
		label: 'WiFi',
		group: 'Otros',
	},
	has_bluetooth: {
		type: 'boolean',
		label: 'Bluetooth',
		group: 'Otros',
	},
	has_cd_drive: {
		type: 'boolean',
		label: 'Unidad óptica (CD/DVD)',
		group: 'Otros',
	},
	operating_system: {
		type: 'string',
		label: 'Sistema operativo',
		group: 'Software',
	},
} as const;
