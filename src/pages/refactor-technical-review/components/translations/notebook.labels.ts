/**
 * notebook.labels.ts
 * Traducciones al español de todos los campos del formulario de Notebook.
 * Etiquetas capitalizadas según convención del sistema.
 */

import { HINGE_CONDITION_OPTIONS } from '../constants/notebook/notebook.options';

export const NOTEBOOK_LABELS: Record<string, string> = {
	// ─── Identificación ────────────────────────────────────────────────────────
	brand: 'Marca',
	model: 'Modelo',
	line: 'Línea',

	// ─── Condición ─────────────────────────────────────────────────────────────
	general_condition: 'Condición General',

	// ─── Hardware ──────────────────────────────────────────────────────────────
	processor: 'Procesador',
	ram_size: 'RAM',
	ram_slots: 'Slots RAM',
	ram_type: 'Tipo De RAM',
	storage_size: 'Almacenamiento',
	storage_technology: 'Tecnología De Disco',

	// ─── Pantalla ──────────────────────────────────────────────────────────────
	screen_inches: 'Pulgadas Pantalla',
	screen_condition: 'Condición De Pantalla',
	is_touchscreen: 'Pantalla Táctil',

	// ─── Carcasa ───────────────────────────────────────────────────────────────
	cover_condition: 'Tapa Superior',
	keyboard_condition: 'Teclado',
	keyboard_cover_condition: 'Cubierta Del Teclado',
	keyboard_layout: 'Distribución Teclado',
	hinge_condition: 'Bisagras',
	touchpad_condition: 'Touchpad',
	bottom_condition: 'Tapa Inferior',
	has_numeric_keypad: 'Teclado Numérico',
	has_backlit_keyboard: 'Teclado Retroiluminado',

	// ─── Batería ───────────────────────────────────────────────────────────────
	battery_health: 'Health Batería',
	battery_status: 'Estado Batería',
	battery_percentage: 'Porcentaje Batería',
	has_second_battery: 'Segunda Batería',
	second_battery_status: 'Estado 2ª Batería',
	second_battery_percentage: 'Porcentaje 2ª Batería',
	second_battery_condition: 'Condición 2ª Batería',

	// ─── Puertos ───────────────────────────────────────────────────────────────
	vga_ports: 'Puertos VGA',
	hdmi_ports: 'Puertos HDMI',
	displayport_ports: 'Puertos DisplayPort',
	dvi_ports: 'Puertos DVI',
	usb_c_ports: 'Puertos USB-C',
	usb_a_ports: 'Puertos USB-A',
	sd_readers: 'Lectores SD',
	rj45_ports: 'Puertos RJ45',
	charging_ports: 'Puertos de carga',
	all_ports_functional: 'Todos Los Puertos Funcionales',
	defective_ports_count: 'Puertos Defectuosos',
	defective_port_types: 'Qué Puertos Están Defectuosos',
	loose_ports_count: 'Puertos Sueltos',
	loose_port_types: 'Qué Puertos Están Sueltos',

	// ─── Accesorios ────────────────────────────────────────────────────────────
	includes_charger: 'Incluye Cargador',
	charger_watts: 'Watts Cargador',
	charger_status: 'Estado Cargador',

	// ─── Software ──────────────────────────────────────────────────────────────
	operating_system: 'Sistema Operativo',

	// ─── Otros ─────────────────────────────────────────────────────────────────
	has_biometric: 'Biométrico',
	has_wifi: 'WiFi',
	has_bluetooth: 'Bluetooth',

	// ─── Notas ─────────────────────────────────────────────────────────────────
	observations: 'Observaciones',

	// ─── Extras ────────────────────────────────────────────────────────────────
	extra_attributes: 'Atributos Extra',
};

/**
 * Obtiene la etiqueta en español de un campo.
 * Si no existe traducción, devuelve el nombre del campo formateado.
 */
export const getNotebookLabel = (field: string): string => {
	return (
		NOTEBOOK_LABELS[field] ?? field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
	);
};

