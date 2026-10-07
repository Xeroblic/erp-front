import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import Alert from '@/components/ui/Alert';
import Tabs, { Tab } from '@/components/ui/Tabs';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import Pages from '@/config/pages.config';
import useAjustesTraslados from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useAjustesTraslados';
import AdjustmentPanel from '@/pages/inventario/abastecimiento/AjustesTraslados/components/adjustment/AdjustmentPanel';
import TransferPanel from '@/pages/inventario/abastecimiento/AjustesTraslados/components/transfer/TransferPanel';
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
				<Tab
					id='traslado'
					text='Traslados internos'
					icon='HeroArrowsRightLeft'
					disabled={busy && activeTab !== 'traslado'}>
					{activeTab === 'traslado' && (
						<TransferPanel
							owner={owner}
							branchId={branchId}
							preselection={preselection}
							onBusyChange={setBusy}
						/>
					)}
				</Tab>
			</Tabs>
		</>
	);
};

const AjustesTrasladosView = () => {
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
	else if (access === 'disabled')
		content = (
			<Alert title='Ajustes y traslados no habilitados'>
				El ajuste por conteo y los traslados internos aún no están habilitados en este
				entorno.
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
						description='Corrige diferencias de conteo o reubica productos dentro de la sucursal activa.'
					/>
				</SubheaderLeft>
			</Subheader>
			{/* Fondo blanco en todos los campos de la página. El selector de
			    descendiente pesa más que la utilidad del componente, y `:not(:disabled)`
			    conserva el gris de los campos bloqueados. */}
			<Container className='space-y-6 [&_input:not(:disabled)]:bg-white dark:[&_input:not(:disabled)]:bg-zinc-900 [&_select:not(:disabled)]:bg-white dark:[&_select:not(:disabled)]:bg-zinc-900 [&_textarea:not(:disabled)]:bg-white dark:[&_textarea:not(:disabled)]:bg-zinc-900'>
				{INVENTORY_STOCK_USE_MOCKS && (
					<Alert color='amber' title='Datos simulados'>
						Pantalla de demostración. Los ajustes y traslados no afectan al inventario
						real.
					</Alert>
				)}
				{content}
			</Container>
		</PageWrapper>
	);
};

export default AjustesTrasladosView;
