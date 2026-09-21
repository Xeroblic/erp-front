import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Tabs, { Tab } from '@/components/ui/Tabs';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import type {
	IInventoryOverviewRow,
	IInventoryWarehouseAggregate,
} from '@/interface/inventoryOverview.interface';
import useInventario from '@/pages/inventario/Inventario/hooks/useInventario';
import useInventarioFiltros from '@/pages/inventario/Inventario/hooks/useInventarioFiltros';
import ResumenInventario from '@/pages/inventario/Inventario/components/parts/ResumenInventario';
import InventarioFiltros from '@/pages/inventario/Inventario/components/filters/InventarioFiltros';
import InventarioGeneralTable from '@/pages/inventario/Inventario/components/tables/InventarioGeneralTable';
import BodegasTable from '@/pages/inventario/Inventario/components/tables/BodegasTable';
import {
	inventarioBodegaPath,
	inventarioProductoPath,
	type TInventarioVista,
} from '@/pages/inventario/Inventario/types';

const InventarioSession = ({ branchId, owner }: { branchId: number; owner: string }) => {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const {
		filtros,
		hasFilters,
		setVista,
		setUbicacion,
		setEstado,
		setBusqueda,
		setOrden,
		paginate,
		limpiar,
	} = useInventarioFiltros();
	const data = useInventario(branchId, owner, filtros);

	const openProducto = useCallback(
		(row: IInventoryOverviewRow) =>
			navigate(inventarioProductoPath(row.product.id), {
				state: { from: `${pathname}${search}` },
			}),
		[navigate, pathname, search],
	);
	const openBodega = useCallback(
		(aggregate: IInventoryWarehouseAggregate) =>
			navigate(inventarioBodegaPath(aggregate.warehouse?.id ?? null)),
		[navigate],
	);
	const loadError = data.summaryError ?? data.warehousesError ?? data.listError;

	return (
		<>
			<ResumenInventario summary={data.summary} loading={data.summaryLoading} />
			{loadError && (
				<Alert
					color='red'
					variant='outline'
					icon='HeroExclamationTriangle'
					title='No pudimos cargar el inventario'>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<span>{loadError}</span>
						<Button size='sm' variant='outline' onClick={data.refresh}>
							Reintentar
						</Button>
					</div>
				</Alert>
			)}
			<Tabs
				activeTab={filtros.vista}
				onTabChange={(tabId) => setVista(tabId as TInventarioVista)}
				variant='pills'
				contentClassName='!mt-4'>
				<Tab id='general' text='Por producto' icon='HeroListBullet'>
					{/* Filtros y lista son dos tarjetas separadas, como en Recepciones. */}
					{filtros.vista === 'general' && (
						<div className='space-y-4'>
							<InventarioFiltros
								filtros={filtros}
								warehouses={data.warehouses}
								onBusqueda={setBusqueda}
								onUbicacion={setUbicacion}
								onEstado={setEstado}
								onLimpiar={limpiar}
							/>
							<InventarioGeneralTable
								response={data.list}
								loading={data.listLoading}
								hasError={Boolean(data.listError)}
								hasFilters={hasFilters}
								ubicacion={filtros.ubicacion}
								orden={filtros.orden}
								warehouses={data.warehouses}
								onOrden={setOrden}
								onPaginate={paginate}
								onOpen={openProducto}
							/>
						</div>
					)}
				</Tab>
				<Tab id='bodegas' text='Por bodega' icon='HeroBuildingStorefront'>
					{filtros.vista === 'bodegas' && (
						<BodegasTable
							warehouses={data.warehouses}
							loading={data.warehousesLoading}
							hasError={Boolean(data.warehousesError)}
							onOpen={openBodega}
						/>
					)}
				</Tab>
			</Tabs>
		</>
	);
};

/**
 * Inventario de la sucursal activa: una sola vista para «cuánto hay, dónde
 * está y qué pide atención» (reemplaza a Stock por ubicación). Los reportes
 * con historia y comparaciones viven en Reportes › Inventario.
 */
const InventarioView = () => {
	const navigate = useNavigate();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const { authorize, isLoading } = useAuthorization();
	const userId = useAppSelector((state) => state.auth.user?.id);
	const canRead = authorize({
		permission: 'view-product',
		branchId,
		subsidiaryId,
		scope: 'visible',
	});
	const owner = `${userId}:${subsidiaryId}:${branchId}`;

	// La sesión autorizada se monta con `key` ANTES de pintar: un cambio de
	// sucursal o de permiso no alcanza a mostrar datos del contexto anterior.
	let content;
	if (isLoading) content = <p role='status'>Comprobando acceso…</p>;
	else if (!branchId)
		content = (
			<Alert title='Selecciona una sucursal'>
				Necesitas una sucursal activa para consultar su inventario.
			</Alert>
		);
	else if (!canRead)
		content = (
			<Alert color='amber' title='Sin permiso'>
				No tienes permiso para consultar el inventario de esta sucursal.
			</Alert>
		);
	else if (!INVENTORY_STOCK_USE_MOCKS)
		content = (
			<Alert title='Consulta no habilitada'>
				La consulta de inventario aún no está habilitada en este entorno.
			</Alert>
		);
	else content = <InventarioSession key={owner} owner={owner} branchId={branchId} />;

	return (
		<PageWrapper isProtectedRoute title='Inventario'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroCube'
						title='Inventario'
						description='Cuánto hay de cada producto, dónde está y qué necesita atención'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					<PermissionGuard permission='view-reports'>
						<Button
							variant='outline'
							icon='HeroChartBar'
							onClick={() => navigate('/reportes/inventario')}>
							Ver reportes
						</Button>
					</PermissionGuard>
				</SubheaderRight>
			</Subheader>
			<Container className='space-y-4'>
				{INVENTORY_STOCK_USE_MOCKS && (
					<Alert color='amber' title='Datos simulados'>
						Consulta de demostración. Las cantidades no representan el inventario real.
					</Alert>
				)}
				{content}
			</Container>
		</PageWrapper>
	);
};

export default InventarioView;
