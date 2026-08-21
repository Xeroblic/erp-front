export const DOCKING_HINTS = {
	brand: 'Fabricante del equipo (Dell, HP, Lenovo, etc.)',
	model: 'Modelo exacto del equipo para referencia y compatibilidad',
	line: 'Línea de producto o serie (Ej: Thunderbolt Dock, Universal Dock)',
	general_condition: 'Estado general del equipo considerando estética y funcionamiento global',
	observations: 'Notas libres relevantes encontradas durante la revisión',
	defective_ports_count:
		'IMPORTANTE: Solo 1 puerto dañado = Máximo Grado C. Más de 1 puerto dañado = Automáticamente M',
	extra_attributes: 'Contenedor para atributos específicos no estandarizados',
} as const;

export const DOCKING_PLACEHOLDERS = {
	brand: 'Ej: Dell, Lenovo, HP...',
	model: 'Ej: WD19TB, ThinkPad Pro Dock...',
	line: 'Ej: Thunderbolt Dock, Universal Dock...',
	observations: 'Ej: Falta cable vulcanizado original, rayas en la carcasa superior...',
} as const;

export const DOCKING_WARNINGS = {
	defective_ports_count:
		'Si tiene más de 1 puerto dañado, el equipo será categoría M independientemente de todo lo demás',
} as const;
