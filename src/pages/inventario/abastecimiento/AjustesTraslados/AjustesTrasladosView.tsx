import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Tabs, { Tab } from '@/components/ui/Tabs';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import Pages from '@/config/pages.config';
import useAjustesTraslados from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useAjustesTraslados';
import AjustePanel from '@/pages/inventario/abastecimiento/AjustesTraslados/components/ajuste/AjustePanel';
import TrasladoPanel from '@/pages/inventario/abastecimiento/AjustesTraslados/components/traslado/TrasladoPanel';
import type { AjustesTrasladosTab } from '@/pages/inventario/abastecimiento/AjustesTraslados/types';

interface AjustesTrasladosTabsProps {
	branchId: number;
	subsidiaryId: number | null;
	owner: string;
	activeTab: AjustesTrasladosTab;
	onTabChange: (tabId: string) => void;
}

const AjustesTrasladosTabs = ({
	branchId,
	subsidiaryId,
	owner,
	activeTab,
	onTabChange,
}: AjustesTrasladosTabsProps) => {
	// Cada pestaña se monta la primera vez que se abre y queda montada: no carga
	// el stock de un flujo que no se usa, y cambiar de pestaña no descarta un
	// formulario a medias ni la clave de un reintento incierto.
	const [visited, setVisited] = useState<ReadonlySet<AjustesTrasladosTab>>(
		() => new Set([activeTab]),
	);
	if (!visited.has(activeTab)) setVisited(new Set([...visited, activeTab]));

	return (
		<>
			{/* Criterio de aceptación de la card: la pantalla no ofrece «ingresar una
			    compra» — deriva a la recepción antes de elegir ajuste o traslado. */}
			<Alert color='blue' variant='outline' icon='HeroInboxArrowDown' title='¿Es una compra?'>
				Esto no es la pantalla para ingresar mercadería comprada. Un ajuste corrige una
				diferencia de conteo con motivo auditado y un traslado mueve unidades dentro de la
				sucursal; una compra entra por su recepción, con proveedor, documento y costo.{' '}
				<Link
					className='font-semibold underline'
					to={Pages.inventory.subPages.recepciones.to}>
					Ir a Recepciones
				</Link>
				.
			</Alert>

			{/* Mismo contenedor de pestañas que el catálogo de productos: pastillas
			    dentro de una tarjeta blanca que también envuelve el contenido. */}
			<Tabs
				activeTab={activeTab}
				onTabChange={onTabChange}
				variant='pills'
				className='rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
				<Tab id='ajuste' text='Ajuste de inventario' icon='HeroScale'>
					{visited.has('ajuste') && (
						<AjustePanel
							owner={owner}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
						/>
					)}
				</Tab>
				<Tab id='traslado' text='Traslados internos' icon='HeroArrowsRightLeft'>
					{visited.has('traslado') && <TrasladoPanel owner={owner} branchId={branchId} />}
				</Tab>
			</Tabs>
		</>
	);
};

const AjustesTrasladosView = () => {
	const { access, branchId, subsidiaryId, owner, activeTab, changeTab } = useAjustesTraslados();

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
			/>
		);

	return (
		<PageWrapper isProtectedRoute title='Ajustes y traslados'>
			{/* Encabezado con el formato de `ProductsHeader` del catálogo de productos. */}
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<div className='flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800'>
							<Icon icon='HeroArrowsRightLeft' className='h-5 w-5' />
						</div>
						<div>
							<h1 className='text-2xl font-semibold'>Ajustes y traslados</h1>
							<p className='text-sm text-neutral-500 dark:text-neutral-400'>
								Corrige el stock por conteo o muévelo entre ubicaciones de la
								sucursal activa.
							</p>
						</div>
					</div>
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
