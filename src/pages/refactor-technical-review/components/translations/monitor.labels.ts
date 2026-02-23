export const MONITOR_LABELS: Record<string, string> = {
	brand: 'Marca',
	model: 'Modelo',
	line: 'Línea',
	general_condition: 'Condición General',
	observations: 'Observaciones',
	extra_attributes: 'Atributos Extra',
	screen_inches: 'Pulgadas',
	screen_resolution: 'Resolución',
	is_touchscreen: 'Es Táctil',
	screen_condition: 'Condición de Pantalla',
	stand_condition: 'Condición de Base',
	frame_condition: 'Condición del Marco',
	includes_power_cable: 'Incluye Cable de Poder',
	includes_video_cable: 'Incluye Cable de Video',
	includes_stand: 'Incluye Base',
	has_usb_hub: 'Tiene USB Hub',
	vga_ports: 'Puertos VGA',
	hdmi_ports: 'Puertos HDMI',
	displayport_ports: 'Puertos DisplayPort',
	dvi_ports: 'Puertos DVI',
	usb_hub_ports: 'Puertos USB Hub',
	all_ports_functional: 'Todos los puertos funcionales',
	defective_ports_count: 'Puertos defectuosos',
	defective_ports_critical_count: 'Puertos críticos defectuosos',
};

export const getMonitorLabel = (key: string): string => {
	return MONITOR_LABELS[key] || key;
};
