import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import Alert from '@/components/ui/Alert';
import Tabs, { Tab } from '@/components/ui/Tabs';
import INVENTORY_ADJUSTMENTS_USE_MOCKS from '@/config/inventoryAdjustments.config';
import INVENTORY_MULTI_LOCATION_ENABLED from '@/config/inventoryMultiLocation.config';
import INVENTORY_TRANSFERS_USE_MOCKS from '@/config/inventoryTransfers.config';
import Pages from '@/config/pages.config';
import useAjustesTraslados from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useAjustesTraslados';
import AdjustmentPanel from '@/pages/inventario/abastecimiento/AjustesTraslados/components/adjustment/AdjustmentPanel';
import TransferTab from '@/pages/inventario/abastecimiento/AjustesTraslados/components/transfer/TransferTab';
import type {
	AjustesTrasladosTab,
	IAjustesTrasladosPreselection,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/types';

interface AjustesTrasladosTabsProps {
	branchId: number;
	subsidiaryId: number | null;
	owner: string;
	activeTab: AjustesTrasladosTab;
	onTabChange: (tabId: string) => void;
	preselection: IAjustesTrasladosPreselection;
}

const AjustesTrasladosTabs = ({
	branchId,
	subsidiaryId,
	owner,
	activeTab,
	onTabChange,
	preselection,
}: AjustesTrasladosTabsProps) => {
	// Sólo la pestaña activa está montada: cambiar de pestaña reinicia el
	// asistente de la otra. Mientras una escritura está en curso o espera
	// reintento, la otra pestaña se bloquea: desmontar el formulario descartaría
	// la clave de idempotencia y un reintento podría duplicar el movimiento.
	const [busy, setBusy] = useState(false);

	return (
		<>
			{/* La pantalla no ofrece «ingresar una compra»: deriva a la recepción. */}
			<Alert
				color='blue'
				variant='outline'
				icon='HeroInformationCircle'
				title='Otros movimientos de stock'>
				<ul className='list-disc space-y-0.5 pl-5'>
					<li>
						Mercadería comprada: se ingresa en{' '}
						<Link
							className='font-semibold underline'
							to={Pages.inventory.subPages.recepciones.to}>
							Recepciones
						</Link>
						, con proveedor, documento y costo.
					</li>
					<li>Envíos a otra sucursal: se gestionan en Transferencias.</li>
				</ul>
			</Alert>

			{/* Etapa 1: el backend rechaza traslados y ajustes con bodega (409). */}
			{!INVENTORY_MULTI_LOCATION_ENABLED && (
				<Alert
					color='amber'
					variant='outline'
					icon='HeroMapPin'
					title='La sucursal opera con una sola ubicación'>
					Todo el stock está en «Sin ubicación», que es de donde salen las ventas. Los
					ajustes se registran ahí y los traslados entre bodegas todavía no están
					disponibles.
				</Alert>
			)}

			{/* Mismo contenedor de pestañas que el catálogo de productos: pastillas
			    dentro de una tarjeta blanca que también envuelve el contenido. */}
			<Tabs
				activeTab={activeTab}
				onTabChange={onTabChange}
				variant='pills'
				className='rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
				<Tab
					id='ajuste'
					text='Ajuste de inventario'
					icon='HeroScale'
					disabled={busy && activeTab !== 'ajuste'}>
					{activeTab === 'ajuste' && (
						<AdjustmentPanel
							owner={owner}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							preselection={preselection}
							onBusyChange={setBusy}
						/>
					)}
				</Tab>
				{INVENTORY_MULTI_LOCATION_ENABLED && (
					<Tab
						id='traslado'
						text='Traslados internos'
						icon='HeroArrowsRightLeft'
						disabled={busy && activeTab !== 'traslado'}>
						{activeTab === 'traslado' && (
							<TransferTab
								owner={owner}
								branchId={branchId}
								preselection={preselection}
								onBusyChange={setBusy}
							/>
						)}
					</Tab>
				)}
			</Tabs>
		</>
	);
};

/** Aviso de datos simulados según qué flujo usa el mock; `null` si ambos escriben en el backend. */
const mockNoticeFor = (
	adjustmentMock: boolean,
	transferMock: boolean,
	transfersVisible: boolean,
): string | null => {
	// Sin la pestaña de traslados, su bandera no tiene nada que avisar.
	if (!transfersVisible)
		return adjustmentMock
			? 'El ajuste usa datos simulados: no afecta al inventario real.'
			: null;
	if (adjustmentMock && transferMock)
		return 'Pantalla de demostración. Los ajustes y traslados no afectan al inventario real.';
	if (transferMock) return 'Los traslados usan datos simulados. El ajuste escribe en el backend.';
	if (adjustmentMock)
		return 'El ajuste usa datos simulados. Los traslados escriben en el backend.';
	return null;
};

const AjustesTrasladosView = () => {
	const mockNotice = mockNoticeFor(
		INVENTORY_ADJUSTMENTS_USE_MOCKS,
		INVENTORY_TRANSFERS_USE_MOCKS,
		INVENTORY_MULTI_LOCATION_ENABLED,
	);
	const { access, branchId, subsidiaryId, owner, activeTab, changeTab, preselection } =
		useAjustesTraslados();

	let content;
	if (access === 'loading') content = <p role='status'>Comprobando acceso…</p>;
	else if (access === 'no-branch' || !branchId)
		content = (
			<Alert title='Selecciona una sucursal'>
				Necesitas una sucursal activa para ajustar o mover su stock.
			</Alert>
		);
	else if (access === 'forbidden')
		content = (
			<Alert color='amber' title='Sin permiso'>
				No tienes permiso para ajustar ni mover el stock de esta sucursal.
			</Alert>
		);
	// La sesión autorizada se monta con `key` ANTES de renderizar: un cambio de
	// usuario, filial o sucursal desmonta ambos formularios en vez de dejar que
	// pinten líneas y saldos de un contexto que ya no es el activo.
	else
		content = (
			<AjustesTrasladosTabs
				key={owner}
				owner={owner}
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				activeTab={activeTab}
				onTabChange={changeTab}
				preselection={preselection}
			/>
		);

	return (
		<PageWrapper isProtectedRoute title='Ajustes y traslados'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroArrowsRightLeft'
						title='Ajustes y traslados'
						description={
							INVENTORY_MULTI_LOCATION_ENABLED
								? 'Corrige diferencias de conteo o reubica productos dentro de la sucursal activa.'
								: 'Corrige diferencias de conteo en la sucursal activa.'
						}
					/>
				</SubheaderLeft>
			</Subheader>
			{/* Fondo blanco en todos los campos de la página. El selector de
			    descendiente pesa más que la utilidad del componente, y `:not(:disabled)`
			    conserva el gris de los campos bloqueados. */}
			<Container className='space-y-6 [&_input:not(:disabled)]:bg-white dark:[&_input:not(:disabled)]:bg-zinc-900 [&_select:not(:disabled)]:bg-white dark:[&_select:not(:disabled)]:bg-zinc-900 [&_textarea:not(:disabled)]:bg-white dark:[&_textarea:not(:disabled)]:bg-zinc-900'>
				{mockNotice && (
					<Alert color='amber' title='Datos simulados'>
						{mockNotice}
					</Alert>
				)}
				{content}
			</Container>
		</PageWrapper>
	);
};

export default AjustesTrasladosView;
