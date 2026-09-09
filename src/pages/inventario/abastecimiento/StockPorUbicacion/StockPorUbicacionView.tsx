import { Fragment } from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import { ProductCard, WarehouseLabel } from '@/components/procurement';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import useStockPorUbicacion from '@/pages/inventario/abastecimiento/StockPorUbicacion/hooks/useStockPorUbicacion';
import InventoryOrigins from '@/pages/inventario/abastecimiento/StockPorUbicacion/components/InventoryOrigins';
import StockPagination from '@/pages/inventario/abastecimiento/StockPorUbicacion/components/StockPagination';

const StockSession = ({ branchId, owner }: { branchId: number; owner: string }) => {
	const {
		formik,
		setFilter,
		clearFilters,
		response,
		error,
		loading,
		expandedId,
		toggleExpanded,
		paginate,
		refresh,
		warehouses,
		locationParams,
		queryKey,
	} = useStockPorUbicacion(branchId, owner);
	return (
		<>
			<form onSubmit={formik.handleSubmit}>
				<Card>
					<CardBody className='flex flex-wrap items-end gap-4'>
						<div className='min-w-48 grow'>
							<label htmlFor='stock-search'>Buscar por nombre o SKU</label>
							<Input
								id='stock-search'
								name='search'
								value={formik.values.search}
								onChange={(event) => setFilter('search', event.target.value)}
								onBlur={formik.handleBlur}
								isValid={!formik.errors.search}
								isTouched={formik.touched.search}
								invalidFeedback={formik.errors.search}
								placeholder='Nombre o SKU del producto'
							/>
						</div>
						<div className='min-w-48 grow'>
							<label htmlFor='stock-location'>Ubicación</label>
							<Select
								id='stock-location'
								name='location'
								value={formik.values.location}
								onChange={(event) => setFilter('location', event.target.value)}
								onBlur={formik.handleBlur}
								isValid={!formik.errors.location}
								isTouched={formik.touched.location}
								invalidFeedback={formik.errors.location}>
								<option value='branch'>Sucursal completa</option>
								<option value='unlocated'>Sin ubicación</option>
								{warehouses.map((warehouse) => (
									<option key={warehouse.id} value={`warehouse:${warehouse.id}`}>
										{warehouse.name}
									</option>
								))}
							</Select>
						</div>
						<Button type='button' variant='outline' onClick={clearFilters}>
							Limpiar filtros
						</Button>
					</CardBody>
				</Card>
			</form>
			<p className='text-sm text-zinc-600 dark:text-zinc-300'>
				Condición y documentación son dos desgloses independientes del mismo stock físico.
				Cada par suma el físico; no se suman entre sí.
			</p>
			{error && (
				<Alert color='red' title='No pudimos cargar el stock'>
					<span>{error}</span>
					<Button type='button' onClick={refresh}>
						Reintentar stock
					</Button>
				</Alert>
			)}
			<Card>
				<CardHeader>
					<CardTitle>Stock físico</CardTitle>
					{response && !loading && (
						<div className='flex flex-wrap items-center gap-3'>
							<span>
								Sucursal {response.context.branch_id} ·{' '}
								{response.context.scope === 'branch' ? (
									'Sucursal completa'
								) : (
									<WarehouseLabel
										warehouse={response.context.warehouse}
										withIcon={false}
									/>
								)}
							</span>
							<span>
								{response.meta.total}{' '}
								{response.meta.total === 1 ? 'producto' : 'productos'}
							</span>
						</div>
					)}
				</CardHeader>
				<CardBody className='overflow-x-auto p-0'>
					<Table aria-label='Stock físico por ubicación' className='min-w-[900px]'>
						<THead>
							<Tr>
								<Th scope='col' rowSpan={2}>
									Producto
								</Th>
								<Th scope='col' rowSpan={2}>
									Físico
								</Th>
								<Th scope='colgroup' colSpan={2}>
									Condición
								</Th>
								<Th scope='colgroup' colSpan={2}>
									Documentación
								</Th>
								<Th scope='col' rowSpan={2}>
									Procedencias
								</Th>
							</Tr>
							<Tr>
								<Th scope='col'>Apto</Th>
								<Th scope='col'>No apto</Th>
								<Th scope='col'>Documentado</Th>
								<Th scope='col'>Sin documento</Th>
							</Tr>
						</THead>
						<TBody>
							{loading && (
								<Tr>
									<Td colSpan={7}>
										<p role='status' className='p-6 text-center'>
											Cargando stock…
										</p>
									</Td>
								</Tr>
							)}
							{!loading && error && (
								<Tr>
									<Td colSpan={7}>No fue posible mostrar el stock.</Td>
								</Tr>
							)}
							{!loading && !error && response?.data.length === 0 && (
								<Tr>
									<Td colSpan={7}>
										Sin productos para esta ubicación o búsqueda.
									</Td>
								</Tr>
							)}
							{!loading &&
								!error &&
								response?.data.map((row) => (
									<Fragment key={row.product.id}>
										<Tr>
											<Td>
												<ProductCard
													product={row.product}
													density='compact'
													showCatalogPricing={false}
												/>
											</Td>
											<Td className='text-lg font-semibold tabular-nums'>
												{row.physical_quantity}
											</Td>
											<Td className='tabular-nums'>{row.fit_quantity}</Td>
											<Td
												className={
													row.unfit_quantity > 0
														? 'font-semibold text-amber-700 dark:text-amber-300'
														: ''
												}>
												{row.unfit_quantity}
											</Td>
											<Td className='border-l border-zinc-200 tabular-nums dark:border-zinc-700'>
												{row.documented_quantity}
											</Td>
											<Td className='tabular-nums'>
												{row.undocumented_quantity}
											</Td>
											<Td>
												<Button
													type='button'
													size='sm'
													variant='outline'
													aria-expanded={expandedId === row.product.id}
													aria-controls={
														expandedId === row.product.id
															? `stock-origins-${row.product.id}`
															: undefined
													}
													aria-label={`Procedencias de ${row.product.name}`}
													onClick={() => toggleExpanded(row.product.id)}>
													{expandedId === row.product.id
														? 'Ocultar'
														: 'Ver procedencias'}
												</Button>
											</Td>
										</Tr>
										{expandedId === row.product.id && (
											<Tr>
												<Td
													colSpan={7}
													id={`stock-origins-${row.product.id}`}>
													<InventoryOrigins
														key={`${queryKey}:${row.product.id}`}
														branchId={branchId}
														productId={row.product.id}
														owner={queryKey}
														location={locationParams}
													/>
												</Td>
											</Tr>
										)}
									</Fragment>
								))}
						</TBody>
					</Table>
				</CardBody>
				{response && !loading && !error && (
					<StockPagination meta={response.meta} noun='productos' onChange={paginate} />
				)}
			</Card>
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
