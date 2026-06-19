import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import {
	useWooCandidates,
	useWooCompare,
	useWooLink,
	useWooUnlink,
	extractConflictData,
	extractErrorMessage,
} from '@/services/hooks/useWooManualLink';
import type { WooCandidate, WooPriceResolution } from '@/types/integrations.types';

interface WooManualLinkPanelProps {
	productId: number;
	isLinked: boolean;
	externalProductId?: number | null;
	onLinkChange?: () => void;
}

const formatPrice = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined || value === '') return '—';
	const n = Number(value);
	return Number.isFinite(n) ? `$${n.toLocaleString('es-CL')}` : String(value);
};

const WooManualLinkPanel: React.FC<WooManualLinkPanelProps> = ({
	productId,
	isLinked,
	externalProductId = null,
	onLinkChange,
}) => {
	const { subsidiaryId } = useCurrentBranch();
	const canAct = subsidiaryId !== null;

	const [searchOpen, setSearchOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchEnabled, setSearchEnabled] = useState(false);
	const [selectedCandidate, setSelectedCandidate] = useState<WooCandidate | null>(null);

	const compareParams = useMemo(() => {
		if (!selectedCandidate) return null;
		if (selectedCandidate.id != null) return { external_product_id: selectedCandidate.id };
		if (selectedCandidate.sku) return { external_sku: selectedCandidate.sku };
		return null;
	}, [selectedCandidate]);

	const [priceConflict, setPriceConflict] = useState<{
		erp_price: string | number | null;
		woo_price: string | number | null;
	} | null>(null);
	const [syncStock, setSyncStock] = useState(false);
	const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);

	const candidatesQuery = useWooCandidates(
		subsidiaryId,
		productId,
		searchTerm ? { q: searchTerm, per_page: 10 } : { per_page: 10 },
		searchEnabled,
	);

	const compareQuery = useWooCompare(subsidiaryId, productId, compareParams);
	const linkMutation = useWooLink(subsidiaryId, productId);
	const unlinkMutation = useWooUnlink(subsidiaryId, productId);

	useEffect(() => {
		if (compareQuery.error) {
			toast.error(
				`Error al comparar: ${extractErrorMessage(compareQuery.error)}`,
			);
		}
	}, [compareQuery.error]);

	useEffect(() => {
		if (candidatesQuery.error) {
			toast.error(
				`Error al buscar candidatos: ${extractErrorMessage(candidatesQuery.error)}`,
			);
		}
	}, [candidatesQuery.error]);

	const handleOpenSearch = useCallback(() => {
		setSearchOpen(true);
		setSearchEnabled(true);
		setSelectedCandidate(null);
		setPriceConflict(null);
		setSearchTerm('');
	}, []);

	const handleCloseSearch = useCallback(() => {
		setSearchOpen(false);
		setSearchEnabled(false);
		setSelectedCandidate(null);
		setPriceConflict(null);
	}, []);

	const handleSelectCandidate = useCallback((candidate: WooCandidate) => {
		setSelectedCandidate(candidate);
		setPriceConflict(null);
	}, []);

	const handleBackToList = useCallback(() => {
		setSelectedCandidate(null);
		setPriceConflict(null);
	}, []);

	const handleLink = useCallback(
		async (priceResolution?: WooPriceResolution) => {
			if (!selectedCandidate) return;
			if (selectedCandidate.id == null && !selectedCandidate.sku) {
				toast.warning(
					'No se pudo identificar el producto de WooCommerce: no tiene ID ni SKU válido.',
				);
				return;
			}
			try {
				await linkMutation.mutateAsync({
					...(selectedCandidate.id != null
						? { external_product_id: selectedCandidate.id }
						: { external_sku: selectedCandidate.sku }),
					sync_stock_with_woo: syncStock,
					...(priceResolution ? { price_resolution: priceResolution } : {}),
				});
				setPriceConflict(null);
				handleCloseSearch();
				onLinkChange?.();
			} catch (error: unknown) {
				const conflict = extractConflictData(error);
				if (conflict) {
					setPriceConflict(conflict);
				}
			}
		},
		[selectedCandidate, syncStock, linkMutation, handleCloseSearch, onLinkChange],
	);

	const handleUnlink = useCallback(async () => {
		try {
			await unlinkMutation.mutateAsync();
			setUnlinkConfirmOpen(false);
			onLinkChange?.();
		} catch {
			// Toast handled by hook
		}
	}, [unlinkMutation, onLinkChange]);

	const handleSearchSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			setSearchEnabled(true);
			void candidatesQuery.refetch();
		},
		[candidatesQuery],
	);

	const candidates: WooCandidate[] = useMemo(() => {
		const raw = candidatesQuery.data;
		if (!raw) return [];
		const arr = Array.isArray(raw)
			? raw
			: Array.isArray((raw as Record<string, unknown>).data)
				? ((raw as Record<string, unknown>).data as unknown[])
				: [];
		return arr.map((item) => {
			const r = item as Record<string, unknown>;
			const id = (r.id ?? r.woo_id ?? r.external_product_id ?? r.product_id) as
				| number
				| undefined;
			return { ...r, id } as WooCandidate;
		});
	}, [candidatesQuery.data]);

	const comparison = compareQuery.data;
	const comparisonRecord = comparison as Record<string, unknown> | undefined;
	const comparisonData = comparisonRecord?.data ?? comparison;

	return (
		<Card className='overflow-hidden border border-violet-200/60 shadow-sm dark:border-violet-500/20'>
			<CardHeader className='border-b border-violet-100 bg-violet-50 pb-3 dark:border-violet-500/10 dark:bg-violet-950/30'>
				<div className='flex items-center justify-between gap-3'>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/25 dark:bg-violet-500/20 dark:ring-violet-400/30'>
							<Icon
								icon='HeroLink'
								className='h-5 w-5 text-violet-600 dark:text-violet-400'
							/>
						</div>
						<div>
							<CardTitle className='text-base font-bold text-neutral-900 dark:text-neutral-50'>
								Emparejamiento manual
							</CardTitle>
							<p className='mt-0.5 text-xs text-violet-700/70 dark:text-violet-300/70'>
								Vincula este producto con una ficha existente en WooCommerce.
							</p>
						</div>
					</div>
					{isLinked && externalProductId && (
						<Badge color='green' variant='solid'>
							WC #{externalProductId}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardBody className='space-y-4'>
				{!canAct && (
					<div className='rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm font-medium text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-200'>
						<Icon icon='HeroExclamationTriangle' className='mr-1.5 inline h-4 w-4' />
						No hay una subsidiaria activa. Selecciona una sucursal para operar.
					</div>
				)}

				{isLinked ? (
					<div className='mt-4 space-y-3'>
						<div className='rounded-lg border border-green-300 bg-green-50 p-3.5 dark:border-green-500/30 dark:bg-green-950/30'>
							<div className='flex items-center gap-2.5'>
								<div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 dark:bg-green-500/25'>
									<Icon
										icon='HeroCheckCircle'
										className='h-5 w-5 text-green-600 dark:text-green-400'
									/>
								</div>
								<div className='min-w-0 flex-1'>
									<p className='text-sm font-semibold text-green-800 dark:text-green-200'>
										Producto vinculado manualmente
									</p>
									<p className='text-xs text-green-700 dark:text-green-400'>
										ID en WooCommerce:{' '}
										<span className='font-mono font-bold'>
											#{externalProductId}
										</span>
									</p>
								</div>
							</div>
						</div>

						<Tooltip text='Rompe el vínculo con WooCommerce sin afectar la ficha remota'>
							<Button
								variant='solid'
								color='red'
								size='sm'
								icon='HeroLinkSlash'
								onClick={() => setUnlinkConfirmOpen(true)}
								isDisable={!canAct || unlinkMutation.isPending}
								isLoading={unlinkMutation.isPending}
								aria-label='Desvincular producto de WooCommerce'>
								Desvincular de WooCommerce
							</Button>
						</Tooltip>
					</div>
				) : (
					<div className='space-y-3'>
						<div className='flex items-start gap-2.5 rounded-lg border border-dashed border-neutral-300 bg-white p-3.5 dark:border-neutral-600 dark:bg-neutral-800/50'>
							<Icon
								icon='HeroInformationCircle'
								className='mt-0.5 h-5 w-5 flex-shrink-0 text-violet-400 dark:text-violet-500'
							/>
							<div>
								<p className='text-sm font-medium text-neutral-700 dark:text-neutral-200'>
									Sin vínculo establecido
								</p>
								<p className='mt-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
									Vincula manualmente con un producto que ya exista en
									WooCommerce. Si el producto aún no existe en la tienda, usa
									primero &quot;Publicación en tienda&quot; para crearlo.
								</p>
							</div>
						</div>

						<Tooltip text='Busca productos en WooCommerce para vincular con este producto del ERP'>
							<Button
								variant='solid'
								color='violet'
								size='sm'
								icon='HeroMagnifyingGlass'
								onClick={handleOpenSearch}
								isDisable={!canAct}
								aria-label='Buscar productos en WooCommerce para vincular'>
								Buscar y vincular
							</Button>
						</Tooltip>
					</div>
				)}

				{/* ---- Search & Link Modal ---- */}
				<Modal
					isOpen={searchOpen}
					setIsOpen={setSearchOpen}
					size='xl'
					isScrollable
					isCentered>
					<ModalHeader>
						<div className='flex items-center gap-2'>
							<Icon
								icon={
									selectedCandidate
										? 'HeroArrowsRightLeft'
										: 'HeroMagnifyingGlass'
								}
								className='h-5 w-5 text-violet-500'
							/>
							{selectedCandidate ? 'Comparar y vincular' : 'Buscar en WooCommerce'}
						</div>
					</ModalHeader>
					<ModalBody>
						{!selectedCandidate ? (
							<CandidatesList
								candidates={candidates}
								isLoading={candidatesQuery.isFetching}
								isError={candidatesQuery.isError}
								errorMessage={
									candidatesQuery.error
										? extractErrorMessage(candidatesQuery.error)
										: undefined
								}
								searchTerm={searchTerm}
								onSearchChange={setSearchTerm}
								onSearchSubmit={handleSearchSubmit}
								onSelect={handleSelectCandidate}
							/>
						) : (
							<CompareAndLink
								candidate={selectedCandidate}
								comparison={comparisonData as Record<string, unknown> | undefined}
								isComparing={compareQuery.isFetching}
								compareError={
									compareQuery.error
										? extractErrorMessage(compareQuery.error)
										: null
								}
								priceConflict={priceConflict}
								syncStock={syncStock}
								onSyncStockChange={setSyncStock}
								isLinking={linkMutation.isPending}
								onLink={handleLink}
								onBack={handleBackToList}
							/>
						)}
					</ModalBody>
					<ModalFooter>
						<Button
							variant='outline'
							color='zinc'
							size='sm'
							onClick={handleCloseSearch}
							aria-label='Cerrar'>
							Cancelar
						</Button>
						<div />
					</ModalFooter>
				</Modal>

				{/* ---- Unlink confirmation ---- */}
				<Modal
					isOpen={unlinkConfirmOpen}
					setIsOpen={setUnlinkConfirmOpen}
					size='sm'
					isCentered>
					<ModalHeader>
						<div className='flex items-center gap-2'>
							<Icon icon='HeroExclamationTriangle' className='h-5 w-5 text-red-500' />
							Confirmar desvinculación
						</div>
					</ModalHeader>
					<ModalBody>
						<div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-950/30'>
							<p className='text-sm font-medium text-red-800 dark:text-red-200'>
								¿Desvincular este producto de WooCommerce?
							</p>
							<p className='mt-1.5 text-sm text-red-700/80 dark:text-red-300/80'>
								Se romperá la relación con WooCommerce. La ficha en la tienda no se
								modificará ni eliminará.
							</p>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							variant='outline'
							color='zinc'
							size='sm'
							onClick={() => setUnlinkConfirmOpen(false)}
							aria-label='Cancelar desvinculación'>
							Cancelar
						</Button>
						<Button
							variant='solid'
							color='red'
							size='sm'
							icon='HeroLinkSlash'
							onClick={() => void handleUnlink()}
							isLoading={unlinkMutation.isPending}
							isDisable={unlinkMutation.isPending}
							aria-label='Confirmar desvinculación'>
							Sí, desvincular
						</Button>
					</ModalFooter>
				</Modal>
			</CardBody>
		</Card>
	);
};

// ============================================================================
// Sub-component: Candidates list with search
// ============================================================================

interface CandidatesListProps {
	candidates: WooCandidate[];
	isLoading: boolean;
	isError: boolean;
	errorMessage?: string;
	searchTerm: string;
	onSearchChange: (term: string) => void;
	onSearchSubmit: (e: React.FormEvent) => void;
	onSelect: (candidate: WooCandidate) => void;
}

const CandidatesList: React.FC<CandidatesListProps> = ({
	candidates,
	isLoading,
	isError,
	errorMessage,
	searchTerm,
	onSearchChange,
	onSearchSubmit,
	onSelect,
}) => (
	<div className='space-y-4'>
		<form onSubmit={onSearchSubmit} className='flex gap-2'>
			<div className='flex-1'>
				<Input
					id='woo-search'
					name='woo-search'
					type='text'
					placeholder='Buscar por nombre o SKU…'
					value={searchTerm}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						onSearchChange(e.target.value)
					}
					aria-label='Buscar productos en WooCommerce'
				/>
			</div>
			<Button
				type='submit'
				variant='solid'
				color='blue'
				size='default'
				icon='HeroMagnifyingGlass'
				isDisable={isLoading}
				aria-label='Ejecutar búsqueda'>
				Buscar
			</Button>
		</form>

		{isError && (
			<div className='rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300'>
				<Icon icon='HeroExclamationCircle' className='mr-1.5 inline h-4 w-4' />
				{errorMessage || 'Error al buscar candidatos en WooCommerce'}
			</div>
		)}

		{isLoading && (
			<div className='flex items-center justify-center py-8'>
				<Icon icon='HeroArrowPath' className='mr-2 h-5 w-5 animate-spin text-violet-500' />
				<span className='text-sm text-neutral-500'>Buscando en WooCommerce…</span>
			</div>
		)}

		{!isLoading && !isError && candidates.length === 0 && (
			<div className='rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-600'>
				<Icon
					icon='HeroInbox'
					className='mx-auto mb-2 h-10 w-10 text-neutral-300 dark:text-neutral-600'
				/>
				<p className='text-sm font-medium text-neutral-500 dark:text-neutral-400'>
					No se encontraron productos en WooCommerce
				</p>
				<p className='mt-1 text-xs text-neutral-400 dark:text-neutral-500'>
					Prueba con otro nombre o SKU.
				</p>
				<div className='mx-auto mt-3 max-w-sm rounded-md border border-blue-200 bg-blue-50 p-2.5 text-left dark:border-blue-500/30 dark:bg-blue-950/30'>
					<p className='text-xs font-medium text-blue-700 dark:text-blue-300'>
						<Icon icon='HeroLightBulb' className='mr-1 inline h-3.5 w-3.5' />
						Si el producto aún no existe en WooCommerce, usa la sección
						&quot;Publicación en tienda&quot; para crearlo primero.
					</p>
				</div>
			</div>
		)}

		{!isLoading && candidates.length > 0 && (
			<>
				<p className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
					{candidates.length} resultado{candidates.length !== 1 ? 's' : ''} encontrado
					{candidates.length !== 1 ? 's' : ''}
				</p>

				{/* Desktop table */}
				<div className='hidden overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 md:block'>
					<table
						className='w-full text-sm'
						role='grid'
						aria-label='Candidatos de WooCommerce'>
						<thead className='bg-neutral-100 dark:bg-neutral-800'>
							<tr className='text-left text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-300'>
								<th className='px-3 py-2.5'>Producto</th>
								<th className='px-3 py-2.5'>SKU</th>
								<th className='px-3 py-2.5 text-right'>Precio</th>
								<th className='px-3 py-2.5 text-right'>Stock</th>
								<th className='px-3 py-2.5 text-center'>Estado</th>
								<th className='px-3 py-2.5 text-center'>Acción</th>
							</tr>
						</thead>
						<tbody>
							{candidates.map((c, idx) => (
								<tr
									key={c.id ?? c.sku ?? idx}
									className='border-t border-neutral-200 transition-colors hover:bg-blue-50/40 dark:border-neutral-700 dark:hover:bg-blue-950/20'>
									<td className='max-w-[200px] truncate px-3 py-2.5 font-medium text-neutral-800 dark:text-neutral-100'>
										{c.name}
									</td>
									<td className='px-3 py-2.5 font-mono text-xs text-neutral-600 dark:text-neutral-400'>
										{c.sku || '—'}
									</td>
									<td className='px-3 py-2.5 text-right text-neutral-700 dark:text-neutral-300'>
										{formatPrice(c.price)}
									</td>
									<td className='px-3 py-2.5 text-right text-neutral-700 dark:text-neutral-300'>
										{c.stock_quantity ?? '—'}
									</td>
									<td className='px-3 py-2.5 text-center'>
										{c.already_linked ? (
											<Badge color='amber' variant='solid'>
												Ocupado
											</Badge>
										) : (
											<Badge color='emerald' variant='solid'>
												Disponible
											</Badge>
										)}
									</td>
									<td className='px-3 py-2.5 text-center'>
										<Tooltip
											text={
												c.already_linked
													? 'Este producto ya está vinculado a otro producto del ERP'
													: 'Seleccionar para comparar y vincular'
											}>
											<Button
												variant={c.already_linked ? 'outline' : 'solid'}
												color={c.already_linked ? 'zinc' : 'violet'}
												size='xs'
												icon='HeroLink'
												onClick={() => onSelect(c)}
												isDisable={c.already_linked}
												aria-label={`Seleccionar ${c.name}`}>
												Seleccionar
											</Button>
										</Tooltip>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Mobile cards */}
				<div className='space-y-2 md:hidden'>
					{candidates.map((c, idx) => (
						<div
							key={c.id ?? c.sku ?? idx}
							className='rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800/50'>
							<div className='mb-2 flex items-start justify-between gap-2'>
								<div className='min-w-0 flex-1'>
									<p className='truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100'>
										{c.name}
									</p>
									<p className='font-mono text-xs text-neutral-500 dark:text-neutral-400'>
										SKU: {c.sku || '—'}
									</p>
								</div>
								{c.already_linked ? (
									<Badge color='amber' variant='solid'>
										Ocupado
									</Badge>
								) : (
									<Badge color='emerald' variant='solid'>
										Disponible
									</Badge>
								)}
							</div>
							<div className='mb-3 grid grid-cols-2 gap-2 rounded-md border border-neutral-100 bg-neutral-50 p-2 text-xs dark:border-neutral-700 dark:bg-neutral-800'>
								<div>
									<span className='text-neutral-400 dark:text-neutral-500'>
										Precio
									</span>
									<p className='font-medium text-neutral-700 dark:text-neutral-200'>
										{formatPrice(c.price)}
									</p>
								</div>
								<div>
									<span className='text-neutral-400 dark:text-neutral-500'>
										Stock
									</span>
									<p className='font-medium text-neutral-700 dark:text-neutral-200'>
										{c.stock_quantity ?? '—'}
									</p>
								</div>
							</div>
							<Button
								variant={c.already_linked ? 'outline' : 'solid'}
								color={c.already_linked ? 'zinc' : 'violet'}
								size='xs'
								icon='HeroLink'
								className='w-full'
								onClick={() => onSelect(c)}
								isDisable={c.already_linked}
								aria-label={`Seleccionar ${c.name}`}>
								Seleccionar
							</Button>
						</div>
					))}
				</div>
			</>
		)}
	</div>
);

// ============================================================================
// Sub-component: Compare & Link view
// ============================================================================

interface CompareAndLinkProps {
	candidate: WooCandidate;
	comparison: Record<string, unknown> | undefined;
	isComparing: boolean;
	compareError: string | null;
	priceConflict: {
		erp_price: string | number | null;
		woo_price: string | number | null;
	} | null;
	syncStock: boolean;
	onSyncStockChange: (val: boolean) => void;
	isLinking: boolean;
	onLink: (priceResolution?: 'keep_erp' | 'keep_woo') => void;
	onBack: () => void;
}

const CompareAndLink: React.FC<CompareAndLinkProps> = ({
	candidate,
	comparison,
	isComparing,
	compareError,
	priceConflict,
	syncStock,
	onSyncStockChange,
	isLinking,
	onLink,
	onBack,
}) => {
	const comp = comparison as
		| {
				erp?: { name?: string; sku?: string; price?: string | number | null };
				woo?: { name?: string; sku?: string; price?: string | number | null };
				prices_match?: boolean;
				already_linked?: boolean;
		  }
		| undefined;

	const hasPriceConflict =
		priceConflict != null || (comp != null && comp.prices_match === false);
	const conflictErpPrice = priceConflict?.erp_price ?? comp?.erp?.price ?? null;
	const conflictWooPrice = priceConflict?.woo_price ?? comp?.woo?.price ?? null;

	return (
		<div className='space-y-4'>
			<button
				type='button'
				onClick={onBack}
				className='inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30'
				aria-label='Volver a la lista de candidatos'>
				<Icon icon='HeroArrowLeft' className='h-4 w-4' />
				Volver a resultados
			</button>

			{/* Selected candidate summary */}
			<div className='rounded-lg border border-violet-300 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-950/30'>
				<div className='mb-1 flex items-center gap-2'>
					<Icon icon='HeroShoppingBag' className='h-4 w-4 text-violet-500' />
					<span className='text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400'>
						Producto seleccionado de WooCommerce
					</span>
				</div>
				<p className='mt-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50'>
					{candidate.name}
				</p>
				<div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs'>
					{candidate.id != null && (
						<span className='text-neutral-600 dark:text-neutral-300'>
							ID: <span className='font-mono font-bold'>#{candidate.id}</span>
						</span>
					)}
					<span className='text-neutral-600 dark:text-neutral-300'>
						SKU: <span className='font-mono font-bold'>{candidate.sku || '—'}</span>
					</span>
					<span className='text-neutral-600 dark:text-neutral-300'>
						Precio: <span className='font-bold'>{formatPrice(candidate.price)}</span>
					</span>
				</div>
			</div>

			{/* Comparison loading */}
			{isComparing && (
				<div className='flex items-center justify-center py-6'>
					<Icon
						icon='HeroArrowPath'
						className='mr-2 h-5 w-5 animate-spin text-violet-500'
					/>
					<span className='text-sm text-neutral-500'>Comparando datos…</span>
				</div>
			)}

			{compareError && (
				<div className='rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300'>
					<Icon icon='HeroExclamationCircle' className='mr-1.5 inline h-4 w-4' />
					{compareError}
				</div>
			)}

			{comp && !isComparing && (
				<>
					{/* Comparison table */}
					<div>
						<p className='mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
							<Icon icon='HeroArrowsRightLeft' className='h-3.5 w-3.5' />
							Comparación de datos
						</p>
						<div className='overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700'>
							<table
								className='w-full text-sm'
								aria-label='Comparación ERP vs WooCommerce'>
								<thead className='bg-neutral-100 dark:bg-neutral-800'>
									<tr className='text-left text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-300'>
										<th className='px-3 py-2.5'>Campo</th>
										<th className='px-3 py-2.5'>
											<span className='inline-flex items-center gap-1'>
												<span className='inline-block h-2 w-2 rounded-full bg-blue-500' />
												ERP
											</span>
										</th>
										<th className='px-3 py-2.5'>
											<span className='inline-flex items-center gap-1'>
												<span className='inline-block h-2 w-2 rounded-full bg-violet-500' />
												WooCommerce
											</span>
										</th>
									</tr>
								</thead>
								<tbody>
									<tr className='border-t border-neutral-200 dark:border-neutral-700'>
										<td className='px-3 py-2.5 font-medium text-neutral-700 dark:text-neutral-200'>
											Nombre
										</td>
										<td className='px-3 py-2.5 text-neutral-600 dark:text-neutral-300'>
											{comp.erp?.name ?? '—'}
										</td>
										<td className='px-3 py-2.5 text-neutral-600 dark:text-neutral-300'>
											{comp.woo?.name ?? '—'}
										</td>
									</tr>
									<tr className='border-t border-neutral-200 dark:border-neutral-700'>
										<td className='px-3 py-2.5 font-medium text-neutral-700 dark:text-neutral-200'>
											SKU
										</td>
										<td className='px-3 py-2.5 font-mono text-xs text-neutral-600 dark:text-neutral-300'>
											{comp.erp?.sku ?? '—'}
										</td>
										<td className='px-3 py-2.5 font-mono text-xs text-neutral-600 dark:text-neutral-300'>
											{comp.woo?.sku ?? '—'}
										</td>
									</tr>
									<tr className='border-t border-neutral-200 dark:border-neutral-700'>
										<td className='px-3 py-2.5 font-medium text-neutral-700 dark:text-neutral-200'>
											Precio
										</td>
										<td className='px-3 py-2.5 text-neutral-600 dark:text-neutral-300'>
											{formatPrice(comp.erp?.price)}
										</td>
										<td
											className={`px-3 py-2.5 ${!comp.prices_match ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-neutral-600 dark:text-neutral-300'}`}>
											{formatPrice(comp.woo?.price)}
											{!comp.prices_match && (
												<Badge
													color='amber'
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
					</div>

					{comp.already_linked && (
						<div className='rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-950/30'>
							<div className='flex items-start gap-2'>
								<Icon
									icon='HeroExclamationTriangle'
									className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400'
								/>
								<p className='text-sm font-medium text-amber-800 dark:text-amber-200'>
									Este producto de WooCommerce ya está vinculado a otro producto
									del ERP.
								</p>
							</div>
						</div>
					)}
				</>
			)}

			{/* Price conflict resolution (from compare or link 409) */}
			{hasPriceConflict && (
				<div className='rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/30'>
					<div className='mb-3 flex items-start gap-2.5'>
						<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 dark:bg-amber-500/25'>
							<Icon
								icon='HeroExclamationTriangle'
								className='h-4 w-4 text-amber-600 dark:text-amber-400'
							/>
						</div>
						<div>
							<p className='text-sm font-bold text-amber-800 dark:text-amber-200'>
								Conflicto de precios
							</p>
							<p className='mt-0.5 text-xs text-amber-700 dark:text-amber-300'>
								ERP: {formatPrice(conflictErpPrice)} vs WooCommerce:{' '}
								{formatPrice(conflictWooPrice)}
							</p>
							<p className='mt-1.5 text-xs font-medium text-amber-800 dark:text-amber-200'>
								Elige qué precio mantener:
							</p>
						</div>
					</div>

					<Checkbox
						id='woo_link_sync_stock_conflict'
						name='woo_link_sync_stock_conflict'
						checked={syncStock}
						onChange={() => onSyncStockChange(!syncStock)}
						disabled={isLinking}
						dimension='sm'
						label='Sincronizar stock ERP → WooCommerce al vincular'
					/>

					<div className='mt-3 flex flex-wrap gap-2'>
						<Tooltip text='Conserva el precio del ERP y actualiza WooCommerce'>
							<Button
								variant='solid'
								color='blue'
								size='sm'
								icon='HeroArrowUpTray'
								onClick={() => onLink('keep_erp')}
								isDisable={isLinking}
								isLoading={isLinking}
								aria-label='Mantener precio del ERP'>
								Usar precio ERP
							</Button>
						</Tooltip>
						<Tooltip text='Adopta el precio de WooCommerce en el ERP'>
							<Button
								variant='solid'
								color='amber'
								size='sm'
								icon='HeroArrowDownTray'
								onClick={() => onLink('keep_woo')}
								isDisable={isLinking}
								isLoading={isLinking}
								aria-label='Mantener precio de WooCommerce'>
								Usar precio WooCommerce
							</Button>
						</Tooltip>
					</div>
				</div>
			)}

			{/* Link options & button (only when prices match) */}
			{!hasPriceConflict && (
				<div className='space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50'>
					<p className='text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
						Opciones de vinculación
					</p>

					<Checkbox
						id='woo_link_sync_stock'
						name='woo_link_sync_stock'
						checked={syncStock}
						onChange={() => onSyncStockChange(!syncStock)}
						disabled={isLinking}
						dimension='sm'
						label='Sincronizar stock ERP → WooCommerce al vincular'
					/>

					<Tooltip text='Establece el vínculo entre este producto del ERP y el seleccionado de WooCommerce'>
						<Button
							variant='solid'
							color='green'
							size='sm'
							icon='HeroLink'
							onClick={() => onLink()}
							isDisable={isLinking || isComparing || !!comp?.already_linked}
							isLoading={isLinking}
							aria-label='Vincular producto'>
							Vincular producto
						</Button>
					</Tooltip>
				</div>
			)}
		</div>
	);
};

export default WooManualLinkPanel;
