import type { SubTabConfig, ProductKind } from '../types';

export const REVIEW_TABS: SubTabConfig[] = [
	{
		id: 'json-preview',
		label: 'JSON',
		icon: 'HeroCodeBracket',
		visibleFor: ['notebook', 'desktop_pc', 'aio', 'monitor', 'docking'],
	},
	{
		id: 'basic-info',
		label: 'Identificación',
		icon: 'HeroInformationCircle',
		visibleFor: ['notebook', 'desktop_pc', 'aio', 'monitor', 'docking'],
	},
	{
		id: 'hardware',
		label: 'Hardware & Pantalla',
		icon: 'HeroCpuChip',
		visibleFor: ['notebook', 'desktop_pc', 'aio', 'monitor'],
	},
	{
		id: 'condition',
		label: 'Condición',
		icon: 'HeroSparkles',
		visibleFor: ['notebook', 'desktop_pc', 'aio', 'monitor', 'docking'],
	},
	{
		id: 'ports',
		label: 'Puertos',
		icon: 'HeroServerStack',
		visibleFor: ['notebook', 'desktop_pc', 'aio', 'monitor', 'docking'],
	},
	{
		id: 'extras',
		label: 'Extras & Notas',
		icon: 'HeroWrenchScrewdriver',
		visibleFor: ['notebook', 'desktop_pc', 'aio', 'monitor', 'docking'],
	},
];

export const getVisibleTabs = (productKind: ProductKind): SubTabConfig[] =>
	REVIEW_TABS.filter((tab) => tab.visibleFor.includes(productKind));
