import { TSelectOption } from '@/components/form/SelectReact';

export const GENERAL_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'like_new', label: 'Como nuevo' },
	{ value: 'good_shape', label: 'Buen estado' },
	{ value: 'visible_wear', label: 'Desgaste visible' },
	{ value: 'needs_repair', label: 'Requiere reparación' },
	{ value: 'scrap', label: 'Solo repuestos' },
];

export const SCREEN_RESOLUTION_OPTIONS: TSelectOption[] = [
	{ value: '1366x768', label: '1366x768 (HD)' },
	{ value: '1600x900', label: '1600x900 (HD+)' },
	{ value: '1920x1080', label: '1920x1080 (Full HD)' },
	{ value: '1920x1200', label: '1920x1200 (WUXGA)' },
	{ value: '2560x1080', label: '2560x1080 (UW-FHD)' },
	{ value: '2560x1440', label: '2560x1440 (QHD)' },
	{ value: '3440x1440', label: '3440x1440 (UW-QHD)' },
	{ value: '3840x2160', label: '3840x2160 (4K UHD)' },
];

export const SCREEN_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'minor_wear', label: 'Desgaste Leve' },
	{ value: 'worn', label: 'Rayas/manchas leves' },
	{ value: 'dead_pixels', label: 'Píxeles muertos' },
	{ value: 'broken', label: 'Quebrada/Trizada' },
	{ value: 'spots', label: 'Manchas' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'lines', label: 'Líneas en pantalla' },

];

export const STAND_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'broken', label: 'Rota' },
	{ value: 'no_stand', label: 'Sin Base' },
];

export const FRAME_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];
