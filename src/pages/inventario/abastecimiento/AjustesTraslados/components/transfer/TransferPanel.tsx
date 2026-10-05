import React, { useEffect } from 'react';
import Label from '@/components/form/Label';
import Validation from '@/components/form/Validation';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import useInternalTransfer from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useInternalTransfer';
import TransferItemsEditor from '@/pages/inventario/abastecimiento/AjustesTraslados/components/transfer/TransferItemsEditor';
import TransferResultCard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/transfer/TransferResultCard';
import StepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';
import type { IWizardStepConfig } from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';
import { locationToken } from '@/utils/inventoryLocation.util';
import type { IAjustesTrasladosPreselection } from '@/pages/inventario/abastecimiento/AjustesTraslados/types';

export interface TransferPanelProps {
	branchId: number;
	owner: string;
	/** Origen (`location`) y producto con que abre el asistente (de la URL). */
	preselection?: IAjustesTrasladosPreselection;
	/** Avisa si hay una escritura en curso o pendiente de reintento. */
	onBusyChange?: (busy: boolean) => void;
}

const TRASLADO_STEP_CONFIG: readonly IWizardStepConfig[] = [
	{
		key: 'route',
		label: 'Origen y destino',
		icon: 'HeroArrowsRightLeft',
		hint: 'Ubicaciones de la sucursal activa.',
	},
	{
		key: 'items',
		label: 'Productos',
		icon: 'HeroCube',
		hint: 'La condición no cambia en un traslado: las unidades conservan su condición de apto o no apto.',
	},
	{
		key: 'reason',
		label: 'Motivo y confirmación',
		icon: 'HeroClipboardDocumentCheck',
		hint: 'El motivo queda registrado en la auditoría del movimiento.',
	},
];

/**
 * Pestaña «Traslados internos». La autorización, la sucursal y la bandera de
 * mocks las resuelve `AjustesTrasladosView` antes de montarla.
 *
 * Se lee en tres pasos: origen y destino, productos, y motivo.
 */
