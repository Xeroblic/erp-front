import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import { ProductCard } from '@/components/procurement';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import useAuthorization from '@/hooks/useAuthorization';
import InventoryOrigins from '@/pages/inventario/abastecimiento/StockPorUbicacion/components/InventoryOrigins';
import StockSummaryKpis from './components/StockSummaryKpis';
import useStockPorUbicacionDetalle from './hooks/useStockPorUbicacionDetalle';

/**
 * Ficha de stock de un producto en una ubicación: procedencias por FIFO y
 * «Documentar stock inicial» (antes expandidos en la fila del listado,
 * StockPorUbicacionView). Toda la lógica vive en `useStockPorUbicacionDetalle`.
 */
const StockPorUbicacionDetalleView = () => {
	const {
		productId,
		hasValidProductId,
		branchId,
		subsidiaryId,
		locationParams,
		hasValidLocation,
		summaryRow,
		owner,
		handleDocumented,
		goToList,
	} = useStockPorUbicacionDetalle();
	const { authorize, isLoading } = useAuthorization();
	const canRead = authorize({
		permission: 'view-product',
		branchId,
		subsidiaryId,
		scope: 'visible',
	});

	let content;
	if (isLoading) content = <p role='status'>Comprobando acceso…</p>;
	else if (!hasValidProductId)
		content = (
			<Alert title='Producto inválido'>El enlace no apunta a un producto válido.</Alert>
		);
	else if (!branchId)
		content = (
			<Alert title='Selecciona una sucursal'>
				Necesitas una sucursal activa para consultar este stock.
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
	else if (!hasValidLocation)
		content = (
			<Alert title='Ubicación no válida'>
				La ubicación del enlace no está disponible en esta sucursal. Vuelve al listado para
				seleccionar una ubicación.
			</Alert>
		);
	else
		content = (
			<>
				{summaryRow && (
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Resumen</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							<ProductCard product={summaryRow.product} showCatalogPricing={false} />
							<StockSummaryKpis summaryRow={summaryRow} />
						</CardBody>
					</Card>
				)}
				<Card>
					<CardBody>
						<InventoryOrigins
							key={`${owner}:${productId}`}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							productId={productId}
							owner={owner}
							location={locationParams}
							onDocumented={handleDocumented}
						/>
					</CardBody>
				</Card>
			</>
		);

	return (
		<PageWrapper
			isProtectedRoute
			title={summaryRow ? `Stock de ${summaryRow.product.name}` : 'Detalle de stock'}>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroCube' />
					<span>Inventario / Abastecimiento / Stock por ubicación</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='outline' icon='HeroArrowLeft' onClick={goToList}>
						Volver al listado
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

export default StockPorUbicacionDetalleView;
