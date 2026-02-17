import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Tooltip from '@/components/ui/Tooltip';
import { BATCH_STATUS_LABELS } from '@/pages/refactor-technical-review/components/constants/technicalReview.constants';
import { IBatch } from '@/interface/technicalReviews.interface';
import { TColors } from '@/types/colors.type';

// ─── Equipment icon map ────────────────────────────────────────
const equipmentIconMap: Record<string, string> = {
	notebook: 'HeroComputerDesktop',
	desktop: 'HeroServerStack',
	aio: 'HeroDeviceTablet',
	docking: 'HeroCpuChip',
	monitor: 'HeroTv',
};

export interface DetalleLoteProps {
	batch: IBatch | null;
	loading: boolean;
	updatingBatch: boolean;
	navigate: NavigateFunction;
	isEditingExpectedQty: boolean;
	expectedQtyDraft: string;
	setExpectedQtyDraft: (value: string) => void;
	expectedQtyError: string | null;
	setExpectedQtyError: (value: string | null) => void;
	handleStartEditingExpectedQty: () => void;
	handleCancelExpectedQty: () => void;
	handleSaveExpectedQty: () => void;
	expectedQty: number;
	receivedQty: number;
	completedQty: number;
	pendingQty: number;
	progressPercentage: number;
	statusColor: () => TColors;
}

