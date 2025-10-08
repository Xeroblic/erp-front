import type { ProductFilters } from '@/interface/product.interface';

export const PRODUCT_DEFAULT_FILTERS: ProductFilters = {
	search: '',
	is_active: undefined,
	brand_id: undefined,
	category_id: undefined,
	product_type: undefined,
};

export const PRODUCT_STATUS_FILTER_OPTIONS = [
	{ value: '', label: 'Todos los estados' },
	{ value: 'active', label: 'Activos' },
	{ value: 'inactive', label: 'Inactivos' },
];

export const PRODUCT_TYPE_FILTER_OPTIONS = [
	{ value: '', label: 'Todos los tipos' },
	{ value: 'GENERAL', label: 'General' },
	{ value: 'NOTEBOOK', label: 'Notebook' },
	{ value: 'DESKTOP', label: 'Desktop' },
];

export const PRODUCT_STATS_META = [
	{
		key: 'total',
		label: 'Productos totales',
		icon: 'HeroCube',
	},
	{
		key: 'actives',
		label: 'Activos',
		icon: 'HeroBolt',
	},
	{
		key: 'inactives',
		label: 'Inactivos',
		icon: 'HeroPower',
	},
	{
		key: 'with_offer',
		label: 'Con oferta',
		icon: 'HeroTag',
	},
	{
		key: 'serial_tracked',
		label: 'Con serie',
		icon: 'HeroQrCode',
	},
] as const;

export const PRODUCT_TYPE_META = {
	GENERAL: {
		label: 'General',
		icon: 'HeroCubeTransparent',
		badgeColor: 'violet',
	},
	NOTEBOOK: {
		label: 'Notebook',
		icon: 'HeroComputerLaptop',
		badgeColor: 'blue',
	},
	DESKTOP: {
		label: 'Desktop',
		icon: 'HeroComputerDesktop',
		badgeColor: 'emerald',
	},
} as const;

export const PRODUCT_TOGGLES = [
	{
		key: 'serial_tracking',
		icon: 'HeroQrCode',
		title: 'Seguimiento por serie',
		description: 'Activa el control de numeros de serie.',
	},
	{
		key: 'is_active',
		icon: 'HeroAdjustmentsHorizontal',
		title: 'Producto activo',
		description: 'Controla la visibilidad del producto.',
	},
] as const;

export const PRODUCT_FORM_SECTIONS = [
	{
		key: 'general',
		icon: 'HeroIdentification',
		title: 'Informacion general',
		description: 'Define los datos base del producto.',
		cardClass: '',
	},
	{
		key: 'pricing',
		icon: 'HeroBanknotes',
		title: 'Precios y garantia',
		description: 'Configura precios, costos y garantias.',
		cardClass: '',
	},
	{
		key: 'classification',
		icon: 'HeroSquares2X2',
		title: 'Clasificacion y categorias',
		description: 'Organiza el producto dentro del catalogo.',
		cardClass: '',
	},
] as const;
