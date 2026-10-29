import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import classNames from 'classnames';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import useCan from '@/hooks/useCan';
import { IntegrationsListContent } from './IntegrationsListPage';
import { WooProductsContent } from './WooProductsPage';
import { UnmappedProductsContent } from './UnmappedProductsPage';
import { SyncStockContent } from './SyncStockPage';
import { ImportOrdersContent } from './ImportOrdersPage';
import { ImportTermsContent } from './ImportTermsPage';

interface HubTab {
	id: string;
	label: string;
	icon: string;
	/** Permisos que habilitan la pestaña (OR). Vacío = sin restricción extra. */
	authority: string[];
	Content: React.FC;
}

/**
 * Hub unificado de Integraciones: agrupa las antiguas páginas sueltas
 * (Listado, Productos Sincronizados, Sin Mapear, Sincronizar Stock,
 * Importar Órdenes, Importar Categorías/Marcas) en una sola página con
 * pestañas deep-linkables (`?tab=...`). Cada pestaña reutiliza el contenido
 * de la página original (sin su `PageWrapper`), por lo que la lógica no se
 * duplica. Las rutas standalone se mantienen por compatibilidad.
 */
const TABS: HubTab[] = [
	{
		id: 'lista',
		label: 'Listado',
		icon: 'DuoBulletList',
		authority: ['view-integration'],
		Content: IntegrationsListContent,
	},
	{
		id: 'sincronizados',
		label: 'Productos Sincronizados',
		icon: 'DuoPixels',
		authority: ['view-integration'],
		Content: WooProductsContent,
	},
	{
		id: 'sin-mapear',
		label: 'Productos Sin Mapear',
		icon: 'DuoQuestionCircle',
		authority: ['unmapped-woocommerce-products.index'],
		Content: UnmappedProductsContent,
	},
	{
		id: 'sincronizar-stock',
		label: 'Sincronizar Stock',
		icon: 'DuoUpdate',
		authority: ['view-integration'],
		Content: SyncStockContent,
	},
	{
		id: 'importar-ordenes',
		label: 'Importar Órdenes',
		icon: 'DuoDownload',
		authority: ['view-integration'],
		Content: ImportOrdersContent,
	},
	{
		id: 'importar-terminos',
		label: 'Importar Categorías y Marcas',
		icon: 'DuoCloudDownload',
		authority: ['view-integration'],
		Content: ImportTermsContent,
	},
];

const IntegrationsHubPage: React.FC = () => {
	const can = useCan();
	const [searchParams, setSearchParams] = useSearchParams();

	// Sólo se muestran las pestañas cuyo permiso tiene el usuario (super-admin ve todo).
	const visibleTabs = useMemo(
		() => TABS.filter((tab) => can.isSuperAdmin || can.any(tab.authority)),
		[can],
	);

	const requestedTab = searchParams.get('tab');
	const activeTab =
		visibleTabs.find((tab) => tab.id === requestedTab)?.id ?? visibleTabs[0]?.id ?? '';

	const ActiveContent = visibleTabs.find((tab) => tab.id === activeTab)?.Content ?? null;

	const handleTabChange = (id: string) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				next.set('tab', id);
				return next;
			},
			{ replace: true },
		);
	};

	return (
		<PageWrapper name='Integraciones'>
			{/* Barra de navegación de secciones (no-sticky para no chocar con el
			    Subheader sticky propio de cada sección). */}
			<div className='border-b border-zinc-200 bg-white/60 px-4 pt-3 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40 sm:px-6'>
				<div
					className='w-full overflow-x-auto pb-1'
					style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
					<nav
						className='flex w-max flex-nowrap gap-3 px-1'
						role='tablist'
						aria-label='Secciones de integraciones'>
						{visibleTabs.map((tab) => {
							const isActive = tab.id === activeTab;
							return (
								<button
									key={tab.id}
									type='button'
									role='tab'
									aria-selected={isActive}
									onClick={() => handleTabChange(tab.id)}
									className={classNames(
										'group inline-flex min-w-max flex-none items-center justify-center gap-2 whitespace-nowrap border-b-2 px-3 pb-3 pt-2 text-sm font-medium transition-colors duration-200',
										isActive
											? 'border-blue-500 text-blue-600 dark:text-blue-400'
											: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
									)}>
									<Icon
										icon={tab.icon}
										className={classNames(
											'h-5 w-5',
											isActive
												? 'text-blue-500 dark:text-blue-400'
												: 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300',
										)}
									/>
									<span>{tab.label}</span>
								</button>
							);
						})}
					</nav>
				</div>
			</div>

			{ActiveContent ? (
				<ActiveContent />
			) : (
				<Container>
					<Card>
						<CardBody>
							<div className='py-12 text-center text-gray-500 dark:text-gray-400'>
								<Icon
									icon='HeroLockClosed'
									size='text-5xl'
									className='mx-auto mb-3'
								/>
								<p className='text-lg'>
									No tienes acceso a ninguna sección de integraciones.
								</p>
							</div>
						</CardBody>
					</Card>
				</Container>
			)}
		</PageWrapper>
	);
};

export default IntegrationsHubPage;
