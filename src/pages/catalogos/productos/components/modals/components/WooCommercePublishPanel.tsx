import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	publishProductThunk,
	unpublishProductThunk,
	fetchRemoteState,
	clearRemoteState,
} from '@/store/slices/integrations/woocommerceProductsSlice';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useWooUnlink } from '@/services/hooks/useWooManualLink';
import { useWooIntegrations } from '@/services/hooks/useWooIntegrations';
import { useWooProductStatus } from '@/pages/catalogos/productos/hooks/useWooProductStatus';
import WooManualLinkPanel from './WooManualLinkPanel';
import WooIntegrationSelector from './WooIntegrationSelector';
import WooProductStorefronts from './WooProductStorefronts';
import WooSyncGuide from './WooSyncGuide';

// Flag de "ya viste la guía" — se muestra automáticamente la primera vez que se
// abre el panel de WooCommerce; luego queda disponible desde el botón de ayuda.
const WOO_GUIDE_SEEN_KEY = 'woo_sync_guide_seen_v1';

interface WooCommercePublishPanelProps {
	productId: number;
	initialSyncStock?: boolean;
	isBusy?: boolean;
	onProductRefresh?: () => void;
	marketplaceExternalIds?: unknown;
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
	initialSyncStock = true,
	isBusy = false,
	onProductRefresh,
	marketplaceExternalIds,
}) => {
	const dispatch = useAppDispatch();
	const { subsidiaryId } = useCurrentBranch();

	const {
		integrations: activeWooIntegrations,
		allWooIntegrations,
		selectedIntegrationId,
		setSelectedIntegrationId,
		loading: integrationsLoading,
		getIntegrationName,
	} = useWooIntegrations(subsidiaryId);

	const { productLinks, publishedHereLink, isPublishedHere, isPublishedElsewhere } = useWooProductStatus(
		marketplaceExternalIds,
		selectedIntegrationId,
	);

	const otherLink = useMemo(() => {
		return productLinks.find((l) => l.integrationId !== selectedIntegrationId) ?? null;
	}, [productLinks, selectedIntegrationId]);

	const otherIntegrationName = useMemo(() => {
		return getIntegrationName(otherLink?.integrationId);
	}, [otherLink, getIntegrationName]);

	const inactiveIntegrationIds = useMemo(
		() => new Set(allWooIntegrations.filter((i) => !i.is_active).map((i) => i.id)),
		[allWooIntegrations],
	);

	const syncingId = useAppSelector((state) => state.woocommerceProducts.syncingId);
	const remoteState = useAppSelector((state) => state.woocommerceProducts.remoteState);
	const remoteLoading = useAppSelector((state) => state.woocommerceProducts.remoteLoading);

	const [syncStock, setSyncStock] = useState(initialSyncStock);
	const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
	const [unpublishing, setUnpublishing] = useState(false);
	const [showGuide, setShowGuide] = useState(false);

	// Muestra la guía automáticamente la primera vez que se abre el panel.
	useEffect(() => {
		try {
			if (!localStorage.getItem(WOO_GUIDE_SEEN_KEY)) {
				setShowGuide(true);
			}
		} catch {
			// localStorage no disponible: no bloquea el panel.
		}
	}, []);

	const closeGuide = useCallback(() => {
		setShowGuide(false);
		try {
			localStorage.setItem(WOO_GUIDE_SEEN_KEY, '1');
		} catch {
			// Ignorar si localStorage no está disponible.
		}
	}, []);

	useEffect(() => {
		setSyncStock(initialSyncStock);
	}, [productId, initialSyncStock]);

	useEffect(() => {
		dispatch(clearRemoteState());
		return () => {
			dispatch(clearRemoteState());
		};
	}, [dispatch, productId, selectedIntegrationId]);

	const busy = isBusy || syncingId === productId;
	const canAct = subsidiaryId !== null && selectedIntegrationId !== null;

	// Desvincular sin borrar (mismo endpoint que el botón de Emparejamiento manual),
	// accesible directo desde el modal de confirmación para no salir de él.
	const unlinkMutation = useWooUnlink(
		subsidiaryId,
		productId,
		selectedIntegrationId ?? undefined,
	);

	const handleUnlinkWithoutDeleting = async () => {
		if (!subsidiaryId || !selectedIntegrationId) {
			toast.error('Selecciona una tienda WooCommerce');
			return;
		}
		try {
			await unlinkMutation.mutateAsync();
			setShowUnpublishConfirm(false);
			onProductRefresh?.();
		} catch {
			// El hook ya muestra el toast de error.
		}
	};

	const handleToggleSync = async () => {
		if (!subsidiaryId || !selectedIntegrationId) {
			toast.error('Selecciona una tienda WooCommerce');
			return;
		}
		// Apagar el toggle envía el producto a la papelera de WooCommerce (acción
		// destructiva). Pedimos confirmación explícita en lugar de despublicar directo.
		if (isPublishedHere) {
			setShowUnpublishConfirm(true);
			return;
		}
		try {
			await dispatch(
				publishProductThunk({
					subsidiaryId,
					productId,
					payload: { sync_stock_with_woo: syncStock },
					integrationId: selectedIntegrationId,
				}),
			).unwrap();
			toast.success('Producto enviado a publicar en WooCommerce');
			onProductRefresh?.();
		} catch (error) {
			toast.error(
				typeof error === 'string' ? error : 'No se pudo publicar el producto',
			);
		}
	};

	const confirmUnpublish = async () => {
		if (!subsidiaryId || !selectedIntegrationId) {
			toast.error('Selecciona una tienda WooCommerce');
			return;
		}
		setUnpublishing(true);
		try {
			await dispatch(
				unpublishProductThunk({
					subsidiaryId,
					productId,
					payload: { sync_stock_with_woo: syncStock },
					integrationId: selectedIntegrationId,
				}),
			).unwrap();
			toast.success('Producto eliminado de WooCommerce (enviado a la papelera)');
			setShowUnpublishConfirm(false);
			onProductRefresh?.();
		} catch (error) {
			toast.error(
				typeof error === 'string' ? error : 'No se pudo eliminar el producto de WooCommerce',
			);
		} finally {
			setUnpublishing(false);
		}
	};

	const handleUpdatePublication = async () => {
		if (!subsidiaryId || !selectedIntegrationId) {
			toast.error('Selecciona una tienda WooCommerce');
			return;
		}
		try {
			await dispatch(
				publishProductThunk({
					subsidiaryId,
					productId,
					payload: { sync_stock_with_woo: syncStock },
					integrationId: selectedIntegrationId,
				}),
			).unwrap();
			toast.success('Publicación actualizada en WooCommerce');
		} catch (error) {
			toast.error(typeof error === 'string' ? error : 'No se pudo actualizar la publicación');
		}
	};

	const handleDiagnose = async () => {
		if (!subsidiaryId || !selectedIntegrationId) {
			toast.error('Selecciona una tienda WooCommerce');
			return;
		}
		try {
			await dispatch(
				fetchRemoteState({ subsidiaryId, productId, integrationId: selectedIntegrationId }),
			).unwrap();
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

	const handleLinkChange = useCallback(() => {
		onProductRefresh?.();
	}, [onProductRefresh]);

	return (
		<div className='space-y-5'>
			{/* ═══════════════════════ 0. TIENDA WOOCOMMERCE ACTIVA ═══════════════════════ */}
			<WooIntegrationSelector
				integrations={activeWooIntegrations}
				selectedId={selectedIntegrationId}
				onSelect={setSelectedIntegrationId}
				loading={integrationsLoading}
			/>

			{/* ═══════════════════════ TIENDAS DONDE ESTÁ PUBLICADO ═══════════════════════ */}
			<WooProductStorefronts
				links={productLinks}
				getIntegrationName={getIntegrationName}
				activeIntegrationId={selectedIntegrationId}
				inactiveIntegrationIds={inactiveIntegrationIds}
			/>

			{/* ═══════════════════════ 1. PUBLICACIÓN ═══════════════════════ */}
			<Card className='overflow-hidden border border-amber-200/60 shadow-sm dark:border-amber-500/20'>
				<CardHeader className='border-b border-amber-100 bg-amber-50 pb-3 dark:border-amber-500/10 dark:bg-amber-950/30'>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/25 dark:bg-amber-500/20 dark:ring-amber-400/30'>
							<Icon
								icon='HeroShoppingBag'
								className='h-5 w-5 text-amber-600 dark:text-amber-400'
							/>
						</div>
						<div className='flex-1'>
							<CardTitle className='text-base font-bold text-neutral-900 dark:text-neutral-50'>
								Publicación en tienda
							</CardTitle>
							<p className='mt-0.5 text-xs text-amber-700/70 dark:text-amber-300/70'>
								Controla si este producto se publica y mantiene sincronizado en
								WooCommerce.
							</p>
						</div>
						{isPublishedHere ? (
							<Badge color='green' variant='solid'>
								Publicado aquí
							</Badge>
						) : (
							<Badge color='zinc' variant='outline'>
								No publicado aquí
							</Badge>
						)}
						<Tooltip text='¿Cómo funciona la sincronización con WooCommerce?'>
							<Button
								variant='outline'
								color='amber'
								size='sm'
								icon='HeroQuestionMarkCircle'
								onClick={() => setShowGuide(true)}
								aria-label='Ver guía de sincronización con WooCommerce'>
								Cómo funciona
							</Button>
						</Tooltip>
					</div>
				</CardHeader>
				<CardBody className='space-y-4'>
					{!canAct && subsidiaryId === null && (
						<div className='rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm font-medium text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-200'>
							<Icon
								icon='HeroExclamationTriangle'
								className='mr-1.5 inline h-4 w-4'
							/>
							No hay una subsidiaria activa. Selecciona una sucursal para operar.
						</div>
					)}

					{isPublishedElsewhere && (
						<div className='flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-950/30'>
							<Icon
								icon='HeroExclamationTriangle'
								className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400'
							/>
							<p className='text-xs font-medium text-amber-800 dark:text-amber-200'>
								Este producto ya está publicado en la tienda WooCommerce{' '}
								<strong>{otherIntegrationName}</strong>. Dado que no se admite
								multi-tienda simultánea por el momento, debes despublicarlo de la otra
								tienda antes de poder habilitar la sincronización aquí.
							</p>
						</div>
					)}

					<div className='mt-4 flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3.5 dark:border-neutral-700 dark:bg-neutral-800/50'>
						<div className='flex flex-col'>
							<span className='text-sm font-medium text-neutral-800 dark:text-neutral-100'>
								Sincronizar con WooCommerce
							</span>
							<span className='text-xs text-neutral-500 dark:text-neutral-400'>
								{isPublishedHere
									? 'Publicado en la tienda seleccionada. Desactiva para despublicarlo.'
									: 'No está en esta tienda. Actívalo para publicarlo aquí.'}
							</span>
						</div>
						<Checkbox
							id='woo_sync_master'
							name='woo_sync_master'
							variant='switch'
							checked={isPublishedHere}
							onChange={() => void handleToggleSync()}
							disabled={!canAct || busy || isPublishedElsewhere}
						/>
					</div>

					{publishedHereLink && (
						<div className='space-y-1.5 rounded-lg border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800/50'>
							{publishedHereLink.externalProductId != null ? (
								<div className='flex justify-between'>
									<span className='text-neutral-500 dark:text-neutral-400'>
										ID en WooCommerce
									</span>
									<span className='font-mono font-semibold text-neutral-800 dark:text-neutral-100'>
										#{publishedHereLink.externalProductId}
									</span>
								</div>
							) : null}
							{publishedHereLink.publishedAt ? (
								<div className='flex justify-between'>
									<span className='text-neutral-500 dark:text-neutral-400'>
										Publicado
									</span>
									<span className='font-medium text-neutral-800 dark:text-neutral-100'>
										{new Date(publishedHereLink.publishedAt).toLocaleString(
											'es-CL',
										)}
									</span>
								</div>
							) : null}
							{publishedHereLink.lastErrorMsg ? (
								<div className='flex justify-between gap-3'>
									<span className='text-neutral-500 dark:text-neutral-400'>
										Último error
									</span>
									<span className='text-right font-medium text-rose-600 dark:text-rose-400'>
										{publishedHereLink.lastErrorMsg}
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

					{isPublishedHere && (
						<Tooltip text='Fuerza una actualización completa del producto en WooCommerce'>
							<Button
								variant='solid'
								color='amber'
								size='sm'
								icon='HeroArrowPath'
								onClick={() => void handleUpdatePublication()}
								isDisable={!canAct || busy}
								aria-label='Actualizar publicación en WooCommerce'>
								{busy ? 'Procesando…' : 'Actualizar publicación'}
							</Button>
						</Tooltip>
					)}

					<p className='text-xs italic text-neutral-400 dark:text-neutral-500'>
						El estado mostrado es referencial. Usa el diagnóstico para ver el estado
						real en la tienda.
					</p>
				</CardBody>
			</Card>

			{/* ═══════════════════════ 2. EMPAREJAMIENTO MANUAL ═══════════════════════ */}
			<WooManualLinkPanel
				productId={productId}
				isLinked={isPublishedHere}
				isLinkedElsewhere={isPublishedElsewhere}
				externalProductId={publishedHereLink?.externalProductId ?? null}
				onLinkChange={handleLinkChange}
				integrationId={selectedIntegrationId ?? undefined}
			/>

			{/* ═══════════════════════ 3. DIAGNÓSTICO ═══════════════════════ */}
			<Card className='overflow-hidden border border-sky-200/60 shadow-sm dark:border-sky-500/20'>
				<CardHeader className='border-b border-sky-100 bg-sky-50 pb-3 dark:border-sky-500/10 dark:bg-sky-950/30'>
					<div className='flex items-center justify-between gap-3'>
						<div className='flex items-center gap-3'>
							<div className='flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 ring-1 ring-sky-500/25 dark:bg-sky-500/20 dark:ring-sky-400/30'>
								<Icon
									icon='HeroMagnifyingGlass'
									className='h-5 w-5 text-sky-600 dark:text-sky-400'
								/>
							</div>
							<div>
								<CardTitle className='text-base font-bold text-neutral-900 dark:text-neutral-50'>
									Diagnóstico
								</CardTitle>
								<p className='mt-0.5 text-xs text-sky-700/70 dark:text-sky-300/70'>
									Compara el ERP con el estado real en WooCommerce en tiempo real.
								</p>
							</div>
						</div>
						<Tooltip text='Consulta el estado real del producto en la tienda WooCommerce'>
							<Button
								variant='solid'
								color='blue'
								size='sm'
								icon='HeroArrowPath'
								onClick={() => void handleDiagnose()}
								isDisable={!canAct || remoteLoading}
								aria-label='Consultar estado remoto del producto'>
								{remoteLoading ? 'Consultando…' : 'Consultar'}
							</Button>
						</Tooltip>
					</div>
				</CardHeader>
				<CardBody>
					{!remoteState && !remoteLoading && (
						<div className='mt-4 flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-600'>
							<Icon
								icon='HeroInformationCircle'
								className='h-5 w-5 flex-shrink-0 text-neutral-400 dark:text-neutral-500'
							/>
							<p className='text-sm text-neutral-500 dark:text-neutral-400'>
								Pulsa <strong>Consultar</strong> para comparar el producto local con
								WooCommerce.
							</p>
						</div>
					)}

					{remoteLoading && (
						<div className='flex items-center justify-center py-6'>
							<Icon
								icon='HeroArrowPath'
								className='mr-2 h-5 w-5 animate-spin text-sky-500'
							/>
							<span className='text-sm text-neutral-500'>
								Consultando estado remoto…
							</span>
						</div>
					)}

					{remoteState && !remoteLoading && (
						<div className='space-y-3'>
							<div className='flex flex-wrap items-center gap-2 text-sm mt-4'>
								<span className='font-medium text-neutral-700 dark:text-neutral-200'>
									Resultado:
								</span>
								{remote ? (
									<>
										<Badge color='green' variant='solid'>
											Encontrado
										</Badge>
										<span className='text-xs text-neutral-500 dark:text-neutral-400'>
											ID remoto: #{remote.id}
											{remote.status ? ` · ${remote.status}` : ''}
										</span>
									</>
								) : local?.external_product_id ? (
									<Badge color='amber' variant='solid'>
										Vinculado, sin respuesta de la tienda
									</Badge>
								) : (
									<Badge color='zinc'>No vinculado</Badge>
								)}
							</div>

							{!remote && !local?.external_product_id && (
								<div className='rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-500/30 dark:bg-sky-950/30 dark:text-sky-200'>
									<Icon
										icon='HeroInformationCircle'
										className='mr-1 inline h-3.5 w-3.5'
									/>
									Este producto no está vinculado. Activa el switch de publicación
									o usa el emparejamiento manual para conectarlo.
								</div>
							)}

							{remote && (
								<div className='overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700'>
									<table className='w-full text-sm'>
										<thead className='bg-neutral-100 dark:bg-neutral-800'>
											<tr className='text-left text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-300'>
												<th className='px-3 py-2.5'>Campo</th>
												<th className='px-3 py-2.5'>ERP (local)</th>
												<th className='px-3 py-2.5'>
													WooCommerce (remoto)
												</th>
											</tr>
										</thead>
										<tbody>
											<tr className='border-t border-neutral-100 dark:border-neutral-700'>
												<td className='px-3 py-2.5 font-medium text-neutral-700 dark:text-neutral-200'>
													Estado
												</td>
												<td className='px-3 py-2.5 text-neutral-600 dark:text-neutral-300'>
													—
												</td>
												<td className='px-3 py-2.5 text-neutral-600 dark:text-neutral-300'>
													{formatValue(remote.status)}
												</td>
											</tr>
											<tr className='border-t border-neutral-100 dark:border-neutral-700'>
												<td className='px-3 py-2.5 font-medium text-neutral-700 dark:text-neutral-200'>
													Precio
												</td>
												<td className='px-3 py-2.5 text-neutral-600 dark:text-neutral-300'>
													{formatValue(local?.price)}
												</td>
												<td
													className={`px-3 py-2.5 ${priceDiff ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-neutral-600 dark:text-neutral-300'}`}>
													{formatValue(remote.price)}
													{priceDiff && (
														<Badge
															color='red'
															variant='solid'
															className='ml-2'>
															Difiere
														</Badge>
													)}
												</td>
											</tr>
											<tr className='border-t border-neutral-100 dark:border-neutral-700'>
												<td className='px-3 py-2.5 font-medium text-neutral-700 dark:text-neutral-200'>
													Stock
												</td>
												<td className='px-3 py-2.5 text-neutral-600 dark:text-neutral-300'>
													{formatValue(local?.stock)}
												</td>
												<td
													className={`px-3 py-2.5 ${stockDiff ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-neutral-600 dark:text-neutral-300'}`}>
													{formatValue(remote.stock)}
													{stockDiff && (
														<Badge
															color='red'
															variant='solid'
															className='ml-2'>
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

			{/* CONFIRMACION: DESPUBLICAR = ELIMINAR EN WOO */}
			<Modal isOpen={showUnpublishConfirm} setIsOpen={setShowUnpublishConfirm} isCentered>
				<ModalHeader>
					<div className='flex items-center gap-3'>
						<span className='flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400'>
							<Icon icon='HeroTrash' className='h-5 w-5' />
						</span>
						<div className='mt-3'>
							<p className='text-lg font-semibold'>Eliminar de WooCommerce</p>
							<p className='text-sm text-neutral-500'>
								Esta acción elimina el producto publicado
							</p>
						</div>
					</div>
				</ModalHeader>
				<ModalBody>
					<div className='space-y-4 py-2'>
						<div className='flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-500/50 dark:bg-red-500/15'>
							<Icon
								icon='HeroExclamationTriangle'
								className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400'
							/>
							<div className='space-y-1'>
								<p className='text-sm font-bold text-red-900 dark:text-red-200'>
									Esta acción eliminará el producto publicado en WooCommerce.
								</p>
								<p className='text-sm text-red-800 dark:text-red-100/90'>
									El producto se enviará a la <strong>papelera</strong> de la tienda
									y dejará de estar visible para los clientes.
								</p>
							</div>
						</div>

						<div className='space-y-2.5 rounded-lg border border-sky-200 bg-sky-50 p-3.5 dark:border-sky-500/30 dark:bg-sky-950/30'>
							<div className='flex items-start gap-2.5'>
								<Icon
									icon='HeroInformationCircle'
									className='mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600 dark:text-sky-400'
								/>
								<p className='text-xs text-sky-800 dark:text-sky-200'>
									¿Solo quieres desconectar la sincronización{' '}
									<strong>sin borrar</strong> el producto de la tienda? Esto mantiene
									el producto vivo en WooCommerce y solo corta la sincronización
									automática de stock.
								</p>
							</div>
							<Button
								variant='outline'
								color='sky'
								size='sm'
								icon='HeroNoSymbol'
								className='w-full'
								onClick={() => void handleUnlinkWithoutDeleting()}
								isLoading={unlinkMutation.isPending}
								isDisable={busy || unpublishing || unlinkMutation.isPending}>
								{unlinkMutation.isPending
									? 'Desvinculando…'
									: 'Desvincular sin borrar'}
							</Button>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<div className='flex w-full justify-end gap-3'>
						<Button
							variant='outline'
							onClick={() => setShowUnpublishConfirm(false)}
							isDisable={unpublishing || unlinkMutation.isPending}>
							Cancelar
						</Button>
						<Button
							variant='solid'
							color='red'
							icon='HeroTrash'
							onClick={() => void confirmUnpublish()}
							isLoading={unpublishing}
							isDisable={unpublishing || unlinkMutation.isPending}>
							{unpublishing ? 'Eliminando…' : 'Sí, eliminar de WooCommerce'}
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			{/* ═══════════════ GUÍA: CÓMO FUNCIONA LA SINCRONIZACIÓN ═══════════════ */}
			<WooSyncGuide isOpen={showGuide} onClose={closeGuide} />
		</div>
	);
};

export default WooCommercePublishPanel;
