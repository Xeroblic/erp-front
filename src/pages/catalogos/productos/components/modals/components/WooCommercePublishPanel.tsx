/**
 * Panel de WooCommerce para un producto EXISTENTE (detalle / edición).
 * Agrupa las acciones por producto:
 *   #5 Publicar · #6 Despublicar · #7 Diagnóstico (estado remoto)
 *
 * El switch maestro "Sincronizar con WooCommerce" publica (#5) o despublica (#6).
 * El estado sincronizado es best-effort hasta que el backend exponga un flag
 * explícito; el Diagnóstico (#7) entrega la verdad en vivo.
 */

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	publishProductThunk,
	unpublishProductThunk,
	fetchRemoteState,
	clearRemoteState,
} from '@/store/slices/integrations/woocommerceProductsSlice';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

interface WooCommercePublishPanelProps {
	productId: number;
	/** Estado autoritativo de sincronización (external_product_id presente). */
	initialSynced?: boolean;
	/** Valor inicial del flag de sync de stock (sync_stock_with_woo del producto). */
	initialSyncStock?: boolean;
	/** ID del producto en WooCommerce, si está vinculado. */
	externalProductId?: number | null;
	/** Fecha de publicación en WooCommerce. */
	publishedAt?: string | null;
	/** Último error de publicación reportado por el backend. */
	lastErrorMsg?: string | null;
	isBusy?: boolean;
}

const formatValue = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined || value === '') return '—';
	return String(value);
};

