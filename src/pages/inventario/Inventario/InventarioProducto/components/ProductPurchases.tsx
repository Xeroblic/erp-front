import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import ProductSuppliersTable from '@/pages/inventario/Inventario/InventarioProducto/components/ProductSuppliersTable';
import PurchaseHistoryTable from '@/pages/inventario/Inventario/InventarioProducto/components/PurchaseHistoryTable';
import useProductPurchases, {
	type IProductPurchasesOptions,
} from '@/pages/inventario/Inventario/InventarioProducto/hooks/useProductPurchases';
import { INVENTARIO_PRODUCTO_COMPRAS_ANCHOR } from '@/pages/inventario/Inventario/types';

interface IProductPurchasesProps extends IProductPurchasesOptions {
	/** Los productos con serie no se reciben por cantidad: cambia el estado vacío. */
	serialTracking: boolean;
}

const EmptyPurchases = ({ serialTracking }: { serialTracking: boolean }) => (
	<div className='flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700'>
		<Icon icon='HeroShoppingBag' className='h-10 w-10 text-zinc-400' aria-hidden='true' />
		<p className='font-medium'>Todavía no hay compras registradas de este producto.</p>
		<p className='max-w-prose text-sm text-zinc-600 dark:text-zinc-300'>
			{serialTracking
				? 'Los productos con número de serie no se reciben por cantidad, así que sus compras no aparecen aquí.'
				: 'Aparecerán cuando se ingrese una recepción que lo traiga.'}
		</p>
	</div>
);

/**
 * Sección «Compras» de la ficha (§12): proveedores que vendieron el producto,
 * con el sugerido primero y destacado, y el historial de compras. Todo viene
 * calculado por el backend, sobre las sucursales que el usuario alcanza.
 *
 * Se abre directo con `#compras` (`inventarioProductoComprasLink`): como la
 * sección se monta después de cargar la ficha, el desplazamiento lo hace ella.
 * `scroll-mt-60` deja el título a la vista bajo la cabecera y el subheader
 * fijos (~180 px en escritorio, algo más en móvil), también con fuente reducida.
 */
const ProductPurchases = ({ subsidiaryId, productId, serialTracking }: IProductPurchasesProps) => {
	const purchases = useProductPurchases({ subsidiaryId, productId });
	const { suppliers, history, hasFilters } = purchases;
	const { hash } = useLocation();
	const sectionRef = useRef<HTMLDivElement>(null);
	const titleId = `${INVENTARIO_PRODUCTO_COMPRAS_ANCHOR}-title-${productId}`;

	// Una vez por llegada con `#compras`, cuando la sección ya cargó: antes su
	// altura todavía cambia y las tarjetas de arriba la empujan hacia abajo.
	// Filtrar o paginar después no vuelve a desplazar. Instantáneo: el
	// `scroll-behavior: smooth` global se corta si la ficha sigue renderizando.
	const isSettled = !suppliers.loading && !history.loading;
	const scrolledHash = useRef<string | null>(null);
	useEffect(() => {
		if (hash !== `#${INVENTARIO_PRODUCTO_COMPRAS_ANCHOR}`) {
			scrolledHash.current = null;
			return;
		}
		if (!isSettled || scrolledHash.current === hash) return;
		scrolledHash.current = hash;
		sectionRef.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
	}, [hash, isSettled]);

	// Sin compras: ni proveedores ni historial sin filtrar. Una compra sin
	// proveedor no forma fila de proveedor, pero sí aparece en el historial.
	const isEmpty =
		suppliers.response?.data.length === 0 && !hasFilters && history.response?.meta.total === 0;
	const blockingError =
		suppliers.error && suppliers.error.kind !== 'other' ? suppliers.error : null;

	let content;
	if (blockingError)
		content = (
			<Alert color='amber' variant='outline' title='Compras no disponibles'>
				{blockingError.message}
			</Alert>
		);
	else if (isEmpty) content = <EmptyPurchases serialTracking={serialTracking} />;
	// Primera carga: hasta saber si hay compras no se dibujan las dos tablas.
	else if (!suppliers.response && suppliers.loading && history.loading)
		content = <p role='status'>Cargando compras…</p>;
	else
		content = (
			<>
				<section aria-label='Proveedores del producto' className='space-y-3'>
					<h3 className='text-base font-semibold'>Proveedores</h3>
					{suppliers.loading && <p role='status'>Cargando proveedores…</p>}
					{suppliers.error && (
						<Alert
							color='red'
							variant='outline'
							title='No pudimos cargar los proveedores'>
							<div className='flex flex-wrap items-center justify-between gap-3'>
								<span>{suppliers.error.message}</span>
								<Button size='sm' variant='outline' onClick={suppliers.retry}>
									Reintentar
								</Button>
							</div>
						</Alert>
					)}
					{suppliers.response && suppliers.response.data.length === 0 && (
						<p className='text-sm text-zinc-600 dark:text-zinc-300'>
							Ninguna compra registrada tiene proveedor: no hay a quién sugerir.
						</p>
					)}
					{suppliers.response && suppliers.response.data.length > 0 && (
						<ProductSuppliersTable
							response={suppliers.response}
							loading={suppliers.loading}
							onPaginate={purchases.paginateSuppliers}
						/>
					)}
				</section>
				<PurchaseHistoryTable
					productId={productId}
					history={history}
					paginateHistory={purchases.paginateHistory}
					formik={purchases.formik}
					setFilter={purchases.setFilter}
					clearFilters={purchases.clearFilters}
					hasFilters={hasFilters}
					supplierOptions={purchases.supplierOptions}
				/>
			</>
		);

	return (
		<div
			id={INVENTARIO_PRODUCTO_COMPRAS_ANCHOR}
			ref={sectionRef}
			className='scroll-mt-60'
			role='region'
			aria-labelledby={titleId}>
			<Card>
				<CardHeader>
					<div>
						<CardTitle id={titleId} className='text-lg'>
							Compras
						</CardTitle>
						<p className='text-sm text-zinc-600 dark:text-zinc-300'>
							Quién te vendió este producto y cada compra recibida. Sólo se cuentan
							las recepciones de las sucursales a las que tienes acceso: otra persona
							puede ver cifras y una sugerencia distintas.
						</p>
					</div>
				</CardHeader>
				<CardBody className='space-y-8'>{content}</CardBody>
			</Card>
		</div>
	);
};

export default ProductPurchases;
