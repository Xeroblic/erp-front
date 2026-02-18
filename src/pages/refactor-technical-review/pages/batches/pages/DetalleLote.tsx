import React from 'react';
import { useDetalleLote } from '@/pages/refactor-technical-review/pages/batches/components/hooks/detallehook';
import DetalleLoteVisual from '@/pages/refactor-technical-review/pages/batches/components/content/detalleLote';
import Spinner from '@/components/ui/Spinner';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Icon from '@/components/icon/Icon';
import Container from '@/components/layouts/Container/Container';
import { BATCH_STATUS_LABELS } from '@/pages/refactor-technical-review/components/constants/technicalReview.constants';
import QuickEntryModal from '@/pages/refactor-technical-review/pages/batches/components/modals/QuickEntryModal';
import MissingSerialModal from '@/pages/refactor-technical-review/pages/batches/components/modals/MissingSerialModal';
import ListReview from '@/pages/refactor-technical-review/pages/batches/components/tables/ListReview';
import PrintLabel from '@/pages/refactor-technical-review/components/PrintLabel';

const DetalleLote: React.FC = () => {
	const hookProps = useDetalleLote();

	if (hookProps.loading) {
		return (
			<PageWrapper name='detalle-lote' title='Detalle del Lote'>
				<Subheader>
					<SubheaderLeft>
						<Button
							variant='outline'
							onClick={() => hookProps.navigate('/technical-reviews/lotes')}
							icon='HeroArrowLeft'
						/>
						<Badge className='text-2xl font-semibold'>Cargando lote...</Badge>
					</SubheaderLeft>
				</Subheader>
				<Container>
					<div className='flex items-center justify-center py-16'>
						<Spinner nombre='Cargando información del lote…' />
					</div>
				</Container>
			</PageWrapper>
		);
	}

	if (!hookProps.batch) {
		return (
			<PageWrapper name='detalle-lote' title='Detalle del Lote'>
				<Subheader>
					<SubheaderLeft>
						<Button
							variant='outline'
							onClick={() => hookProps.navigate('/technical-reviews/lotes')}
							icon='HeroArrowLeft'
						/>
						<Badge className='text-2xl font-semibold'>Error</Badge>
					</SubheaderLeft>
				</Subheader>
				<Container>
					<div className='flex items-center justify-center p-10 text-gray-500'>
						No se encontró información para este lote.
					</div>
				</Container>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper name='detalle-lote' title={`Lote ${hookProps.batch.code}`} isProtectedRoute={true}>
			<Subheader>
				<SubheaderLeft>
					<Button
						variant='outline'
						onClick={() => hookProps.navigate('/technical-reviews/lotes')}
						icon='HeroArrowLeft'
					/>
					<div className='flex flex-col gap-2'>
						<div className='flex flex-wrap items-center gap-3'>
							<h1 className='text-xl font-bold leading-tight text-zinc-900 dark:text-zinc-100 md:text-2xl'>
								Lote {hookProps.batch.code}
							</h1>
							<Badge variant='solid' className='px-1' color={hookProps.statusColor()}>
								{BATCH_STATUS_LABELS[
									String(
										hookProps.batch.status,
									).toUpperCase() as keyof typeof BATCH_STATUS_LABELS
								] || hookProps.batch.status}
							</Badge>
						</div>
						<div className='flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:gap-4'>
							<span className='flex items-center gap-1'>
								<Icon icon='HeroCalendar' className='h-3 w-3' />
								Creado el:{' '}
								<span className='font-semibold'>
									{hookProps.batch.entry_date
										? new Date(hookProps.batch.entry_date).toLocaleDateString(
												'es-CL',
												{
													day: 'numeric',
													month: 'short',
													year: 'numeric',
												},
											)
										: 'Sin fecha'}
								</span>
							</span>
							<span className='hidden text-zinc-300 sm:inline'>•</span>
							<span className='flex items-center gap-1'>
								<Icon icon='HeroCheckCircle' className='h-3 w-3' />
								Aprobado el:{' '}
								<span className='font-semibold'>
									{hookProps.batch.review_date
										? new Date(hookProps.batch.review_date).toLocaleDateString(
												'es-CL',
												{
													day: 'numeric',
													month: 'short',
													year: 'numeric',
												},
											)
										: '—'}
								</span>
							</span>
							<span className='hidden text-zinc-300 sm:inline'>•</span>
							<span className='flex items-center gap-1'>
								<Icon icon='HeroUser' className='h-3 w-3' />
								Por:{' '}
								<span className='font-semibold'>
									{hookProps.batch.created_by?.name || 'Sistema'}
								</span>
							</span>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex items-center rounded-lg border border-gray-200 bg-gray-300/90 p-1 dark:border-gray-700 dark:bg-gray-800'>
						<Tooltip text='Ingreso de series rapido'>
							<Button
								size='sm'
								variant={hookProps.operationMode === 'entry' ? 'solid' : 'default'}
								color={hookProps.operationMode === 'entry' ? 'blue' : 'gray'}
								onClick={() => hookProps.setOperationMode('entry')}>
								<Icon icon='HeroBolt' className='mr-1 h-4 w-4' /> Ingreso
							</Button>
						</Tooltip>

						<Tooltip text='Impresión'>
							<Button
								size='sm'
								variant={hookProps.operationMode === 'print' ? 'solid' : 'default'}
								color={hookProps.operationMode === 'print' ? 'orange' : 'gray'}
								onClick={() => hookProps.setOperationMode('print')}>
								<Icon icon='HeroPrinter' className='mr-1 h-4 w-4' /> Impresión
							</Button>
						</Tooltip>
					</div>

					<Button
						variant='outline'
						color='emerald'
						onClick={() =>
							hookProps.navigate(
								`/technical-reviews/batches/${hookProps.batch?.id}/items/create`,
							)
						}>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4 text-white' />
						Registrar Serie
					</Button>
				</SubheaderRight>
			</Subheader>

			{hookProps.updatingBatch ? (
				<div className='flex flex-col items-center justify-center p-10'>
					<p className='text-lg font-bold text-red-500'>Error al cargar el lote</p>
					<p className='text-gray-600'>Por favor, intente nuevamente más tarde.</p>
				</div>
			) : (
				<>
					<DetalleLoteVisual {...hookProps} />
					<Container className='mt-6'>
						<ListReview batchId={hookProps.batch!.id} activeTab={hookProps.activeTab} />
					</Container>
				</>
			)}

			<QuickEntryModal
				isOpen={hookProps.isQuickEntryOpen}
				onClose={() => hookProps.handleQuickEntryModalToggle(false)}
				onSubmit={hookProps.handleQuickEntrySubmit}
				serial={hookProps.quickEntrySerial}
				setSerial={hookProps.setQuickEntrySerial}
				equipmentType={hookProps.quickEntryType}
				setEquipmentType={hookProps.setQuickEntryType}
				error={hookProps.quickEntryError}
				setError={hookProps.setQuickEntryError}
				success={hookProps.quickEntrySuccess}
				setSuccess={hookProps.setQuickEntrySuccess}
				isLoading={hookProps.creatingItem}
				inputRef={hookProps.quickEntryInputRef as React.RefObject<HTMLInputElement>}
				keepFocus={hookProps.keepQuickEntryFocus}
				isTypeSelectorFocusedRef={hookProps.isTypeSelectorFocusedRef}
			/>

			<MissingSerialModal
				isOpen={hookProps.isMissingSerialModalOpen}
				onCancel={hookProps.handleMissingSerialCancel}
				onConfirm={hookProps.handleMissingSerialConfirm}
				missingSerial={hookProps.missingSerial}
			/>

			<PrintLabel
				item={hookProps.selectedItemForPrint}
				isOpen={hookProps.isPrintModalOpen}
				onClose={hookProps.handleClosePrintModal}
				autoPrint={true}
			/>
		</PageWrapper>
	);
};

export default DetalleLote;
