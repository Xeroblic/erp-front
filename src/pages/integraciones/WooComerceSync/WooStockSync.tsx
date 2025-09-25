import { useMemo, useState } from 'react';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Tabs, { Tab } from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import Header from './components/UI/Header';
import LastSyncCard from './components/UI/LastSyncCard';
import ProductStocksTable from './components/tables/ProductStocksTable';
import SyncHistoryTable from './components/tables/SyncHistoryTable';
import SyncLogModal from './components/modals/SyncLogModal';
import { useWooConnection } from './hooks/useWooConnection';
import { useWooSync } from './hooks/useWooSync';
import { useSelection } from './hooks/useSelection';
import { MOCK_PRODUCT_STOCKS } from './mocks/mockProductStocks';
import { MOCK_SYNC_HISTORY } from './mocks/mockSyncHistory';
import { WooSyncJob } from './types/wooSync.types';

type InfoVariant = 'info' | 'success';

const INFO_STYLES: Record<InfoVariant, { container: string; title: string; text: string }> = {
	info: {
		container: 'bg-blue-50',
		title: 'text-blue-900',
		text: 'text-blue-800',
	},
	success: {
		container: 'bg-emerald-50',
		title: 'text-emerald-900',
		text: 'text-emerald-800',
	},
};

const IMPORT_INFO = [
	'Obtiene el stock actual de todos los productos en WooCommerce.',
	'Compara con el stock disponible en el ERP.',
	'Actualiza el stock local con los valores de WooCommerce.',
	'Genera un reporte de productos actualizados y errores detectados.',
];

const EXPORT_INFO = [
	'Envía el stock del ERP hacia WooCommerce.',
	'Actualiza solo los productos seleccionados.',
	'Mantiene sincronizados ambos sistemas.',
	'Genera un reporte de productos actualizados y errores detectados.',
];

function ActionInfo({ title, items, variant }: { title: string; items: string[]; variant: InfoVariant }) {
	const { container, title: titleClass, text } = INFO_STYLES[variant];

	return (
		<div className={`rounded-lg p-4 ${container}`}>
			<h4 className={`mb-2 font-medium ${titleClass}`}>{title}</h4>
			<ul className={`space-y-1 text-sm ${text}`}>
				{items.map((item) => (
					<li key={item}>- {item}</li>
				))}
			</ul>
		</div>
	);
}

const WooStockSync = () => {
	const [activeTab, setActiveTab] = useState<'import' | 'export' | 'history'>('import');
	const [logJob, setLogJob] = useState<WooSyncJob | null>(null);

	const { wooConfig } = useWooConnection();
	const { productStocks, syncHistory, lastSync, isProcessing, pull, push } = useWooSync(
		MOCK_PRODUCT_STOCKS,
		MOCK_SYNC_HISTORY,
	);

	const productIds = useMemo(() => productStocks.map((product) => product.id), [productStocks]);
	const { selected, toggleAll, toggleOne, clear } = useSelection(productIds);

	const areAllSelected = productIds.length > 0 && selected.length === productIds.length;
	const isImportTab = activeTab === 'import';
	const isExportTab = activeTab === 'export';

	const handleImportStock = async () => {
		const success = await pull();
		if (success) {
			setActiveTab('history');
		}
	};

	const handleUpdateStock = async () => {
		const success = await push(selected);
		if (success) {
			clear();
			setActiveTab('history');
		}
	};

	const handleViewLog = (job: WooSyncJob) => {
		setLogJob(job);
		setActiveTab('history');
	};

	const handleCloseLog = () => {
		setLogJob(null);
	};

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			<Header wooConfig={wooConfig} />

			{lastSync && <LastSyncCard lastSync={lastSync} onViewLog={() => handleViewLog(lastSync)} />}

			<Tabs activeTab={activeTab} onTabChange={() => setActiveTab} className='mb-6'>
				<Tab id='import' text='Importar stock (pull)'>
					<Card>
						<CardHeader>
							<CardTitle>Importar stock desde WooCommerce</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<ActionInfo title='¿Qué hace la importación?' items={IMPORT_INFO} variant='info' />
								<p className='text-sm text-gray-600'>
									Esta acción actualiza el stock local con los valores registrados en WooCommerce. Ejecuta la importación antes de habilitar la tienda cada día.
								</p>
								<div className='flex justify-end'>
									<PermissionGuard permissions={[ERP_PERMISSIONS.INVENTORY.UPDATE]}>
										<Button
											icon='HeroArrowDownTray'
											color='blue'
											isLoading={isProcessing && isImportTab}
											onClick={handleImportStock}>
											Importar stock ahora
										</Button>
									</PermissionGuard>
								</div>
							</div>
						</CardBody>
					</Card>
				</Tab>

				<Tab id='export' text='Actualizar stock (push)'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle>Actualizar stock en WooCommerce</CardTitle>
								<div className='flex items-center space-x-2'>
									<span className='text-sm text-gray-600'>{selected.length} productos seleccionados</span>
									<Button size='sm' variant='outline' onClick={toggleAll}>
										{areAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardBody>
							<div className='space-y-6'>
								<ActionInfo title='¿Qué hace la actualización?' items={EXPORT_INFO} variant='success' />
								<ProductStocksTable
									rows={productStocks}
									selectedIds={selected}
									onToggleAll={toggleAll}
									onToggleOne={toggleOne}
									disabled={isProcessing}
								/>
								<div className='flex justify-end'>
									<PermissionGuard permissions={[ERP_PERMISSIONS.INVENTORY.UPDATE]}>
										<Button
											icon='HeroArrowUpTray'
											color='emerald'
											isLoading={isProcessing && isExportTab}
											onClick={handleUpdateStock}
											isDisable={!selected.length}>
											Actualizar stock seleccionado
										</Button>
									</PermissionGuard>
								</div>
							</div>
						</CardBody>
					</Card>
				</Tab>

				<Tab id='history' text='Historial'>
					<Card>
						<CardHeader>
							<CardTitle>Historial de sincronizaciones</CardTitle>
						</CardHeader>
						<CardBody>
							<SyncHistoryTable rows={syncHistory} onViewLog={handleViewLog} />
						</CardBody>
					</Card>
				</Tab>
			</Tabs>

			<SyncLogModal isOpen={Boolean(logJob)} onClose={handleCloseLog} job={logJob} />
		</Container>
	);
};

export default WooStockSync;
