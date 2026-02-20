/**
 * desktop.fields.ts
 * Source of truth for field definitions, groups, and validation hints.
 * Used by useFormCompleteness hook or similar logic.
 */

export const DESKTOP_FIELDS_METADATA = {
	brand: {
		type: 'string',
		label: 'Marca',
		group: 'Identificación',
		hint: 'Fabricante del equipo (Dell, HP, Lenovo, etc.)',
	},
	model: {
		type: 'string',
		label: 'Modelo',
		group: 'Identificación',
		hint: 'Modelo exacto del equipo para referencia y compatibilidad',
	},
	line: {
		type: 'string',
		label: 'Línea',
		group: 'Identificación',
		hint: 'Línea del producto (ej: OptiPlex, ThinkCentre)',
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
		hint: 'Estado general del equipo considerando estética y funcionamiento global',
	},
	observations: {
		type: 'string',
		label: 'Observaciones',
		group: 'Notas',
		hint: 'Notas libres relevantes encontradas durante la revisión',
	},
	extra_attributes: {
		type: 'object',
		label: 'Atributos extra',
		group: 'Extras',
		hint: 'Contenedor para atributos específicos no estandarizados',
	},
	processor: {
		type: 'string',
		label: 'Procesador',
		group: 'Hardware',
		hint: 'Modelo de CPU (ej: Intel i5-9500, Ryzen 5 3600)',
	},
	ram_size: {
		type: 'string',
		label: 'RAM',
		group: 'Hardware',
		hint: 'Capacidad total de memoria RAM',
	},
	ram_slots: {
		type: 'string',
		label: 'Slots RAM',
		group: 'Hardware',
		hint: 'Formato cantidad x módulos (total x cantidad de módulos)',
	},
	ram_type: {
		type: 'string',
		label: 'Tipo de RAM',
		group: 'Hardware',
		hint: 'Tecnología de RAM soportada',
	},
	storage_size: {
		type: 'string',
		label: 'Almacenamiento',
		group: 'Hardware',
		hint: 'Capacidad de almacenamiento principal',
	},
	storage_technology: {
		type: 'string',
		label: 'Tecnología de disco',
		group: 'Hardware',
		allowed_values: ['HDD', 'SSD', 'M2', 'NVME', 'HYBRID'],
		hint: 'Tipo de unidad de almacenamiento',
	},
	includes_charger: {
		type: 'boolean',
		label: 'Incluye cable/fuente',
		group: 'Accesorios',
		hint: 'Indica si se entrega con cable de poder o fuente externa',
	},
	charger_status: {
		type: 'string',
		label: 'Estado cable/fuente',
		group: 'Accesorios',
		allowed_values: [
			'good_condition',
			'damaged_cable',
			'not_matching_equipment',
			'not_included',
			'broken_charger',
			'broken_port',
		],
		hint: 'Condición de la fuente/cable',
	},
	cover_condition: {
		type: 'string',
		label: 'Carcasa',
		group: 'Carcasa',
		allowed_values: [
			'ok',
			'good_condition',
			'light_scratches',
			'noticeable_wear',
			'broken',
		],
		hint: 'Estado estético del case/gabinete',
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
	sd_readers: {
		type: 'integer',
		label: 'Lectores SD',
		group: 'Puertos',
		min: 0,
	},
	rj45_ports: {
		type: 'integer',
		label: 'Puertos RJ45',
		group: 'Puertos',
		min: 0,
	},
	all_ports_functional: {
		type: 'boolean',
		label: 'Todos los puertos funcionales',
		group: 'Puertos',
		hint: 'Marca si todos los puertos probados funcionan correctamente',
	},
	defective_ports_count: {
		type: 'integer',
		label: 'Puertos defectuosos',
		group: 'Puertos',
		min: 0,
		hint: 'Cantidad de puertos dañados',
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
		label: 'Lector CD/DVD',
		group: 'Otros',
	},
	operating_system: {
		type: 'string',
		label: 'Sistema operativo',
		group: 'Software',
		hint: 'SO instalado o recomendado',
	},
} as const;
