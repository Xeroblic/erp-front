/**
 * desktop.hints.ts
 * Textos de ayuda (hints) y ejemplos de placeholder para los campos del formulario de Desktop.
 * Los hints de campos críticos incluyen advertencias de reglas de negocio.
 */

export const DESKTOP_HINTS: Record<string, string> = {
	brand: 'Fabricante del equipo (Dell, HP, Lenovo, etc.)',
	model: 'Modelo exacto del equipo para referencia y compatibilidad',
	line: 'Línea del producto (ej: OptipleX, ThinkCentre)',
	general_condition: 'Estado general del equipo considerando estética y funcionamiento global',
	observations: 'Notas libres relevantes encontradas durante la revisión',
	extra_attributes: 'Contenedor para atributos específicos no estandarizados',
	processor: 'Modelo de CPU (ej: Intel i5-9500, Ryzen 5 3600)',
	ram_size: 'Capacidad total de memoria RAM',
	ram_slots: 'Formato cantidad × módulos (total × cantidad de módulos). Ej: 8x2, 16x1',
	ram_type: 'Tecnología de RAM soportada',
	storage_size: 'Capacidad de almacenamiento principal',
	storage_technology: 'Tipo de unidad de almacenamiento. M.2 se normaliza automáticamente a M2',
	includes_charger: 'Indica si se entrega con cable de poder o fuente externa',
	charger_status: 'Condición del cable/fuente si se incluye',
	cover_condition: 'Estado estético del case/gabinete',
	vga_ports: 'Cantidad de puertos VGA funcionales',
	hdmi_ports: 'Cantidad de puertos HDMI funcionales',
	displayport_ports: 'Cantidad de puertos DisplayPort funcionales',
	dvi_ports: 'Cantidad de puertos DVI funcionales',
	usb_c_ports: 'Cantidad de puertos USB-C funcionales',
	usb_a_ports: 'Cantidad de puertos USB-A funcionales',
	sd_readers: 'Cantidad de lectores de tarjeta SD',
	rj45_ports: 'Cantidad de puertos de red RJ45',
	charging_ports: 'Cantidad de puertos de carga del equipo',
	all_ports_functional: 'Marca si todos los puertos probados funcionan correctamente',
	defective_ports_count:
		'⚠️ Solo 1 puerto dañado = Máximo Grado C. Más de 1 puerto dañado = Grado M automáticamente',
	has_wifi: 'Tarjeta de red inalámbrica instalada',
	has_bluetooth: 'Conectividad Bluetooth disponible',
	has_cd_drive: 'Unidad óptica instalada y funcional',
	operating_system: 'Sistema operativo instalado o recomendado',
};

export const DESKTOP_PLACEHOLDERS: Record<string, string> = {
	brand: 'Ej: Dell, HP, Lenovo',
	model: 'Ej: OptiPlex 3070, ThinkCentre M720q',
	line: 'Ej: SFF, Micro, Tower',
	processor: 'Ej: Intel Core i5-9500',
	ram_size: 'Ej: 8GB, 16GB',
	ram_slots: 'Ej: 8x1, 4x2',
	ram_type: 'Ej: DDR4, DDR3',
	storage_size: 'Ej: 256GB, 512GB, 1TB',
	observations: 'Ej: Case con rayón lateral, faltan gomas base...',
	operating_system: 'Ej: Windows 10 Pro',
};

/**
 * Advertencias de reglas de negocio críticas.
 * Se muestran como alertas destacadas en el formulario.
 */
export const DESKTOP_WARNINGS: Record<string, string> = {
	defective_ports_count:
		'Si tiene más de 1 puerto dañado, el equipo será categoría M independientemente de todo lo demás.',
	cover_condition: 'Carcasa Rota fuerza Grado M. Desgaste notorio puede limitar a C.',
};
