/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import type { ColumnDef } from '@tanstack/react-table';
import { useAppSelector, useAppDispatch } from '@/store';
import {
	fetchWooProducts,
	syncProductPriceThunk,
	syncProductStockThunk,
	publishChildrenThunk,
	unpublishProductThunk,
} from '@/store/slices/integrations/woocommerceProductsSlice';
import { useWooIntegrations } from '@/services/hooks/useWooIntegrations';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import DataTable from '@/components/ui/DataTable/DataTable';
import WooIntegrationSelector from '@/pages/catalogos/productos/components/modals/components/WooIntegrationSelector';
import useCan from '@/hooks/useCan';
import type { WooProduct } from '@/types/integrations.types';
import UnlinkAllProductsModal from './components/UnlinkAllProductsModal';

export const WooProductsContent: React.FC = () => {
	const dispatch = useAppDispatch();
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const {
		allWooIntegrations,
		selectedIntegrationId,
		setSelectedIntegrationId,
		loading: integrationsLoading,
		isSelectedInactive,
	} = useWooIntegrations(subsidiaryId);

	const { products, loading, syncingId } = useAppSelector((state) => state.woocommerceProducts);

	const { isSuperAdmin } = useCan();

	// Modal de desvinculación masiva (solo super-admin)
	const [unlinkAllOpen, setUnlinkAllOpen] = useState(false);

	// Filtros locales
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [onlyErrors, setOnlyErrors] = useState(false);

	// Debounce manual de búsqueda para no saturar la API
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchTerm);
		}, 600);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Cargar productos cuando cambian los filtros principales
	const loadProducts = useCallback(() => {
		if (!subsidiaryId || !selectedIntegrationId) return;
		dispatch(
			fetchWooProducts({
				subsidiaryId,
				integrationId: selectedIntegrationId,
				params: {
					search: debouncedSearch.trim() || undefined,
					only_errors: onlyErrors,
				},
			}),
		).catch(() => {});
	}, [dispatch, subsidiaryId, selectedIntegrationId, debouncedSearch, onlyErrors]);

	useEffect(() => {
		loadProducts();
	}, [loadProducts]);

	// Manejadores de acciones individuales
	const handleSyncPrice = useCallback(
		async (product: WooProduct) => {
			if (!subsidiaryId || !selectedIntegrationId) return;
			try {
				await dispatch(
					syncProductPriceThunk({
						subsidiaryId,
						productId: product.id,
						integrationId: selectedIntegrationId,
					}),
				).unwrap();
				toast.success(`Precio de "${product.name}" sincronizado con éxito`);
				loadProducts();
			} catch (error) {
				toast.error(typeof error === 'string' ? error : 'No se pudo sincronizar el precio');
			}
		},
		[dispatch, subsidiaryId, selectedIntegrationId, loadProducts],
	);

	const handleSyncStock = useCallback(
		async (product: WooProduct) => {
			if (!subsidiaryId || !selectedIntegrationId) return;
			try {
				await dispatch(
					syncProductStockThunk({
						subsidiaryId,
						productId: product.id,
						integrationId: selectedIntegrationId,
					}),
				).unwrap();
				toast.success(`Stock de "${product.name}" sincronizado con éxito`);
				loadProducts();
			} catch (error) {
				toast.error(typeof error === 'string' ? error : 'No se pudo sincronizar el stock');
			}
		},
		[dispatch, subsidiaryId, selectedIntegrationId, loadProducts],
	);

	const handleSyncChildren = useCallback(
		async (product: WooProduct) => {
			if (!subsidiaryId || !selectedIntegrationId) return;
			try {
				await dispatch(
					publishChildrenThunk({
						subsidiaryId,
						productId: product.id,
						integrationId: selectedIntegrationId,
					}),
				).unwrap();
				toast.success(`Variaciones de "${product.name}" sincronizadas con éxito`);
				loadProducts();
			} catch (error) {
				toast.error(
					typeof error === 'string' ? error : 'No se pudo sincronizar las variaciones',
				);
			}
		},
		[dispatch, subsidiaryId, selectedIntegrationId, loadProducts],
	);

	const handleUnpublish = useCallback(
		async (product: WooProduct) => {
			if (!subsidiaryId || !selectedIntegrationId) return;
			if (!window.confirm(`¿Estás seguro de despublicar "${product.name}" de WooCommerce?`))
				return;

			try {
				await dispatch(
					unpublishProductThunk({
						subsidiaryId,
						productId: product.id,
						integrationId: selectedIntegrationId,
					}),
				).unwrap();
				toast.success(`Producto "${product.name}" despublicado con éxito`);
				loadProducts();
			} catch (error) {
				toast.error(
					typeof error === 'string' ? error : 'No se pudo despublicar el producto',
				);
			}
		},
		[dispatch, subsidiaryId, selectedIntegrationId, loadProducts],
	);

	const columns = useMemo<ColumnDef<WooProduct>[]>(
		() => [
			{
				id: 'ids',
				header: 'IDs (ERP / Woo)',
				cell: ({ row }) => {
					const product = row.original;
					const wcId = product.woocommerce?.external_product_id;
					return (
						<div className='flex flex-col gap-0.5 font-mono text-xs'>
							<div className='flex items-center gap-1'>
								<span className='w-7 text-[9px] font-bold text-neutral-400 dark:text-neutral-500'>
									ERP:
								</span>
								<span className='font-semibold text-neutral-800 dark:text-neutral-200'>
									#{product.id}
								</span>
							</div>
							<div className='flex items-center gap-1'>
								<span className='w-7 text-[9px] font-bold text-neutral-400 dark:text-neutral-500'>
									WC:
								</span>
								<span className='font-semibold text-neutral-600 dark:text-neutral-400'>
									{wcId ? `#${wcId}` : '—'}
								</span>
							</div>
						</div>
					);
				},
			},
			{
				accessorKey: 'name',
				header: 'Producto',
				cell: ({ row }) => {
					const product = row.original;
					const lastError = product.woocommerce?.last_error_msg;
					const erpName = product.name;
					const wooName = product.woocommerce?.name;
					const namesDiffer = !!(
						wooName && erpName.toLowerCase().trim() !== wooName.toLowerCase().trim()
					);

					return (
						<div className='flex max-w-xs flex-col gap-0.5'>
							<div className='flex items-start gap-1'>
								{namesDiffer && (
									<span className='mt-1 flex-shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-extrabold leading-none text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'>
										ERP
									</span>
								)}
								<p
									className='truncate font-medium text-neutral-900 dark:text-neutral-100'
									title={erpName}>
									{erpName}
								</p>
							</div>
							{wooName && namesDiffer && (
								<div className='flex items-start gap-1'>
									<span className='mt-1 flex-shrink-0 rounded bg-sky-100 px-1 py-0.5 text-[9px] font-extrabold leading-none text-sky-800 dark:bg-sky-950/40 dark:text-sky-400'>
										Woo
									</span>
									<p
										className='truncate text-xs italic text-neutral-500 dark:text-neutral-400'
										title={wooName}>
										{wooName}
									</p>
								</div>
							)}
							{product.commercial_sku && (
								<p className='text-xs text-neutral-400 dark:text-neutral-500'>
									Comercial: {product.commercial_sku}
								</p>
							)}
							{lastError && (
								<div className='mt-1 flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400'>
									<Icon
										icon='HeroExclamationTriangle'
										className='h-3.5 w-3.5 flex-shrink-0'
									/>
									<Tooltip text={lastError} placement='top'>
										<span className='max-w-[200px] cursor-help truncate underline decoration-dotted'>
											{lastError}
										</span>
									</Tooltip>
								</div>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: 'sku',
				header: 'SKUs (ERP / Woo)',
				cell: ({ row }) => {
					const product = row.original;
					const erpSku = product.sku || 'Sin SKU';
					const wooSku = product.woocommerce?.sku;
					const skusDiffer = !!(wooSku && erpSku.trim() !== wooSku.trim());

					return (
						<div className='flex flex-col gap-1 text-xs'>
							<div className='flex items-center gap-1.5'>
								{skusDiffer && (
									<span className='w-8 flex-shrink-0 rounded bg-amber-100 px-1 py-0.5 text-center text-[9px] font-extrabold leading-none text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'>
										ERP
									</span>
								)}
								<code className='rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'>
									{erpSku}
								</code>
							</div>
							{wooSku && (
								<div className='flex items-center gap-1.5'>
									{skusDiffer && (
										<span className='w-8 flex-shrink-0 rounded bg-sky-100 px-1 py-0.5 text-center text-[9px] font-extrabold leading-none text-sky-800 dark:bg-sky-950/40 dark:text-sky-400'>
											Woo
										</span>
									)}
									<code
										className={`rounded px-2 py-0.5 font-mono text-xs ${
											skusDiffer
												? 'border border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
												: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
										}`}>
										{wooSku}
									</code>
									{skusDiffer && (
										<Tooltip
											text='El SKU en WooCommerce no coincide con el ERP'
											placement='top'>
											<span>
												<Icon
													icon='HeroExclamationTriangle'
													className='h-3.5 w-3.5 cursor-help text-amber-500'
												/>
											</span>
										</Tooltip>
									)}
								</div>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: 'price',
				header: 'Precios (ERP / Woo)',
				cell: ({ row }) => {
					const product = row.original;
					const erpPriceBase = Number(product.price ?? 0);
					const erpPriceOffer = product.offer_price ? Number(product.offer_price) : null;
					const erpPriceFinal =
						erpPriceOffer && erpPriceOffer < erpPriceBase
							? erpPriceOffer
							: erpPriceBase;

					const wooPriceBase = product.woocommerce?.price
						? Number(product.woocommerce.price)
						: null;
					const wooPriceOffer = product.woocommerce?.offer_price
						? Number(product.woocommerce.offer_price)
						: null;
					const wooPriceFinal =
						wooPriceOffer && wooPriceOffer < (wooPriceBase ?? 0)
							? wooPriceOffer
							: wooPriceBase;

					const pricesDiffer = wooPriceFinal !== null && erpPriceFinal !== wooPriceFinal;

					const formatter = new Intl.NumberFormat('es-CL', {
						style: 'currency',
						currency: 'CLP',
					});

					return (
						<div className='flex flex-col gap-1 text-xs'>
							{/* ERP Prices */}
							<div className='flex items-center gap-1.5'>
								<span className='w-7 text-[9px] font-bold text-neutral-400 dark:text-neutral-500'>
									ERP:
								</span>
								<div className='flex flex-wrap items-baseline gap-1'>
									{erpPriceOffer && erpPriceOffer < erpPriceBase ? (
										<>
											<span className='font-semibold text-emerald-600 dark:text-emerald-400'>
												{formatter.format(erpPriceOffer)}
											</span>
											<span className='text-[10px] text-neutral-400 line-through dark:text-neutral-500'>
												{formatter.format(erpPriceBase)}
											</span>
										</>
									) : (
										<span className='font-medium text-neutral-800 dark:text-neutral-200'>
											{formatter.format(erpPriceBase)}
										</span>
									)}
								</div>
							</div>

							{/* Woo Prices */}
							{wooPriceBase !== null && (
								<div className='flex items-center gap-1.5 border-t border-neutral-100 pt-1 dark:border-neutral-800/60'>
									<span className='w-7 text-[9px] font-bold text-neutral-400 dark:text-neutral-500'>
										Woo:
									</span>
									<div className='flex flex-wrap items-baseline gap-1'>
										{wooPriceOffer && wooPriceOffer < wooPriceBase ? (
											<>
												<span
													className={`font-semibold ${
														pricesDiffer
															? 'font-bold text-rose-600 dark:text-rose-400'
															: 'text-emerald-600 dark:text-emerald-400'
													}`}>
													{formatter.format(wooPriceOffer)}
												</span>
												<span className='text-[10px] text-neutral-400 line-through dark:text-neutral-500'>
													{formatter.format(wooPriceBase)}
												</span>
											</>
										) : (
											<span
												className={`font-medium ${
													pricesDiffer
														? 'font-bold text-rose-600 dark:text-rose-400'
														: 'text-neutral-800 dark:text-neutral-200'
												}`}>
												{formatter.format(wooPriceBase)}
											</span>
										)}
										{pricesDiffer && (
											<Tooltip
												text='El precio final en WooCommerce difiere del ERP'
												placement='top'>
												<span>
													<Icon
														icon='HeroExclamationTriangle'
														className='ml-0.5 h-3.5 w-3.5 cursor-help text-amber-500'
													/>
												</span>
											</Tooltip>
										)}
									</div>
								</div>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: 'woocommerce.sync_stock_with_woo',
				header: 'Sync Stock',
				cell: ({ row }) => {
					const sync = row.original.sync_stock_with_woo ?? true;
					return (
						<Badge color={sync ? 'green' : 'zinc'} variant={sync ? 'solid' : 'outline'}>
							{sync ? 'Activa' : 'Inactiva'}
						</Badge>
					);
				},
			},
			{
				id: 'status',
				header: 'Estado',
				cell: ({ row }) => {
					const product = row.original;
					const lastError = product.woocommerce?.last_error_msg;
					const publishedAt = product.woocommerce?.published_at;

					if (lastError) {
						return <Badge color='red'>Error de Sync</Badge>;
					}
					if (publishedAt) {
						return <Badge color='green'>Sincronizado</Badge>;
					}
					return <Badge color='zinc'>Borrador / Desconectado</Badge>;
				},
			},
			{
				id: 'actions',
				header: 'Acciones',
				cell: ({ row }) => {
					const product = row.original;
					const isRowBusy = syncingId === product.id;
					const isParent = product.product_type && product.product_type !== 'general';

					return (
						<div className='flex flex-wrap items-center gap-1.5'>
							<Tooltip text='Sincronizar precio en WooCommerce' placement='top'>
								<Button
									size='sm'
									variant='outline'
									color='zinc'
									onClick={() => {
										handleSyncPrice(product).catch(() => {});
									}}
									isDisable={loading || isRowBusy}
									aria-label='Sincronizar precio'>
									{isRowBusy ? (
										<Icon
											icon='HeroArrowPath'
											className='h-4 w-4 animate-spin'
										/>
									) : (
										<Icon icon='HeroCurrencyDollar' className='h-4 w-4' />
									)}
								</Button>
							</Tooltip>

							<Tooltip text='Sincronizar stock en WooCommerce' placement='top'>
								<Button
									size='sm'
									variant='outline'
									color='zinc'
									onClick={() => {
										handleSyncStock(product).catch(() => {});
									}}
									isDisable={loading || isRowBusy}
									aria-label='Sincronizar stock'>
									{isRowBusy ? (
										<Icon
											icon='HeroArrowPath'
											className='h-4 w-4 animate-spin'
										/>
									) : (
										<Icon icon='HeroInboxStack' className='h-4 w-4' />
									)}
								</Button>
							</Tooltip>

							{isParent && (
								<Tooltip
									text='Sincronizar variaciones en WooCommerce'
									placement='top'>
									<Button
										size='sm'
										variant='outline'
										color='zinc'
										onClick={() => {
											handleSyncChildren(product).catch(() => {});
										}}
										isDisable={loading || isRowBusy}
										aria-label='Sincronizar variaciones'>
										{isRowBusy ? (
											<Icon
												icon='HeroArrowPath'
												className='h-4 w-4 animate-spin'
											/>
										) : (
											<Icon icon='HeroQueueList' className='h-4 w-4' />
										)}
									</Button>
								</Tooltip>
							)}

							<Tooltip text='Despublicar / desvincular producto' placement='top'>
								<Button
									size='sm'
									variant='outline'
									color='red'
									onClick={() => {
										handleUnpublish(product).catch(() => {});
									}}
									isDisable={loading || isRowBusy}
									aria-label='Despublicar'>
									{isRowBusy ? (
										<Icon
											icon='HeroArrowPath'
											className='h-4 w-4 animate-spin'
										/>
									) : (
										<Icon icon='HeroLinkSlash' className='h-4 w-4' />
									)}
								</Button>
							</Tooltip>
						</div>
					);
				},
			},
		],
		[loading, syncingId, handleSyncPrice, handleSyncStock, handleSyncChildren, handleUnpublish],
	);

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<span className='text-2xl font-bold text-neutral-900 dark:text-neutral-50'>
						Productos de WooCommerce
					</span>
					<Badge color='emerald' className='ml-2.5 font-semibold'>
						{products.length} Vinculados
					</Badge>
				</SubheaderLeft>
				<SubheaderRight>
					{isSuperAdmin && (
						<Button
							variant='outline'
							color='red'
							icon='HeroScissors'
							onClick={() => setUnlinkAllOpen(true)}
							isDisable={loading || !subsidiaryId}>
							Desvincular todos
						</Button>
					)}
					<Button
						variant='outline'
						color='zinc'
						icon='HeroArrowPath'
						onClick={loadProducts}
						isDisable={loading}>
						Actualizar
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='grid grid-cols-1 gap-5'>
					{/* Panel de configuración de integración */}
					<Card className='overflow-visible border border-neutral-200 shadow-sm dark:border-neutral-700/80'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Tienda WooCommerce</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<WooIntegrationSelector
								integrations={allWooIntegrations}
								selectedId={selectedIntegrationId}
								onSelect={setSelectedIntegrationId}
								loading={integrationsLoading}
							/>

							{isSelectedInactive && selectedIntegrationId && (
								<div className='mt-4 flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-950/30'>
									<Icon
										icon='HeroExclamationTriangle'
										className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400'
									/>
									<p className='text-xs font-medium text-amber-800 dark:text-amber-200'>
										Esta tienda está <strong>inactiva</strong>. Las acciones de
										sincronización podrían fallar hasta reactivarla en el menú
										de Integraciones.
									</p>
								</div>
							)}
						</CardBody>
					</Card>

					{selectedIntegrationId && (
						<Card className='border border-neutral-200 shadow-sm dark:border-neutral-700/80'>
							<CardHeader className='pb-0'>
								<CardHeaderChild className='w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
									<CardTitle>Productos Vinculados</CardTitle>

									{/* Filtros de Búsqueda y Errores */}
									<div className='w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center'>
										<div className='relative w-full sm:w-64'>
											<Input
												name='search'
												id='woo-search'
												placeholder='Buscar por nombre o SKU...'
												value={searchTerm}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) => {
													setSearchTerm(e.target.value);
												}}
												dimension='sm'
											/>
										</div>

										<button
											type='button'
											onClick={() => {
												setOnlyErrors((prev) => !prev);
											}}
											className={`flex items-center justify-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all ${
												onlyErrors
													? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400'
													: 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
											}`}>
											<Icon
												icon='HeroExclamationTriangle'
												className='h-4 w-4'
											/>
											Solo con errores
										</button>
									</div>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<DataTable
									columns={columns}
									data={products}
									loading={loading}
									searchPlaceholder='Filtrar tabla...'
									emptyMessage={
										loading
											? 'Cargando productos de la tienda...'
											: 'No se encontraron productos vinculados en WooCommerce'
									}
								/>
							</CardBody>
						</Card>
					)}
				</div>
			</Container>

			<UnlinkAllProductsModal
				isOpen={unlinkAllOpen}
				onClose={() => setUnlinkAllOpen(false)}
				onSuccess={loadProducts}
				subsidiaryId={subsidiaryId}
			/>
		</>
	);
};

const WooProductsPage: React.FC = () => (
	<PageWrapper name='Productos Sincronizados WooCommerce'>
		<WooProductsContent />
	</PageWrapper>
);

export default WooProductsPage;
