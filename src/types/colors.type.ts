// shades “estándar” de Tailwind
export type TShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export type TColorFlat = 'inherit' | 'current' | 'transparent' | 'black' | 'white';

// paletas Tailwind completas
export type TColors =
	| 'slate'
	| 'gray'
	| 'zinc'
	| 'neutral'
	| 'stone'
	| 'red'
	| 'orange'
	| 'amber'
	| 'yellow'
	| 'lime'
	| 'green'
	| 'emerald'
	| 'teal'
	| 'cyan'
	| 'sky'
	| 'blue'
	| 'indigo'
	| 'violet'
	| 'purple'
	| 'fuchsia'
	| 'pink'
	| 'rose';

// si usas marca personalizada (primary), la tipificamos aparte
export type TBrandColors = 'primary';

export type TAllColors = TColorFlat | TColors | TBrandColors;

export const arrShades: TShade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const arrColorFlat: TColorFlat[] = ['inherit', 'current', 'transparent', 'black', 'white'];

export const arrColors: TColors[] = [
	'slate',
	'gray',
	'zinc',
	'neutral',
	'stone',
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
];

export const arrBrandColors: TBrandColors[] = ['primary'];

export const arrAllColors: TAllColors[] = [...arrColorFlat, ...arrColors, ...arrBrandColors];

// opcional: helper para generar “bg-<color>-<shade>”
export const makeColorClass = (
	prefix: 'bg' | 'text' | 'border' | 'fill',
	color: TColors | TBrandColors,
	shade: TShade,
) => `${prefix}-${color}-${shade}`;