// ─── Traducciones de valores de opciones ──────────────────────────────────────

export const GENERAL_CONDITION_LABELS: Record<string, string> = {
	like_new: 'Como Nuevo',
	good_shape: 'Buen Estado',
	visible_wear: 'Desgaste Visible',
	needs_repair: 'Requiere Reparación',
	scrap: 'Solo Repuestos',
};

export const STORAGE_TECHNOLOGY_LABELS: Record<string, string> = {
	HDD: 'Disco Duro (HDD)',
	SSD: 'Unidad Sólida (SSD)',
	M2: 'M.2',
	NVME: 'NVMe',
	HYBRID: 'Híbrido',
};

export const CHARGER_STATUS_LABELS: Record<string, string> = {
	buen_estado: 'Buen Estado',
	cable_en_mal_estado: 'Cable En Mal Estado',
	no_corresponde_a_equipo: 'No Corresponde Al Equipo',
	no_incluye: 'No Incluye',
	broken_charger: 'Cargador Roto',
	broken_port: 'Entrada Rota',
};

export const SCREEN_CONDITION_LABELS: Record<string, string> = {
	ok: 'Sin Observaciones',
	minor_wear: 'Detalles Leves',
	worn: 'Con Líneas / Desgaste Visible',
	spots: 'Manchas (Spots)',
	dead_pixels: 'Píxeles Muertos',
	broken: 'Rota / Daño Severo',
};

export const COVER_CONDITION_LABELS: Record<string, string> = {
	ok: 'Sin Daños',
	minor_wear: 'Daños Leves',
	worn: 'Desgaste Visible',
	missing_pieces: 'Con Piezas Faltantes',
	scratched: 'Rayada',
	broken: 'Rota',
};

export const KEYBOARD_CONDITION_LABELS: Record<string, string> = {
	ok: 'Funciona Sin Problemas',
	worn: 'Desgaste Visible',
	missing_pieces: 'Con Piezas Faltantes',
	broken: 'Roto',
};

export const KEYBOARD_LAYOUT_LABELS: Record<string, string> = {
	es: 'Español (ES)',
	us: 'Inglés (US)',
	latam: 'Latinoamericano',
};

/**
 * Se deriva de las opciones que el técnico ve en la tarjeta, no se escribe aparte: el
 * contrato de bisagras cambió a `ok, worn, cracked, loose, broken` y este mapa quedó en el
 * anterior, así que «Trizada» y «Suelta» salían en crudo en el resumen y `worn`/`broken`
 * se leían distinto según dónde se mirara.
 */
export const HINGE_CONDITION_LABELS: Record<string, string> = Object.fromEntries(
	HINGE_CONDITION_OPTIONS.map(({ value, label }) => [value, label]),
);

/**
 * La cubierta del teclado sí escribe sus rótulos: sus opciones anuncian el techo de grado
 * («Trizada — Máximo Grado B»), que es información para elegir, no para leer en el resumen.
 */
export const KEYBOARD_COVER_CONDITION_LABELS: Record<string, string> = {
	ok: 'Sin Daños',
	worn: 'Con Desgaste',
	cracked: 'Trizada',
	broken: 'Rota',
};

export const BATTERY_STATUS_LABELS: Record<string, string> = {
	excellent: 'Excelente',
	good: 'Bueno',
	fair: 'Aceptable',
	poor: 'Pobre',
	no_battery: 'Sin Batería',
};

export const TOUCHPAD_CONDITION_LABELS: Record<string, string> = {
	ok: 'Funciona Sin Problemas',
	worn: 'Desgastado',
	missing_pieces: 'Faltan Piezas',
	broken: 'Roto',
};

export const BOTTOM_CONDITION_LABELS: Record<string, string> = {
	ok: 'Sin Problemas',
	worn: 'Desgastado',
	missing_pieces: 'Faltan Piezas',
	scratched: 'Rayado',
	broken: 'Roto',
};
