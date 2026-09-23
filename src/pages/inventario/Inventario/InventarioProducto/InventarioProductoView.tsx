import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import Icon from '@/components/icon/Icon';
import { UNLOCATED_WAREHOUSE_LABEL, WarehouseLabel } from '@/components/procurement';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import type { IInventoryStockDetail } from '@/interface/inventoryOverview.interface';
import EstadoStockPill from '@/pages/inventario/Inventario/components/parts/EstadoStockPill';
import InventarioKpis, {
	type IInventarioKpi,
} from '@/pages/inventario/Inventario/components/parts/InventarioKpis';
import InventoryOrigins from '@/pages/inventario/Inventario/InventarioProducto/components/InventoryOrigins';
import TrazabilidadProducto from '@/pages/inventario/Inventario/InventarioProducto/components/TrazabilidadProducto';
import UmbralModal from '@/pages/inventario/Inventario/InventarioProducto/components/UmbralModal';
import useInventarioProducto from '@/pages/inventario/Inventario/InventarioProducto/hooks/useInventarioProducto';
import { INVENTARIO_PATH } from '@/pages/inventario/Inventario/types';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';

const plural = (count: number, singular: string, pluralForm: string): string =>
	`${count.toLocaleString('es-CL')} ${count === 1 ? singular : pluralForm}`;

/**
 * Cifras del producto en la sucursal como KPI, igual que la ficha de bodega:
 * qué hay, cuánto se puede vender y qué lo impide. Reservadas y no vendibles
 * sólo aparecen cuando hay.
 */
const kpisProducto = (detail: IInventoryStockDetail): IInventarioKpi[] => {
	const critical = detail.critical_stock;
	const kpis: IInventarioKpi[] = [
		{
			label: 'En la sucursal',
			value: detail.physical_quantity,
			icon: 'HeroArchiveBox',
			accent: 'bg-violet-600',
		},
	];
	if (critical) {
		kpis.push({
			label: 'Disponibles para vender',
			value: critical.available_quantity,
			icon: 'HeroShoppingCart',
			accent: critical.available_quantity > 0 ? 'bg-emerald-600' : 'bg-red-600',
		});
		if (critical.held_quantity > 0)
			kpis.push({
				label: 'Reservadas',
				value: critical.held_quantity,
				icon: 'HeroLockClosed',
				accent: 'bg-blue-600',
			});
	}
	if (detail.unfit_quantity > 0)
		kpis.push({
			label: 'No vendibles',
			value: detail.unfit_quantity,
			icon: 'HeroExclamationTriangle',
			accent: 'bg-red-600',
		});
	kpis.push({
		label: 'Sin documento de compra',
		value: detail.undocumented_quantity,
		icon: 'HeroDocumentMinus',
		accent: 'bg-zinc-700',
	});
	return kpis;
};

/** Campo de la ficha, con el mismo formato que el detalle de documento de compra. */
const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div>
		<p className='text-xs uppercase text-zinc-500'>{label}</p>
		<p>{children}</p>
	</div>
);

/**
 * Espacio fijo para la imagen del producto, a la izquierda de sus datos. Sin
 * imagen se reserva igual el recuadro, así la ficha no cambia de forma.
 */
const ImagenProducto = ({ product }: { product: IInventoryStockDetail['product'] }) => {
	const src = product.image?.url ?? product.image?.thumb ?? null;
	if (src)
		return (
			<img
				src={src}
				alt={product.image?.alt ?? product.name}
				className='h-44 w-44 shrink-0 rounded-xl border border-zinc-200 bg-white object-contain dark:border-zinc-700'
			/>
		);
	return (
		<div className='flex h-44 w-44 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/40'>
			<Icon icon='HeroPhoto' className='h-10 w-10' aria-hidden='true' />
			<span className='text-sm'>Sin imagen</span>
		</div>
	);
};

const Vacio = ({ children }: { children: React.ReactNode }) => (
	<span className='text-zinc-400'>{children}</span>
);

