export const MONITOR_HINTS = {
	brand: 'Fabricante del equipo (Dell, HP, Lenovo, etc.)',
	model: 'Modelo exacto del equipo para referencia y compatibilidad',
	line: 'Línea de producto o serie (Ej: UltraSharp, ThinkVision, Odyssey)',
	general_condition: 'Estado general del equipo considerando estética y funcionamiento global',
	observations: 'Notas libres relevantes encontradas durante la revisión',
	defective_ports_count:
		'IMPORTANTE: Solo 1 puerto dañado = Máximo Grado C. Más de 1 puerto dañado = Automáticamente M',
	defective_ports_critical_count:
		'Puertos críticos como HDMI/DisplayPort. 1 puerto crítico dañado = Máximo C. Más de 1 = Automáticamente M',
	extra_attributes: 'Contenedor para atributos específicos no estandarizados',
} as const;

export const MONITOR_PLACEHOLDERS = {
	brand: 'Ej: Dell, Lenovo, HP...',
	model: 'Ej: U2720Q, P2419H...',
	line: 'Ej: UltraSharp, ThinkVision...',
	observations: 'Ej: Botón menú hundido...',
	screen_inches: 'Ej: 24, 27...',
	screen_resolution: 'Ej: 1920x1080...',
} as const;

export const MONITOR_WARNINGS = {
	defective_ports_count:
		'Si tiene más de 1 puerto dañado, el equipo será categoría M independientemente de todo lo demás',
	defective_ports_critical_count: 'Registrar solo puertos esenciales para operaciones estándar',
} as const;
