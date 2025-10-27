import type { ProductFilters, ProductStatus, ProductType } from '@/interface/product.interface';

export const PRODUCT_STATUS = ['pending', 'validated', 'archived'] as const;

export const PRODUCT_TYPES = [
	'desktop_pc',
	'notebook',
	'aio',
	'monitor',
] as const;

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
	pending: 'Pendiente',
	validated: 'Validado',
	archived: 'Archivado',
};

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
	desktop_pc: 'Computador reacondicionado',
	notebook: 'Notebook reacondicionado',
	aio: 'AIO reacondicionado',
	monitor: 'Monitor reacondicionado',
};

export const PRODUCT_DEFAULT_FILTERS: ProductFilters = {
	search: '',
	is_active: undefined,
	product_status: undefined,
	brand_id: undefined,
	category_id: undefined,
	product_type: undefined,
};

export const PRODUCT_STATUS_FILTER_OPTIONS = [
	{ value: '', label: 'Todos los estados' },
	...PRODUCT_STATUS.map((status) => ({
		value: status,
		label: PRODUCT_STATUS_LABELS[status] ?? status,
	})),
];

export const PRODUCT_TYPE_FILTER_OPTIONS = [
	{ value: '', label: 'Todos los tipos' },
	...PRODUCT_TYPES.map((type) => ({
		value: type,
		label: PRODUCT_TYPE_LABELS[type] ?? type,
	})),
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

export const PRODUCT_TYPE_META: Record<string, { label: string; icon: string; badgeColor: string }> = {
	desktop_pc: {
		label: 'Computador reacondicionado',
		icon: 'HeroComputerDesktop',
		badgeColor: 'emerald',
	},
	notebook: {
		label: 'Notebook reacondicionado',
		icon: 'HeroComputerDesktop',
		badgeColor: 'blue',
	},
	aio: {
		label: 'AIO reacondicionado',
		icon: 'HeroDeviceTablet',
		badgeColor: 'amber',
	},
	monitor: {
		label: 'Monitor reacondicionado',
		icon: 'HeroPresentationChartLine',
		badgeColor: 'cyan',
	},
};

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

export const PRODUCT_DRAFT_CATEGORY_SLUG = 'borrador';