/** Precio en pesos redondeado, sin decimales (`"7990.00"` → `$7.990`). */
const formatPrecio = (value: string | null, currencyCode: string): string | null => {
	if (value === null) return null;
	const rounded = Math.round(Number(value));
	if (!Number.isFinite(rounded)) return null;
	return formatDecimalAmount(`${rounded}.00`, currencyCode)?.replace(/,\d+$/, '') ?? null;
};

/** Precio vigente: la oferta manda cuando existe y el precio normal va tachado. */
const PrecioTexto = ({ product }: { product: IInventoryStockDetail['product'] }) => {
	const price = formatPrecio(product.price, product.currency_code);
	const offerPrice = formatPrecio(product.offer_price, product.currency_code);
	if (offerPrice)
		return (
			<span className='flex flex-wrap items-baseline gap-2'>
				<span className='font-semibold'>{offerPrice}</span>
				{price && <span className='text-sm text-zinc-400 line-through'>{price}</span>}
			</span>
		);
	if (price) return <span className='font-semibold'>{price}</span>;
	return <Vacio>Sin precio</Vacio>;
};

const UmbralTexto = ({ serial, threshold }: { serial: boolean; threshold: number | null }) => {
	if (serial) return <Vacio>No aplica a productos con serie</Vacio>;
	if (threshold === null) return <Vacio>Sin umbral: no avisa cuando se agota</Vacio>;
	return <span>{`Avisa con ${plural(threshold, 'unidad', 'unidades')} o menos`}</span>;
};

