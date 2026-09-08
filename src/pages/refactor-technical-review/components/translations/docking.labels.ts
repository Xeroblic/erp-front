export const DOCKING_LABELS: Record<string, string> = {
	brand: 'Marca',
	model: 'Modelo',
	line: 'Línea',
	general_condition: 'Condición General',
	observations: 'Observaciones',
	extra_attributes: 'Atributos Extra',
	includes_power_adapter: 'Incluye Adaptador de Poder',
	vga_ports: 'Puertos VGA',
	hdmi_ports: 'Puertos HDMI',
	displayport_ports: 'Puertos DisplayPort',
	dvi_ports: 'Puertos DVI',
	usb_c_ports: 'Puertos USB-C',
	sd_readers: 'Lectores SD',
	rj45_ports: 'Puertos RJ45',
	charging_ports: 'Puertos de carga',
	usb_a_ports: 'Puertos USB-A',
	all_ports_functional: 'Todos los puertos funcionales',
	defective_ports_count: 'Puertos defectuosos',
	defective_port_types: 'Qué puertos están defectuosos',
	loose_ports_count: 'Puertos sueltos',
	loose_port_types: 'Qué puertos están sueltos',
	has_wifi: 'Tiene Wi-Fi',
	cover_condition: 'Condición de Carcasa',
	lock_area_condition: 'Estado del Candado',
};

/**
 * ZF-99. Rótulos de los cuatro estados del sector del candado, para el resumen de la
 * revisión. Las etiquetas del formulario vienen del schema del backend —que las cambia
 * según si las reglas v2 están activas—; éstas son la versión corta y estable que
 * necesita el resumen, donde no hay schema a mano.
 */
export const LOCK_AREA_CONDITION_LABELS: Record<string, string> = {
	ok: 'Sin observaciones',
	missing_key: 'Sin llave',
	worn: 'Sector con desgaste',
	locked: 'Candado puesto',
};

export const getDockingLabel = (key: string): string => {
	return DOCKING_LABELS[key] || key;
};
