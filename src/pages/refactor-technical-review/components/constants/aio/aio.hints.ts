/**
 * aio.hints.ts
 * Textos de ayuda (hints) y ejemplos de placeholder para los campos del formulario de AIO.
 * Extraídos de las reglas de negocio base.
 */

export const AIO_HINTS: Record<string, string> = {
	brand: 'Fabricante del equipo (Dell, HP, Lenovo, etc.)',
	model: 'Modelo exacto del equipo para referencia y compatibilidad',
	line: 'Línea o sub-línea del producto (ej: OptiPlex, ThinkCentre, IdeaCentre)',
	general_condition: 'Estado general del equipo considerando estética y funcionamiento global',
	observations: 'Notas libres relevantes encontradas durante la revisión',
	extra_attributes: 'Contenedor para atributos específicos no estandarizados',
	ram_slots: 'Formato cantidad × módulos (total × cantidad de módulos). Ej: 8x2, 16x1',
	storage_technology: 'Tipo de unidad de almacenamiento. m.2 se normaliza a M2',
	includes_power_adapter: 'Indica si se entrega con adaptador de poder / cargador',
	charger_status: 'Condición del adaptador de poder si se incluye',
	defective_ports_count:
		'IMPORTANTE: Solo 1 puerto dañado = Máximo Grado C. Más de 1 puerto dañado = Automáticamente M',
	operating_system: 'SO instalado o recomendado',
};

export const AIO_PLACEHOLDERS: Record<string, string> = {
	brand: 'Ej: Dell, HP, Lenovo, Apple',
	model: 'Ej: OptiPlex 7470, iMac 27, IdeaCentre',
	line: 'Ej: OptiPlex, ThinkCentre, IdeaCentre',
	processor: 'Ej: Intel Core i5-10400T',
	ram_size: 'Ej: 8GB, 16GB',
	ram_slots: 'Ej: 8x1, 8x2',
	ram_type: 'Ej: DDR4 SO-DIMM',
	storage_size: 'Ej: 256GB, 512GB, 1TB',
	screen_inches: 'Ej: 23.8", 27"',
	observations: 'Ej: Teclado con dos teclas flojas, Bisagra izquierda con juego...',
	operating_system: 'Ej: Windows 11 Pro, macOS Sonoma',
};

export const AIO_WARNINGS: Record<string, string> = {
	defective_ports_count:
		'Si tiene más de 1 puerto dañado, el equipo será categoría M independientemente de todo lo demás',
};