const DetalleLoteVisual: React.FC<DetalleLoteProps> = ({
	batch,
	loading,
	updatingBatch,
	navigate,
	isEditingExpectedQty,
	expectedQtyDraft,
	setExpectedQtyDraft,
	expectedQtyError,
	setExpectedQtyError,
	handleStartEditingExpectedQty,
	handleCancelExpectedQty,
	handleSaveExpectedQty,
	expectedQty,
	receivedQty,
	completedQty,
	pendingQty,
	progressPercentage,
	statusColor,
}) => {
	// ── Loading state ──────────────────────────────────────────
	if (loading || !batch) {
		return (
			<PageWrapper name='detalle-lote' title='Detalle del Lote'>
				<Subheader>
					<SubheaderLeft>
						<Button
							variant='outline'
							onClick={() => navigate('/technical-reviews/lotes')}
							icon='HeroArrowLeft'
						/>
						<Badge className='text-2xl font-semibold'>Cargando lote...</Badge>
					</SubheaderLeft>
				</Subheader>
				<Container>
					<Card>
						<CardBody className='flex items-center justify-center py-16'>
							<Icon
								icon='HeroArrowPath'
								className='mr-3 h-6 w-6 animate-spin text-zinc-400'
							/>
							<span className='text-zinc-500'>Cargando información del lote…</span>
						</CardBody>
					</Card>
				</Container>
			</PageWrapper>
		);
	}

	// ── Render ──────────────────────────────────────────────────
	return (
		<PageWrapper name='detalle-lote' title={`Lote ${batch.code}`}>
			{/* ─── Header ──────────────────────────────────────── */}
			<Subheader>
				<SubheaderLeft>
					<Button
						variant='outline'
						onClick={() => navigate('/technical-reviews/lotes')}
						icon='HeroArrowLeft'
					/>
					<div className='flex flex-col gap-2'>
						<div className='flex flex-wrap items-center gap-3'>
							<h1 className='text-xl font-bold leading-tight text-zinc-900 dark:text-zinc-100 md:text-2xl'>
								Lote {batch.code}
							</h1>
							<Badge variant='solid' className='px-1' color={statusColor()}>
								{BATCH_STATUS_LABELS[
									String(
										batch.status,
									).toUpperCase() as keyof typeof BATCH_STATUS_LABELS
								] || batch.status}
							</Badge>
						</div>
						<div className='flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:gap-4'>
							<span className='flex items-center gap-1'>
								<Icon icon='HeroCalendar' className='h-3 w-3' />
								Creado el:{' '}
								<span className='font-semibold'>
									{batch.entry_date
										? new Date(batch.entry_date).toLocaleDateString('es-CL', {
												day: 'numeric',
												month: 'short',
												year: 'numeric',
											})
										: 'Sin fecha'}
								</span>
							</span>
							<span className='hidden text-zinc-300 sm:inline'>•</span>
							<span className='flex items-center gap-1'>
								<Icon icon='HeroCheckCircle' className='h-3 w-3' />
								Aprobado el:{' '}
								<span className='font-semibold'>
									{batch.review_date
										? new Date(batch.review_date).toLocaleDateString('es-CL', {
												day: 'numeric',
												month: 'short',
												year: 'numeric',
											})
										: '—'}
								</span>
							</span>
							<span className='hidden text-zinc-300 sm:inline'>•</span>
							<span className='flex items-center gap-1'>
								<Icon icon='HeroUser' className='h-3 w-3' />
								Por:{' '}
								<span className='font-semibold'>
									{batch.created_by?.name || 'Sistema'}
								</span>
							</span>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Tooltip text='Volver a la lista'>
						<Button
							variant='outline'
							icon='HeroListBullet'
							onClick={() => navigate('/technical-reviews/lotes')}>
							Lista de Lotes
						</Button>
					</Tooltip>
				</SubheaderRight>
			</Subheader>

			<Container className='w-11/12 space-y-6'>
				{/* ─── Metadata: Proveedor + Bodega ─────────────── */}
				<div className='grid gap-4 sm:grid-cols-2'>
					<Card className='border-l-4 border-blue-500 dark:border-blue-400'>
						<CardBody className='p-5'>
							<div className='mb-3 flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'>
									<Icon icon='HeroTruck' className='h-5 w-5' />
								</div>
								<h3 className='text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
									Cliente / Proveedor
								</h3>
							</div>
							<p className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
								{batch.customer_supplier?.name || 'No especificado'}
							</p>
							{batch.customer_supplier?.id && (
								<p className='mt-1 text-xs text-zinc-400'>
									ID: {batch.customer_supplier.id}
								</p>
							)}
						</CardBody>
					</Card>

					<Card className='border-l-4 border-purple-500 dark:border-purple-400'>
						<CardBody className='p-5'>
							<div className='mb-3 flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'>
									<Icon icon='HeroHomeModern' className='h-5 w-5' />
								</div>
								<h3 className='text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
									Bodega
								</h3>
							</div>
							<p className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
								{batch.warehouse?.name || 'No especificado'}
							</p>
							{batch.warehouse_id && (
								<p className='mt-1 text-xs text-zinc-400'>
									ID: {batch.warehouse_id}
								</p>
							)}
						</CardBody>
					</Card>
				</div>

				{/* ─── KPIs ─────────────────────────────────────── */}
				<Card>
					<CardHeader>
						<div className='flex items-center gap-3'>
							<div className='rounded-full bg-zinc-100 p-2 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
								<Icon icon='HeroChartBarSquare' className='h-5 w-5' />
							</div>
							<div>
								<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
									Estado del Lote
								</h3>
								<p className='text-xs text-zinc-500'>
									Resumen de cantidades y avance del lote.
								</p>
							</div>
						</div>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
							{/* Esperada (editable) */}
							<div className='rounded-xl bg-blue-500/30 p-5 hover:cursor-pointer hover:bg-blue-500/50 dark:bg-blue-950/40 dark:hover:bg-blue-700/50'>
								<div className='mb-2 flex items-center justify-between'>
									<span className='text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300'>
										Esperada
									</span>
									{!isEditingExpectedQty && (
										<button
											type='button'
											onClick={handleStartEditingExpectedQty}
											className='rounded-full p-1 text-blue-500 transition hover:bg-blue-100 focus:outline-none dark:hover:bg-blue-900/40'
											disabled={updatingBatch}>
											<Icon icon='HeroPencilSquare' className='h-4 w-4' />
										</button>
									)}
								</div>
								{isEditingExpectedQty ? (
									<>
										<Input
											name='expected_quantity'
											type='number'
											min={1}
											value={expectedQtyDraft}
											onChange={(e) => {
												setExpectedQtyDraft(e.target.value);
												if (expectedQtyError) setExpectedQtyError(null);
											}}
											className='text-center'
										/>
										{expectedQtyError && (
											<p className='mt-1 text-xs text-red-500'>
												{expectedQtyError}
											</p>
										)}
										<div className='mt-3 flex gap-2'>
											<Button
												size='sm'
												color='emerald'
												onClick={handleSaveExpectedQty}
												isDisable={updatingBatch}
												isLoading={updatingBatch}>
												Guardar
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={handleCancelExpectedQty}
												isDisable={updatingBatch}>
												Cancelar
											</Button>
										</div>
									</>
								) : (
									<div className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
										{expectedQty}
									</div>
								)}
							</div>

							{/* Recibida */}
							<div className='rounded-xl bg-indigo-500/30 p-5 hover:cursor-pointer hover:bg-indigo-500/50 dark:bg-indigo-950/40 dark:hover:bg-indigo-700/50'>
								<span className='text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300'>
									Recibida
								</span>
								<div className='mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400'>
									{receivedQty}
								</div>
							</div>

							{/* Completada */}
							<div className='rounded-xl bg-emerald-500/30 p-5 hover:cursor-pointer hover:bg-emerald-500/50 dark:bg-emerald-950/40 dark:hover:bg-emerald-700/50'>
								<span className='text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300'>
									Completada
								</span>
								<div className='mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400'>
									{completedQty}
								</div>
							</div>

							{/* Pendiente */}
							<div className='rounded-xl bg-amber-500/30 p-5 hover:cursor-pointer hover:bg-amber-500/50 dark:bg-amber-950/40 dark:hover:bg-amber-700/50'>
								<span className='text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300'>
									Pendiente
								</span>
								<div className='mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400'>
									{pendingQty}
								</div>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* ─── Progress Bar ─────────────────────────────── */}
				<Card>
					<CardBody className='p-5'>
						<div className='mb-3 flex items-center justify-between'>
							<span className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Progreso General
							</span>
							<Badge
								variant='solid'
								color={
									progressPercentage >= 100
										? 'emerald'
										: progressPercentage >= 50
											? 'amber'
											: 'blue'
								}>
								{progressPercentage}%
							</Badge>
						</div>
						<div className='h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700'>
							<div
								className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out'
								style={{ width: `${Math.min(progressPercentage, 100)}%` }}
							/>
						</div>
						<p className='mt-2 text-xs text-zinc-500'>
							{completedQty} de {expectedQty} equipos revisados
						</p>
					</CardBody>
				</Card>

				{/* ─── Distribución por Tipo ─────────────────────── */}
				{batch.items_summary?.by_equipment_type && (
					<Card>
						<CardHeader>
							<div className='flex items-center gap-3'>
								<div className='rounded-full bg-zinc-100 p-2 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
									<Icon icon='HeroCpuChip' className='h-5 w-5' />
								</div>
								<h3 className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
									Distribución por Tipo de Equipo
								</h3>
							</div>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
								{Object.entries(batch.items_summary.by_equipment_type).map(
									([type, count]) => (
										<div
											key={type}
											className='flex items-center gap-3 rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:hover:border-zinc-600'>
											<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
												<Icon
													icon={
														equipmentIconMap[type] ||
														'HeroComputerDesktop'
													}
													className='h-5 w-5'
												/>
											</div>
											<div>
												<div className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>
													{typeof count === 'object' &&
													count !== null &&
													'value' in count
														? (count as any).value
														: count}
												</div>
												<div className='text-xs capitalize text-zinc-500'>
													{type}
												</div>
											</div>
										</div>
									),
								)}
							</div>
						</CardBody>
					</Card>
				)}

				{/* ─── Notas ────────────────────────────────────── */}
				{batch.notes && (
					<Card>
						<CardBody className='p-5'>
							<div className='mb-3 flex items-center gap-2'>
								<Icon icon='HeroDocumentText' className='h-5 w-5 text-zinc-500' />
								<h3 className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
									Notas
								</h3>
							</div>
							<p className='whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400'>
								{batch.notes}
							</p>
						</CardBody>
					</Card>
				)}

				{/* ─── Metadata ─────────────────────────────────── */}
				<Card>
					<CardBody className='p-5'>
						<div className='grid gap-4 sm:grid-cols-3'>
							<div className='flex items-center gap-3'>
								<Icon icon='HeroCalendarDays' className='h-5 w-5 text-zinc-400' />
								<div>
									<p className='text-xs text-zinc-500'>Fecha de Entrada</p>
									<p className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
										{batch.entry_date
											? new Date(batch.entry_date).toLocaleDateString(
													'es-CL',
													{
														year: 'numeric',
														month: 'long',
														day: 'numeric',
													},
												)
											: '—'}
									</p>
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<Icon icon='HeroClock' className='h-5 w-5 text-zinc-400' />
								<div>
									<p className='text-xs text-zinc-500'>Creado</p>
									<p className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
										{batch.created_at
											? new Date(batch.created_at).toLocaleDateString(
													'es-CL',
													{
														year: 'numeric',
														month: 'short',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													},
												)
											: '—'}
									</p>
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<Icon icon='HeroArrowPath' className='h-5 w-5 text-zinc-400' />
								<div>
									<p className='text-xs text-zinc-500'>Última actualización</p>
									<p className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
										{batch.updated_at
											? new Date(batch.updated_at).toLocaleDateString(
													'es-CL',
													{
														year: 'numeric',
														month: 'short',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													},
												)
											: '—'}
									</p>
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default DetalleLoteVisual;
