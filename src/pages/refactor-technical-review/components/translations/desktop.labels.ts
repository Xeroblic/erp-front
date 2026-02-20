/**
 * desktop.labels.ts
 * Etiquetas (labels) para el formulario de revisión de Desktop.
 * Se usan para mostrar nombres amigables en error messages y UI.
 */
export const DESKTOP_LABELS: Record<string, string> = {
	brand: 'Marca',
	model: 'Modelo',
	line: 'Línea',
	general_condition: 'Condición General',
	processor: 'Procesador',
	ram_size: 'Memoria RAM',
	ram_slots: 'Slots RAM',
	ram_type: 'Tipo RAM',
	storage_size: 'Almacenamiento',
	storage_technology: 'Tecnología Disco',
	cover_condition: 'Carcasa',
	vga_ports: 'Puerto VGA',
	hdmi_ports: 'Puerto HDMI',
	displayport_ports: 'Puerto DisplayPort',
	usb_c_ports: 'Puerto USB-C',
	usb_a_ports: 'Puerto USB-A',
	sd_readers: 'Lector SD',
	rj45_ports: 'Puerto Ethernet',
	all_ports_functional: '¿Todos los puertos funcionan?',
	defective_ports_count: 'Puertos Defectuosos',
	includes_charger: '¿Incluye Cable/Fuente?',
	charger_status: 'Estado Cable/Fuente',
	operating_system: 'Sistema Operativo',
	has_wifi: 'WiFi',
	has_bluetooth: 'Bluetooth',
	has_cd_drive: 'Lector CD/DVD',
	observations: 'Observaciones',
	extra_attributes: 'Atributos Extra',
};

/**
 * Helper para obtener el label de un campo.
 * Si no existe, retorna una versión capitalizada del key.
 */
export const getDesktopLabel = (field: string): string => {
	if (DESKTOP_LABELS[field]) {
		return DESKTOP_LABELS[field];
	}
	// Fallback: capitalize first letter
	return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
};