const toNumber = (value: string | number | null | undefined): number | null => {
	if (value === null || value === undefined || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
};

const WooCommercePublishPanel: React.FC<WooCommercePublishPanelProps> = ({
	productId,
	initialSynced = false,
	initialSyncStock = true,
	externalProductId = null,
	publishedAt = null,
	lastErrorMsg = null,
	isBusy = false,
}) => {
	const dispatch = useAppDispatch();
	const { subsidiaryId } = useCurrentBranch();

	const syncingId = useAppSelector((state) => state.woocommerceProducts.syncingId);
	const remoteState = useAppSelector((state) => state.woocommerceProducts.remoteState);
	const remoteLoading = useAppSelector((state) => state.woocommerceProducts.remoteLoading);

	const [synced, setSynced] = useState(initialSynced);
	const [syncStock, setSyncStock] = useState(initialSyncStock);

	// Reinicia el estado al cambiar de producto y limpia el diagnóstico.
	useEffect(() => {
		setSynced(initialSynced);
		setSyncStock(initialSyncStock);
		dispatch(clearRemoteState());
		return () => {
			dispatch(clearRemoteState());
		};
	}, [dispatch, productId, initialSynced, initialSyncStock]);

	const busy = isBusy || syncingId === productId;
	const canAct = subsidiaryId !== null;

	const handleToggleSync = async () => {
		if (!subsidiaryId) {
			toast.error('No hay una subsidiaria activa');
			return;
		}
		const next = !synced;
		try {
			if (next) {
				await dispatch(
					publishProductThunk({
						subsidiaryId,
						productId,
						payload: { sync_stock_with_woo: syncStock },
					}),
				).unwrap();
				toast.success('Producto enviado a publicar en WooCommerce');
			} else {
				await dispatch(
					unpublishProductThunk({
						subsidiaryId,
						productId,
						payload: { sync_stock_with_woo: syncStock },
					}),
				).unwrap();
				toast.success('Producto despublicado de WooCommerce');
			}
			setSynced(next);
		} catch (error) {
			toast.error(
				typeof error === 'string'
					? error
					: `No se pudo ${next ? 'publicar' : 'despublicar'} el producto`,
			);
		}
	};

	const handleUpdatePublication = async () => {
		if (!subsidiaryId) {
			toast.error('No hay una subsidiaria activa');
			return;
		}
		try {
			await dispatch(
				publishProductThunk({
					subsidiaryId,
					productId,
					payload: { sync_stock_with_woo: syncStock },
				}),
			).unwrap();
			toast.success('Publicación actualizada en WooCommerce');
		} catch (error) {
			toast.error(typeof error === 'string' ? error : 'No se pudo actualizar la publicación');
		}
	};

	const handleDiagnose = async () => {
		if (!subsidiaryId) {
			toast.error('No hay una subsidiaria activa');
			return;
		}
		try {
			await dispatch(fetchRemoteState({ subsidiaryId, productId })).unwrap();
		} catch (error) {
			toast.error(
				typeof error === 'string' ? error : 'No se pudo consultar el estado remoto',
			);
		}
	};

	const local = remoteState?.local ?? null;
	const remote = remoteState?.remote ?? null;
	const priceDiff = !!local && !!remote && toNumber(local.price) !== toNumber(remote.price);
	const stockDiff = !!local && !!remote && toNumber(local.stock) !== toNumber(remote.stock);

	return (
		<div className='space-y-6'>
			<Card className='border border-neutral-200 shadow-sm dark:border-neutral-800'>
				<CardHeader className='border-b border-neutral-100 bg-neutral-50/50 pb-3 dark:border-neutral-800 dark:bg-neutral-900/30'>
					<div className='flex items-center gap-3'>
						<div className='rounded-lg bg-amber-50 p-2 text-amber-500 dark:bg-amber-950/40'>
							<Icon icon='HeroShoppingBag' className='h-5 w-5' />
						</div>
						<div>
							<CardTitle className='text-base font-bold text-neutral-800 dark:text-neutral-100'>
								Sincronización con WooCommerce
							</CardTitle>
							<p className='mt-0.5 text-xs text-neutral-500'>
								Controla si este producto se publica y mantiene en la tienda.
							</p>
						</div>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					{!canAct && (
						<div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-950/30 dark:text-yellow-100'>
							No hay una subsidiaria activa. Selecciona una sucursal para operar.
						</div>
					)}

					<div className='flex items-center justify-between rounded-lg border border-neutral-100 p-3 dark:border-white/5'>
						<div className='flex items-center gap-2'>
							<span className='text-sm font-medium text-neutral-700 dark:text-neutral-200'>
								Sincronizar con WooCommerce
							</span>
							{synced ? (
								<Badge color='green'>Sincronizado</Badge>
							) : (
								<Badge color='zinc'>No sincronizado</Badge>
							)}
						</div>
						<Checkbox
							id='woo_sync_master'
							name='woo_sync_master'
							variant='switch'
							checked={synced}
							onChange={() => void handleToggleSync()}
							disabled={!canAct || busy}
						/>
					</div>

					{(externalProductId || publishedAt || lastErrorMsg) && (
						<div className='space-y-1 rounded-md bg-neutral-50 p-3 text-xs dark:bg-neutral-900/40'>
							{externalProductId ? (
								<div className='flex justify-between'>
									<span className='text-neutral-500'>ID en WooCommerce</span>
									<span className='font-medium text-neutral-700 dark:text-neutral-200'>
										#{externalProductId}
									</span>
								</div>
							) : null}
							{publishedAt ? (
								<div className='flex justify-between'>
									<span className='text-neutral-500'>Publicado</span>
									<span className='font-medium text-neutral-700 dark:text-neutral-200'>
										{new Date(publishedAt).toLocaleString('es-CL')}
									</span>
								</div>
							) : null}
							{lastErrorMsg ? (
								<div className='flex justify-between gap-3'>
									<span className='text-neutral-500'>Último error</span>
									<span className='text-right font-medium text-rose-600 dark:text-rose-300'>
										{lastErrorMsg}
									</span>
								</div>
							) : null}
						</div>
					)}

					<Checkbox
						id='woo_panel_sync_stock'
						name='woo_panel_sync_stock'
						checked={syncStock}
						onChange={() => setSyncStock((prev) => !prev)}
						disabled={busy}
						dimension='sm'
						label='Incluir stock al sincronizar'
					/>

					{synced && (
						<Button
							variant='outline'
							color='amber'
							size='sm'
							icon='HeroArrowPath'
							onClick={() => void handleUpdatePublication()}
							isDisable={!canAct || busy}>
							{busy ? 'Procesando…' : 'Actualizar publicación'}
						</Button>
					)}

					<p className='text-xs text-neutral-400'>
						El estado mostrado es referencial. Usa el diagnóstico para ver el estado
						real en la tienda.
					</p>
				</CardBody>
			</Card>

			<Card className='border border-neutral-200 shadow-sm dark:border-neutral-800'>
				<CardHeader className='border-b border-neutral-100 bg-neutral-50/50 pb-3 dark:border-neutral-800 dark:bg-neutral-900/30'>
					<div className='flex items-center justify-between gap-3'>
						<div className='flex items-center gap-3'>
							<div className='rounded-lg bg-sky-50 p-2 text-sky-500 dark:bg-sky-950/40'>
								<Icon icon='HeroMagnifyingGlass' className='h-5 w-5' />
							</div>
							<div>
								<CardTitle className='text-base font-bold text-neutral-800 dark:text-neutral-100'>
									Diagnóstico
								</CardTitle>
								<p className='mt-0.5 text-xs text-neutral-500'>
									Compara el ERP con el estado real en WooCommerce.
								</p>
							</div>
						</div>
						<Button
							variant='outline'
							size='sm'
							icon='HeroArrowPath'
							onClick={() => void handleDiagnose()}
							isDisable={!canAct || remoteLoading}>
							{remoteLoading ? 'Consultando…' : 'Consultar estado remoto'}
						</Button>
					</div>
				</CardHeader>
				<CardBody>
					{!remoteState && !remoteLoading && (
						<p className='text-sm text-neutral-500'>
							Aún no se ha consultado el estado remoto.
						</p>
					)}

					{remoteState && (
						<div className='space-y-3'>
							<div className='flex flex-wrap items-center gap-2 text-sm'>
								<span className='font-medium text-neutral-700 dark:text-neutral-200'>
									En WooCommerce:
								</span>
								{remote ? (
									<>
										<Badge color='green'>Encontrado</Badge>
										<span className='text-xs text-neutral-500'>
											ID remoto: {remote.id}
											{remote.status ? ` · ${remote.status}` : ''}
										</span>
									</>
								) : local?.external_product_id ? (
									<Badge color='amber'>
										Vinculado, sin respuesta de la tienda
									</Badge>
								) : (
									<Badge color='zinc'>No vinculado</Badge>
								)}
							</div>

							{!remote && !local?.external_product_id && (
								<p className='rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-500/30 dark:bg-sky-950/20 dark:text-sky-100'>
									Este producto no está vinculado. Activa el switch para
									sincronizarlo: si en la tienda existe uno con el mismo SKU se
									enlaza automáticamente (no se duplica).
								</p>
							)}

							{remote && (
								<div className='overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800'>
									<table className='w-full text-sm'>
										<thead className='bg-neutral-50 dark:bg-neutral-900/40'>
											<tr className='text-left text-xs uppercase tracking-wider text-neutral-500'>
												<th className='px-3 py-2'>Campo</th>
												<th className='px-3 py-2'>ERP (local)</th>
												<th className='px-3 py-2'>WooCommerce (remoto)</th>
											</tr>
										</thead>
										<tbody>
											<tr className='border-t border-neutral-100 dark:border-neutral-800'>
												<td className='px-3 py-2 font-medium text-neutral-700 dark:text-neutral-200'>
													Estado
												</td>
												<td className='px-3 py-2'>—</td>
												<td className='px-3 py-2'>
													{formatValue(remote.status)}
												</td>
											</tr>
											<tr className='border-t border-neutral-100 dark:border-neutral-800'>
												<td className='px-3 py-2 font-medium text-neutral-700 dark:text-neutral-200'>
													Precio
												</td>
												<td className='px-3 py-2'>
													{formatValue(local?.price)}
												</td>
												<td
													className={`px-3 py-2 ${priceDiff ? 'font-semibold text-rose-600 dark:text-rose-300' : ''}`}>
													{formatValue(remote.price)}
													{priceDiff && (
														<Badge color='red' className='ml-2'>
															Difiere
														</Badge>
													)}
												</td>
											</tr>
											<tr className='border-t border-neutral-100 dark:border-neutral-800'>
												<td className='px-3 py-2 font-medium text-neutral-700 dark:text-neutral-200'>
													Stock
												</td>
												<td className='px-3 py-2'>
													{formatValue(local?.stock)}
												</td>
												<td
													className={`px-3 py-2 ${stockDiff ? 'font-semibold text-rose-600 dark:text-rose-300' : ''}`}>
													{formatValue(remote.stock)}
													{stockDiff && (
														<Badge color='red' className='ml-2'>
															Difiere
														</Badge>
													)}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}
				</CardBody>
			</Card>
		</div>
	);
};

export default WooCommercePublishPanel;
