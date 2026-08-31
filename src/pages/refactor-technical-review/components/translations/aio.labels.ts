/**
 * aio.labels.ts
 * Mapeo oficial (Español) de las claves de AIO a nombre visible en UI.
 */
export const AIO_LABELS: Record<string, string> = {
	brand: 'Marca',
	model: 'Modelo',
	general_condition: 'Condición general',
	observations: 'Observaciones',
	extra_attributes: 'Atributos extra',
	processor: 'Procesador',
	ram_size: 'RAM',
	ram_slots: 'Slots RAM',
	ram_type: 'Tipo de RAM',
	storage_size: 'Almacenamiento',
	storage_technology: 'Tecnología de disco',
	includes_power_adapter: 'Incluye adaptador de poder',
	charger_status: 'Estado cargador',
	vga_ports: 'Puertos VGA',
	hdmi_ports: 'Puertos HDMI',
	displayport_ports: 'Puertos DisplayPort',
	usb_a_ports: 'Puertos USB-A',
	usb_c_ports: 'Puertos USB-C',
	sd_readers: 'Lectores SD',
	rj45_ports: 'Puertos RJ45',
	all_ports_functional: 'Todos los puertos funcionales',
	defective_ports_count: 'Puertos defectuosos',
	has_wifi: 'WiFi',
	has_bluetooth: 'Bluetooth',
	has_cd_drive: 'Unidad óptica',
	screen_inches: 'Pulgadas pantalla',
	screen_condition: 'Condición de pantalla',
	dead_pixels_count: 'Cantidad de píxeles muertos',
	stand_condition: 'Condición de base',
	is_touchscreen: 'Pantalla táctil',
	cover_condition: 'Carcasa',
	operating_system: 'Sistema operativo',
};

/**
 * Retorna el label exacto o un fallback genérico.
 */
export const getAioLabel = (key: string): string => AIO_LABELS[key] || key;