const TransferPanel = ({ branchId, owner, preselection, onBusyChange }: TransferPanelProps) => {
	const {
		formik,
		warehouses,
		destinationOptions,
		summary,
		originRows,
		loadingOrigin,
		originError,
		balanceFor,
		errorFor,
		setOrigin,
		setItem,
		addItem,
		removeItem,
		totalUnits,
		idempotentWrite,
		result,
		clearResult,
		wizard,
		submit,
	} = useInternalTransfer(branchId, owner, preselection);

	// Con un resultado incierto (`canRetry`) el formulario se congela: el
	// reintento tiene que llevar exactamente el mismo comando y la misma clave.
	const frozen = idempotentWrite.isSubmitting || idempotentWrite.canRetry;

	useEffect(() => {
		onBusyChange?.(frozen);
		return () => onBusyChange?.(false);
	}, [frozen, onBusyChange]);
	const hasOrigin = Boolean(formik.values.from);

	return (
		<form
			className='space-y-4'
			noValidate
			onSubmit={(event) => {
				event.preventDefault();
				// Enter fuera del último paso avanza en vez de confirmar.
				void (wizard.isLastStep ? submit() : wizard.next());
			}}>
			<p className='text-sm text-zinc-600 dark:text-zinc-300'>
				Cambia la <strong>ubicación</strong> de productos dentro de la sucursal. El stock
				total de la sucursal no varía.
			</p>

			{result ? (
				<TransferResultCard result={result} onDismiss={clearResult} />
			) : (
				<StepWizard
					steps={TRASLADO_STEP_CONFIG}
					step={wizard.step}
					direction={wizard.direction}
					onStepClick={(index) => {
						void wizard.stepClick(index);
					}}
					onPrev={wizard.prev}
					onNext={() => {
						void wizard.next();
					}}
					finishActions={
						<>
							<Button
								type='submit'
								variant='solid'
								color='emerald'
								icon='HeroArrowsRightLeft'
								isDisable={idempotentWrite.isSubmitting}
								isLoading={idempotentWrite.isSubmitting}>
								{idempotentWrite.canRetry
									? 'Reintentar traslado'
									: 'Registrar traslado'}
							</Button>
							{idempotentWrite.canRetry && (
								<Button
									type='button'
									variant='outline'
									onClick={idempotentWrite.renewKey}>
									Descartar y corregir
								</Button>
							)}
						</>
					}>
					{wizard.stepKey === 'route' && (
						<div>
							<div className='grid gap-4 md:grid-cols-[1fr_auto_1fr]'>
								<div className='space-y-1'>
									<Label htmlFor='traslado-from'>Origen</Label>
									<Validation
										isValid={!formik.errors.from}
										isTouched={formik.touched.from}
										invalidFeedback={formik.errors.from}>
										<Select
											id='traslado-from'
											name='from'
											disabled={frozen}
											value={formik.values.from}
											onChange={(event) => setOrigin(event.target.value)}
											onBlur={formik.handleBlur}
											isValid={!formik.errors.from}
											isTouched={formik.touched.from}
											invalidFeedback={formik.errors.from}>
											<option value=''>Selecciona el origen…</option>
											<option value={locationToken(null)}>
												Sin ubicación
											</option>
											{warehouses.map((warehouse) => (
												<option
													key={warehouse.id}
													value={locationToken(warehouse.id)}>
													{warehouse.name}
												</option>
											))}
										</Select>
									</Validation>
								</div>
								{/* Replica la caja de cada campo (etiqueta + select con su borde
								    y padding) para que la flecha quede centrada con los selects. */}
								<div aria-hidden='true' className='hidden space-y-1 md:block'>
									<span className='mb-2 inline-block text-sm'>&nbsp;</span>
									<div className='flex items-center border-2 border-transparent py-1.5 text-base text-zinc-400'>
										<Icon icon='HeroArrowLongRight' className='h-6 w-6' />
									</div>
								</div>
								<div className='space-y-1'>
									<Label htmlFor='traslado-to'>Destino</Label>
									<Validation
										isValid={!formik.errors.to}
										isTouched={formik.touched.to}
										invalidFeedback={formik.errors.to}>
										<Select
											id='traslado-to'
											name='to'
											disabled={frozen}
											value={formik.values.to}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={!formik.errors.to}
											isTouched={formik.touched.to}
											invalidFeedback={formik.errors.to}>
											<option value=''>Selecciona el destino…</option>
											{destinationOptions.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</Select>
									</Validation>
								</div>
							</div>
							<p className='mt-2 text-xs text-zinc-500'>
								«Sin ubicación» agrupa el stock que aún no tiene ubicación asignada
								y es válido como origen o destino.
							</p>
						</div>
					)}

					{wizard.stepKey === 'items' && (
						<div className='space-y-3'>
							<p
								data-testid='traslado-preview'
								className='text-sm font-semibold tabular-nums'>
								Total a mover: {totalUnits}{' '}
								{totalUnits === 1 ? 'unidad' : 'unidades'}
							</p>
							{!hasOrigin && (
								<p className='text-sm text-zinc-600 dark:text-zinc-300'>
									Selecciona el origen en el paso 1 para cargar sus productos.
								</p>
							)}
							{originError && (
								<Alert color='red' title='No pudimos cargar el stock del origen'>
									{originError}
								</Alert>
							)}
							{hasOrigin &&
								!loadingOrigin &&
								!originError &&
								originRows.length === 0 && (
									<Alert color='amber' title='Sin stock en el origen'>
										Esta ubicación no tiene productos que trasladar.
									</Alert>
								)}
							<TransferItemsEditor
								items={formik.values.items}
								originRows={originRows}
								loadingOrigin={loadingOrigin}
								hasOrigin={hasOrigin}
								disabled={frozen}
								balanceFor={balanceFor}
								errorFor={errorFor}
								onChangeItem={setItem}
								onAddItem={addItem}
								onRemoveItem={removeItem}
							/>
							{typeof formik.errors.items === 'string' && formik.touched.items && (
								<p role='alert' className='text-sm text-red-600 dark:text-red-400'>
									{formik.errors.items}
								</p>
							)}
						</div>
					)}

					{wizard.stepKey === 'reason' && (
						<div className='space-y-4'>
							<section
								aria-labelledby='traslado-summary-title'
								data-testid='traslado-summary'
								className='rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800/50'>
								<h3
									id='traslado-summary-title'
									className='text-sm font-semibold text-zinc-900 dark:text-white'>
									Se moverán {totalUnits}{' '}
									{totalUnits === 1 ? 'unidad' : 'unidades'} de{' '}
									{summary.from ?? '—'} a {summary.to ?? '—'}
								</h3>
								<ul className='mt-2 space-y-1'>
									{summary.lines.map((line) => (
										<li
											key={line.key}
											className='flex items-baseline justify-between gap-3'>
											<span className='min-w-0 truncate' title={line.name}>
												{line.name}
												{line.sku && (
													<span className='ms-1 text-xs text-zinc-500'>
														({line.sku})
													</span>
												)}
												<span className='ms-2 text-xs text-zinc-500'>
													{line.condition === 'fit' ? 'Apto' : 'No apto'}
												</span>
											</span>
											<span className='shrink-0 font-semibold tabular-nums'>
												{line.quantity}
											</span>
										</li>
									))}
								</ul>
							</section>
							<div className='space-y-1'>
								<Label htmlFor='traslado-reason'>Motivo</Label>
								<Validation
									isValid={!formik.errors.reason}
									isTouched={formik.touched.reason}
									invalidFeedback={formik.errors.reason}>
									<Textarea
										id='traslado-reason'
										name='reason'
										rows={2}
										disabled={frozen}
										value={formik.values.reason}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isValid={!formik.errors.reason}
										isTouched={formik.touched.reason}
										invalidFeedback={formik.errors.reason}
										placeholder='Ej: Ubicar productos del conteo inicial'
									/>
								</Validation>
							</div>

							{idempotentWrite.error && (
								<Alert color='red' title='No se pudo registrar el traslado'>
									<span role='alert'>{idempotentWrite.error.message}</span>
								</Alert>
							)}
						</div>
					)}
				</StepWizard>
			)}
		</form>
	);
};

export default TransferPanel;