const ProductoSession = ({
	branchId,
	subsidiaryId,
	owner,
	productId,
	trazabilidad,
}: {
	branchId: number;
	subsidiaryId: number | null;
	owner: string;
	productId: number;
	/** Filial y nombre de la sucursal para Trazabilidad; `null` sin permiso o sin filial. */
	trazabilidad: { subsidiaryId: number; branchName: string | null } | null;
}) => {
	const {
		detail,
		loading,
		error,
		refresh,
		ubicaciones,
		ubicacion,
		setUbicacion,
		locationParams,
		formik,
		umbralOpen,
		openUmbral,
		closeUmbral,
		updatingThreshold,
	} = useInventarioProducto(branchId, owner, productId);

	if (loading && !detail) return <p role='status'>Cargando ficha…</p>;
	if (error || !detail)
		return (
			<Alert color='red' variant='outline' title='No pudimos cargar la ficha'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<span>{error ?? 'El producto no está disponible en esta sucursal.'}</span>
					<Button size='sm' variant='outline' onClick={refresh}>
						Reintentar
					</Button>
				</div>
			</Alert>
		);

	const critical = detail.critical_stock;
	const { product } = detail;
	const threshold = product.critical_stock_threshold;
	const hasUnfit = detail.warehouses.some((location) => location.unfit_quantity > 0);

	return (
		<>
			<Card>
				<CardHeader>
					<div className='flex items-center gap-3'>
						<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm'>
							<Icon icon='HeroCube' size='text-2xl' color='white' />
						</div>
						<div>
							<CardTitle className='text-lg'>{product.name}</CardTitle>
							<p className='font-mono text-sm text-zinc-500 dark:text-zinc-400'>
								SKU {product.sku}
							</p>
						</div>
					</div>
				</CardHeader>
				<CardBody className='flex flex-col gap-6 md:flex-row md:items-start'>
					<ImagenProducto product={product} />
					<div className='grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						<Campo label='Precio'>
							<PrecioTexto product={product} />
						</Campo>
						<Campo label='Marca'>
							{product.brand?.name ?? <Vacio>Sin marca</Vacio>}
						</Campo>
						<Campo label='Categorías'>
							{product.categories.length > 0 ? (
								product.categories.map((category) => category.name).join(' · ')
							) : (
								<Vacio>Sin categoría</Vacio>
							)}
						</Campo>
						<Campo label='SKU comercial'>
							{product.commercial_sku ? (
								<span className='font-mono'>{product.commercial_sku}</span>
							) : (
								<Vacio>—</Vacio>
							)}
						</Campo>
						<Campo label='Seguimiento'>
							{product.serial_tracking ? 'Por número de serie' : 'Por cantidad'}
						</Campo>
						<Campo label='Grado'>{product.grade ?? <Vacio>—</Vacio>}</Campo>
						<Campo label='Estado del producto'>
							{product.is_active ? 'Activo' : <Vacio>Inactivo</Vacio>}
						</Campo>
						<Campo label='Umbral de stock bajo'>
							<UmbralTexto serial={product.serial_tracking} threshold={threshold} />
						</Campo>
						{product.short_description && (
							<div className='sm:col-span-2 lg:col-span-3'>
								<Campo label='Descripción'>{product.short_description}</Campo>
							</div>
						)}
					</div>
				</CardBody>
				<CardFooter>
					<EstadoStockPill critical={critical} fit />
					{!product.serial_tracking && (
						<ProtectedButton
							permission='edit-product'
							subsidiaryId={subsidiaryId}
							scope='access'
							size='sm'
							variant='outline'
							icon='HeroBellAlert'
							onClick={openUmbral}>
							{threshold === null ? 'Definir umbral' : 'Cambiar umbral'}
						</ProtectedButton>
					)}
				</CardFooter>
			</Card>

			<InventarioKpis kpis={kpisProducto(detail)} />

			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Ubicación</CardTitle>
				</CardHeader>
				<CardBody className='overflow-x-auto p-0'>
					{detail.warehouses.length === 0 ? (
						<p className='px-6 pb-6 text-zinc-600 dark:text-zinc-300'>
							No hay unidades de este producto en la sucursal.
						</p>
					) : (
						<Table aria-label='Unidades por ubicación' className='min-w-[520px]'>
							<THead>
								<Tr>
									<Th scope='col'>Ubicación</Th>
									<Th scope='col' className='text-right'>
										Unidades
									</Th>
									{hasUnfit && (
										<Th scope='col' className='text-right'>
											No vendibles
										</Th>
									)}
									<Th scope='col' className='text-right'>
										Sin documento
									</Th>
								</Tr>
							</THead>
							<TBody>
								{detail.warehouses.map((location) => (
									<Tr key={location.warehouse?.id ?? 'unlocated'}>
										<Td>
											<WarehouseLabel warehouse={location.warehouse} />
										</Td>
										<Td className='text-right font-semibold tabular-nums'>
											{location.physical_quantity}
										</Td>
										{hasUnfit && (
											<Td
												className={classNames(
													'text-right tabular-nums',
													location.unfit_quantity > 0 &&
														'font-semibold text-amber-700 dark:text-amber-300',
												)}>
												{location.unfit_quantity}
											</Td>
										)}
										<Td className='text-right tabular-nums'>
											{location.undocumented_quantity}
										</Td>
									</Tr>
								))}
							</TBody>
						</Table>
					)}
				</CardBody>
			</Card>

			{ubicacion && locationParams && (
				<Card>
					<CardHeader>
						<CardTitle className='text-lg'>Procedencias</CardTitle>
					</CardHeader>
					<CardBody className='space-y-4'>
						{ubicaciones.length > 1 && (
							<div
								role='group'
								aria-label='Ubicación de las procedencias'
								className='flex flex-wrap gap-2'>
								{ubicaciones.map((option) => (
									<Button
										key={option.value}
										size='sm'
										variant={option.value === ubicacion ? 'solid' : 'outline'}
										aria-pressed={option.value === ubicacion}
										onClick={() => setUbicacion(option.value)}>
										{option.warehouse?.name ?? UNLOCATED_WAREHOUSE_LABEL} ·{' '}
										{option.quantity}
									</Button>
								))}
							</div>
						)}
						<InventoryOrigins
							key={`${owner}:${productId}:${ubicacion}`}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							productId={productId}
							owner={`${owner}:origins`}
							location={locationParams}
							onDocumented={refresh}
						/>
					</CardBody>
				</Card>
			)}

			{/* Los productos con serie se siguen por su número de serie, no por operaciones. */}
			{!product.serial_tracking && trazabilidad && (
				<TrazabilidadProducto
					subsidiaryId={trazabilidad.subsidiaryId}
					branchId={branchId}
					branchName={trazabilidad.branchName}
					owner={owner}
					productId={productId}
				/>
			)}

			<UmbralModal
				isOpen={umbralOpen}
				onClose={closeUmbral}
				productName={detail.product.name}
				formik={formik}
				saving={updatingThreshold}
			/>
		</>
	);
};

