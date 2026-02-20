const DOCKING_LABELS: Record<string, string> = {
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
	usb_c_ports: 'Puertos USB-C',
	sd_readers: 'Lectores SD',
	rj45_ports: 'Puertos RJ45',
	usb_a_ports: 'Puertos USB-A',
	all_ports_functional: 'Todos los puertos funcionales',
	defective_ports_count: 'Puertos defectuosos',
	has_wifi: 'Tiene Wi-Fi',
	cover_condition: 'Condición de Carcasa',
};

export const getDockingLabel = (key: string): string => {
	return DOCKING_LABELS[key] || key;
};
