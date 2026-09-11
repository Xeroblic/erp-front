import { useNavigate } from 'react-router-dom';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import type { IInventoryStockRow } from '@/interface/procurement.interface';
import useStockPorUbicacion from '@/pages/inventario/abastecimiento/StockPorUbicacion/hooks/useStockPorUbicacion';
import StockPorUbicacionFilters from '@/pages/inventario/abastecimiento/StockPorUbicacion/components/filters/StockPorUbicacionFilters';
import StockPorUbicacionTable from '@/pages/inventario/abastecimiento/StockPorUbicacion/components/tables/StockPorUbicacionTable';

const StockSession = ({ branchId, owner }: { branchId: number; owner: string }) => {
	const navigate = useNavigate();
	const {
		search,
		location,
		setFilter,
		clearFilters,
		response,
		error,
		loading,
		paginate,
		refresh,
		warehouses,
	} = useStockPorUbicacion(branchId, owner);

	const hasFilters = search.trim() !== '' || location !== 'branch';

	/**
	 * Lleva a la ficha de detalle del producto en esta ubicación (procedencias
	 * y «Documentar» viven ahí): la fila deja de expandirse en la misma tabla.
	 * La ubicación vigente viaja en la URL (deep-link) y la fila completa en
	 * `state`, para que el detalle no tenga que volver a pedir el agregado.
	 */
	const handleRowClick = (row: IInventoryStockRow) => {
		const query = location === 'branch' ? '' : `?location=${encodeURIComponent(location)}`;
		navigate(`/inventario/abastecimiento/stock/${row.product.id}${query}`, {
			state: { row, location, owner },
		});
	};

	return (
		<>
			<StockPorUbicacionFilters
				search={search}
				location={location}
				warehouses={warehouses}
				onFilterChange={setFilter}
				onClearFilters={clearFilters}
			/>
			<p className='text-sm text-zinc-600 dark:text-zinc-300'>
				Condición y documentación son dos desgloses independientes del mismo stock físico.
				Cada par suma el físico; no se suman entre sí.
			</p>
			{error && (
				<Alert
					color='red'
					variant='outline'
					icon='HeroExclamationTriangle'
					title='No pudimos cargar el stock'>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<span>{error}</span>
						<Button size='sm' variant='outline' onClick={refresh}>
							Reintentar stock
						</Button>
					</div>
				</Alert>
			)}
			<StockPorUbicacionTable
				rows={response?.data ?? []}
				context={response?.context ?? null}
				meta={response?.meta ?? null}
				loading={loading}
				hasError={Boolean(error)}
				hasFilters={hasFilters}
				onPaginationChange={paginate}
				onRowClick={handleRowClick}
			/>
		</>
	);
};

const StockPorUbicacionView = () => {
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
	// The authorized child is keyed BEFORE rendering. Context/permission changes
	// cannot paint old forms, options, errors or origins while cleanup effects run.
	let content;
	if (isLoading) content = <p role='status'>Comprobando acceso…</p>;
	else if (!branchId)
		content = (
			<Alert title='Selecciona una sucursal'>
				Necesitas una sucursal activa para consultar su stock.
			</Alert>
		);
	else if (!canRead)
		content = (
			<Alert color='amber' title='Sin permiso'>
				No tienes permiso para consultar el stock de esta sucursal.
			</Alert>
		);
	else if (!INVENTORY_STOCK_USE_MOCKS)
		content = (
			<Alert title='Consulta no habilitada'>
				La consulta de stock por ubicación aún no está habilitada en este entorno.
			</Alert>
		);
	else content = <StockSession key={owner} owner={owner} branchId={branchId} />;
	return (
		<PageWrapper isProtectedRoute title='Stock por ubicación'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroCube' />
					<span>Inventario / Stock por ubicación</span>
				</SubheaderLeft>
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

export default StockPorUbicacionView;