/**
 * Ficha de un producto en el inventario de la sucursal: estado, dónde está y
 * de dónde vino. Reemplaza al detalle de Stock por ubicación.
 */
const InventarioProductoView = () => {
	const navigate = useNavigate();
	const { productId: productIdParam } = useParams();
	const productId = Number(productIdParam);
	const hasValidProductId = Number.isInteger(productId) && productId > 0;
	const { branchId, subsidiaryId, visibleBranches } = useCurrentBranch();
	const { authorize, isLoading } = useAuthorization();
	const userId = useAppSelector((state) => state.auth.user?.id);
	const canRead = authorize({
		permission: 'view-product',
		branchId,
		subsidiaryId,
		scope: 'visible',
	});
	// Trazabilidad (§14) es de filial y exige su propio permiso.
	const canTrace =
		subsidiaryId !== null &&
		authorize({
			permission: 'view-inventory-movements',
			branchId,
			subsidiaryId,
			scope: 'visible',
		});
	const branchName = visibleBranches.find((branch) => branch.id === branchId)?.name ?? null;
	const trazabilidad = useMemo(
		() => (canTrace && subsidiaryId !== null ? { subsidiaryId, branchName } : null),
		[canTrace, subsidiaryId, branchName],
	);
	const owner = `${userId}:${subsidiaryId}:${branchId}:inventario-producto:${productId}`;

	// Quien abre la ficha manda su ruta con filtros (lista o ficha de bodega), para volver a ella.
	const { state }: { state: unknown } = useLocation();
	const from =
		typeof state === 'object' &&
		state !== null &&
		'from' in state &&
		typeof state.from === 'string' &&
		state.from.startsWith(INVENTARIO_PATH)
			? state.from
			: INVENTARIO_PATH;
	const goBack = useCallback(() => navigate(from), [from, navigate]);
	const goToProduct = useCallback(() => {
		const query = typeof branchId === 'number' ? `?branchId=${branchId}` : '';
		navigate(`/catalogos/productos/${productId}${query}`);
	}, [branchId, navigate, productId]);

	let content;
	if (isLoading) content = <p role='status'>Comprobando acceso…</p>;
	else if (!hasValidProductId)
		content = (
			<Alert title='Producto inválido'>El enlace no apunta a un producto válido.</Alert>
		);
	else if (!branchId)
		content = (
			<Alert title='Selecciona una sucursal'>
				Necesitas una sucursal activa para consultar este producto.
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
			<ProductoSession
				key={owner}
				owner={owner}
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				productId={productId}
				trazabilidad={trazabilidad}
			/>
		);

	return (
		<PageWrapper isProtectedRoute title='Ficha de inventario'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroCube'
						title='Ficha de inventario'
						description='Estado, ubicación, procedencia e historial del producto en esta sucursal'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					{hasValidProductId && (
						<ProtectedButton
							permission='edit-product'
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							scope='access'
							variant='outline'
							icon='HeroPencilSquare'
							onClick={goToProduct}>
							Editar producto
						</ProtectedButton>
					)}
					<Button variant='outline' icon='HeroArrowLeft' onClick={goBack}>
						Volver
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

export default InventarioProductoView;
