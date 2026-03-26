/**
 * notebook.hints.ts
 * Textos de ayuda (hints) y ejemplos de placeholder para los campos del formulario de Notebook.
 * Los hints de campos críticos incluyen advertencias de reglas de negocio.
 */

export const NOTEBOOK_HINTS: Record<string, string> = {
	brand: 'Fabricante del equipo (Dell, HP, Lenovo, etc.)',
	model: 'Modelo exacto del equipo para referencia y compatibilidad',
	line: 'Línea o sub-línea del producto (ej: Inspiron, ThinkPad, ProBook)',
	general_condition: 'Estado general del equipo considerando estética y funcionamiento global',
	observations: 'Notas libres relevantes encontradas durante la revisión',
	extra_attributes: 'Contenedor para atributos específicos no estandarizados',
	processor: 'Modelo de CPU (ej: Intel i5-8250U, Ryzen 5 3500U)',
	ram_size: 'Capacidad total de memoria RAM',
	ram_slots: 'Formato cantidad × módulos (total × cantidad de módulos). Ej: 8x2, 16x1',
	ram_type: 'Tecnología de RAM soportada',
	storage_size: 'Capacidad de almacenamiento principal',
	storage_technology: 'Tipo de unidad de almacenamiento. M.2 se normaliza automáticamente a M2',
	includes_charger: 'Indica si se entrega con cargador',
	charger_watts: 'Potencia del cargador recomendado',
	charger_status: 'Condición del cargador si se incluye',
	screen_inches: 'Tamaño de la pantalla en pulgadas',
	screen_condition: 'Estado físico/visual del panel',
	cover_condition: 'Estado de la cubierta/tapa superior del equipo',
	keyboard_condition:
		'⚠️ Máximo 1 tecla dañada o faltante para Grado C. Más de 1 tecla dañada = Grado M automáticamente',
	keyboard_layout: 'Layout físico del teclado. Se normaliza a minúsculas automáticamente',
	hinge_condition: 'Estado de las bisagras de apertura/cierre',
	battery_health: 'Texto o porcentaje informado por el sistema (si aplica)',
	battery_status: 'Puedes ingresar porcentaje (0-100) o categoría; se normaliza a ambos',
	battery_percentage: 'Se llena automáticamente si envías battery_status como porcentaje',
	vga_ports: 'Cantidad de puertos VGA funcionales',
	hdmi_ports: 'Cantidad de puertos HDMI funcionales',
	displayport_ports: 'Cantidad de puertos DisplayPort funcionales',
	usb_c_ports: 'Cantidad de puertos USB-C funcionales',
	usb_a_ports: 'Cantidad de puertos USB-A funcionales',
	sd_readers: 'Cantidad de lectores de tarjeta SD',
	rj45_ports: 'Cantidad de puertos de red RJ45',
	all_ports_functional: 'Marca si todos los puertos probados funcionan correctamente',
	defective_ports_count:
		'⚠️ Solo 1 puerto dañado = Máximo Grado C. Más de 1 puerto dañado = Grado M automáticamente',
	has_biometric: 'Incluye lector de huellas o cámara IR',
	has_wifi: 'Conectividad WiFi disponible',
	has_bluetooth: 'Conectividad Bluetooth disponible',
	is_touchscreen: 'La pantalla soporta entrada táctil',
	touchpad_condition: 'Estado del touchpad/trackpad',
	bottom_condition: 'Estado de la tapa inferior del equipo',
	has_numeric_keypad: 'Incluye teclado numérico lateral',
	has_backlit_keyboard: 'El teclado tiene retroiluminación',
	operating_system: 'Sistema operativo instalado o recomendado',
};

export const NOTEBOOK_PLACEHOLDERS: Record<string, string> = {
	brand: 'Ej: Dell, HP, Lenovo',
	model: 'Ej: Latitude 5420, EliteBook 840',
	line: 'Ej: Inspiron, ThinkPad, ProBook',
	processor: 'Ej: Intel Core i5-8250U',
	ram_size: 'Ej: 8GB, 16GB',
	ram_slots: 'Ej: 8x2, 16x1',
	ram_type: 'Ej: DDR4, DDR5',
	storage_size: 'Ej: 256GB, 512GB, 1TB',
	charger_watts: 'Ej: 45W, 65W, 90W',
	screen_inches: 'Ej: 14", 15.6"',
	battery_health: 'Ej: 85%, Normal, Service',
	battery_percentage: 'Ej: 85',
	observations: 'Ej: Teclado con dos teclas flojas, bisagra izquierda con juego...',
	operating_system: 'Ej: Windows 10 Pro',
};

/**
 * Advertencias de reglas de negocio críticas.
 * Se muestran como alertas destacadas en el formulario.
 */
export const NOTEBOOK_WARNINGS: Record<string, string> = {
	defective_ports_count:
		'Si tiene más de 1 puerto dañado, el equipo será categoría M independientemente de todo lo demás.',
	keyboard_condition:
		'Máximo 1 tecla dañada o faltante para Grado C. Más de 1 tecla dañada = Grado M (Malo).',
	screen_condition:
		'Manchas (Spots) limitan a Grado C. Píxeles muertos limitan a Grado B. Pantalla rota = Grado M.',
	cover_condition: 'Piezas faltantes en la tapa limitan el grado máximo a C.',
};
