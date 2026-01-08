import type { ProductFilters, ProductStatus, ProductType } from '@/interface/product.interface';

export const PRODUCT_STATUS = ['pending', 'validated', 'rejected', 'archived'] as const;

export const PRODUCT_TYPES = [
	'general',
	'desktop_pc',
	'notebook',
	'aio',
	'monitor',
	'docking',
] as const;

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
	true: 'Pendiente',
	validated: 'Validado',
	rejected: 'Rechazado',
	archived: 'Archivado',
};


export const PRODUCT_TYPE_LABELS: Record<string, string> = {
	general: 'General',
	desktop_pc: 'Desktop reacondicionado',
	notebook: 'Notebook reacondicionado',
	aio: 'AIO reacondicionado',
	monitor: 'Monitor reacondicionado',
	docking: 'Docking reacondicionada',
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
	{ value: 'active', label: 'Activos' },
	{ value: 'inactive', label: 'Inactivos' },
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
		icon: 'DuoBox', // Clásico pa' inventario
	},
	{
		key: 'actives',
		label: 'Activos',
		icon: 'DuoThunder', // Reemplazo directo del HeroBolt (energía/activo)
	},
	{
		key: 'inactives',
		label: 'Inactivos',
		icon: 'DuoShutdown', // Apagao, fuera de línea, rip
	},
	{
		key: 'with_offer',
		label: 'Con oferta',
		icon: 'DuoSale1', // Etiqueta de oferta precisa
	},
	{
		key: 'serial_tracked',
		label: 'Con serie',
		icon: 'DuoBarcode', // Escaneo de serie, cortita
	},
] as const;

export const PRODUCT_TYPE_META: Record<
	string,
	{ label: string; icon: string; badgeColor: string }
> = {
	general: {
		label: 'General',
		icon: 'HeroCube',
		badgeColor: 'gray',
	},
	desktop_pc: {
		label: 'Desktop reacondicionado',
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
	docking: {
		label: 'Docking reacondicionada',
		icon: 'HeroSquare3Stack3D',
		badgeColor: 'purple',
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
		key: 'classification',
		icon: 'HeroSquares2X2',
		title: 'Clasificacion y categorias',
		description: 'Organiza el producto dentro del catalogo.',
		cardClass: '',
	},
] as const;

export const PRODUCT_DRAFT_CATEGORY_SLUG = 'borrador';
