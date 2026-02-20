import { TSelectOption } from '@/components/form/SelectReact';

export const GENERAL_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'like_new', label: 'Como nuevo' },
	{ value: 'good_shape', label: 'Buen estado' },
	{ value: 'visible_wear', label: 'Desgaste visible' },
	{ value: 'needs_repair', label: 'Requiere reparación' },
	{ value: 'scrap', label: 'Solo repuestos' },
];

export const COVER_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'broken', label: 'Quebrada' },
];
