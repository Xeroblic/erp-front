import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import type { IInventoryOverviewRow } from '@/interface/inventoryOverview.interface';
import useInventario from '@/pages/inventario/Inventario/hooks/useInventario';
import useInventarioFiltros from '@/pages/inventario/Inventario/hooks/useInventarioFiltros';
import InventarioFiltros from '@/pages/inventario/Inventario/components/filters/InventarioFiltros';
import BodegaProductosTable from '@/pages/inventario/Inventario/InventarioBodega/components/BodegaProductosTable';
import ResumenBodega from '@/pages/inventario/Inventario/InventarioBodega/components/ResumenBodega';
import { UNLOCATED_WAREHOUSE_LABEL } from '@/components/procurement';
import {
	INVENTARIO_PATH,
	inventarioProductoPath,
	parseBodegaParam,
	ubicacionFromWarehouseId,
	type TInventarioUbicacion,
} from '@/pages/inventario/Inventario/types';

const BodegaSession = ({
	branchId,
	owner,
	ubicacion,
}: {
	branchId: number;
	owner: string;
	ubicacion: TInventarioUbicacion;
}) => {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const { filtros, hasFilters, setEstado, setBusqueda, setOrden, paginate, limpiar } =
		useInventarioFiltros();
	// La ubicación sale de la ruta, no de la URL de filtros: esta ficha es de una sola bodega.
	const filtrosBodega = useMemo(
		() => ({ ...filtros, vista: 'general' as const, ubicacion }),
		[filtros, ubicacion],
	);
	const data = useInventario(branchId, owner, filtrosBodega, { withSummary: false });
	const aggregate =
		data.warehouses.find(
			(item) => ubicacionFromWarehouseId(item.warehouse?.id ?? null) === ubicacion,
		) ?? null;

	const openProducto = useCallback(
		(row: IInventoryOverviewRow) =>
			navigate(inventarioProductoPath(row.product.id), {
				state: { from: `${pathname}${search}` },
			}),
		[navigate, pathname, search],
	);

	if (data.warehousesLoading) return <p role='status'>Cargando bodega…</p>;
	if (data.warehousesError)
		return (
			<Alert color='red' variant='outline' title='No pudimos cargar la bodega'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<span>{data.warehousesError}</span>
					<Button size='sm' variant='outline' onClick={data.refresh}>
						Reintentar
					</Button>
				</div>
			</Alert>
		);
	if (!aggregate)
		return (
			<Alert title={ubicacion === 'unlocated' ? 'Todo está ubicado' : 'Bodega no encontrada'}>
				{ubicacion === 'unlocated'
					? 'No hay unidades sin bodega asignada en esta sucursal.'
					: 'La bodega del enlace no pertenece a la sucursal activa o ya no está activa.'}
			</Alert>
		);

	return (
		<>
			<ResumenBodega aggregate={aggregate} />
			<InventarioFiltros
				filtros={filtros}
				warehouses={data.warehouses}
				showUbicacion={false}
				onBusqueda={setBusqueda}
				onUbicacion={() => undefined}
				onEstado={setEstado}
				onLimpiar={limpiar}
			/>
			<BodegaProductosTable
				title={`Productos en ${aggregate.warehouse?.name ?? UNLOCATED_WAREHOUSE_LABEL}`}
				response={data.list}
				loading={data.listLoading}
				hasError={Boolean(data.listError)}
				hasFilters={hasFilters}
				orden={filtros.orden}
				onOrden={setOrden}
				onPaginate={paginate}
				onOpen={openProducto}
			/>
		</>
	);
};

/**
 * Ficha de inventario de una bodega (o de «Sin ubicación»): cuánto guarda y
 * qué productos tiene. Cada fila despliega el detalle del producto en esta
 * bodega. Se abre desde «Ver» en la vista Por bodega.
 */
const InventarioBodegaView = () => {
	const navigate = useNavigate();
	const { bodegaId } = useParams();
	const ubicacion = parseBodegaParam(bodegaId);
	const { branchId, subsidiaryId } = useCurrentBranch();
	const { authorize, isLoading } = useAuthorization();
	const userId = useAppSelector((state) => state.auth.user?.id);
	const canRead = authorize({
		permission: 'view-product',
		branchId,
		subsidiaryId,
		scope: 'visible',
	});
	const owner = `${userId}:${subsidiaryId}:${branchId}:inventario-bodega:${bodegaId}`;

	let content;
	if (isLoading) content = <p role='status'>Comprobando acceso…</p>;
	else if (!ubicacion)
		content = <Alert title='Bodega inválida'>El enlace no apunta a una bodega válida.</Alert>;
	else if (!branchId)
		content = (
			<Alert title='Selecciona una sucursal'>
				Necesitas una sucursal activa para consultar esta bodega.
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
	else
		content = (
			<BodegaSession key={owner} owner={owner} branchId={branchId} ubicacion={ubicacion} />
		);

	return (
		<PageWrapper isProtectedRoute title='Inventario de bodega'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroBuildingStorefront'
						title='Inventario de bodega'
						description='Qué productos guarda esta ubicación y en qué estado están'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='outline'
						icon='HeroArrowLeft'
						onClick={() => navigate(`${INVENTARIO_PATH}?vista=bodegas`)}>
						Volver a bodegas
					</Button>
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

export default InventarioBodegaView;
