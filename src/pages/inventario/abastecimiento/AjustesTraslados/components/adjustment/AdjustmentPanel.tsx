import React, { useEffect } from 'react';
import Label from '@/components/form/Label';
import Validation from '@/components/form/Validation';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import useInventoryAdjustment from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useInventoryAdjustment';
import AdjustmentItemsEditor from '@/pages/inventario/abastecimiento/AjustesTraslados/components/adjustment/AdjustmentItemsEditor';
import AdjustmentResultCard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/adjustment/AdjustmentResultCard';
import StepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';
import type { IWizardStepConfig } from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';
import type { IAjustesTrasladosPreselection } from '@/pages/inventario/abastecimiento/AjustesTraslados/types';

export interface AdjustmentPanelProps {
	branchId: number;
	subsidiaryId: number | null;
	owner: string;
	/** Ubicación y producto con que abre el asistente (de la URL). */
	preselection?: IAjustesTrasladosPreselection;
	/** Avisa si hay una escritura en curso o pendiente de reintento. */
	onBusyChange?: (busy: boolean) => void;
}

const AJUSTE_STEP_CONFIG: readonly IWizardStepConfig[] = [
	{ key: 'location', label: 'Ubicación', icon: 'HeroMapPin' },
	{
		key: 'items',
		label: 'Productos',
		icon: 'HeroCube',
		hint: 'Cantidad positiva para un ingreso por ajuste (ej. 3) y negativa para un egreso (ej. -2). «Stock resultante» muestra el saldo posterior al ajuste.',
	},
	{
		key: 'reason',
		label: 'Motivo y confirmación',
		icon: 'HeroClipboardDocumentCheck',
		hint: 'El motivo queda registrado en la auditoría del movimiento.',
	},
];

/**
 * Pestaña «Ajuste de inventario». La autorización, la sucursal y la bandera de
 * mocks las resuelve `AjustesTrasladosView` antes de montarla.
 *
 * El formulario se lee en tres pasos: ubicación del conteo, productos a
 * corregir y motivo. El motivo va al final porque se escribe mejor después de
 * ver las diferencias.
 */
const AdjustmentPanel = ({
	branchId,
	subsidiaryId,
	owner,
	preselection,
	onBusyChange,
}: AdjustmentPanelProps) => {
	const {
		formik,
		locationOptions,
		products,
		stockRows,
		loadingStock,
		stockError,
		hasLocation,
		totalsFor,
		errorFor,
		setLocation,
		setItem,
		addItem,
		removeItem,
		idempotentWrite,
		result,
		clearResult,
		wizard,
		submit,
	} = useInventoryAdjustment(branchId, owner, subsidiaryId, preselection);

	const frozen = idempotentWrite.isSubmitting || idempotentWrite.canRetry;

	useEffect(() => {
		onBusyChange?.(frozen);
		return () => onBusyChange?.(false);
	}, [frozen, onBusyChange]);
	const locationLabel =
		locationOptions.find((option) => option.value === formik.values.location)?.label ?? '';

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
				Corrige las diferencias entre el <strong>conteo físico</strong> y el stock
				registrado en el sistema.
			</p>

			{result ? (
				<AdjustmentResultCard result={result} onDismiss={clearResult} />
			) : (
				<StepWizard
					steps={AJUSTE_STEP_CONFIG}
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
								icon='HeroScale'
								isDisable={idempotentWrite.isSubmitting}
								isLoading={idempotentWrite.isSubmitting}>
								{idempotentWrite.canRetry
									? 'Reintentar ajuste'
									: 'Registrar ajuste'}
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
					{wizard.stepKey === 'location' && (
						<div className='space-y-1 md:max-w-md'>
							<Label htmlFor='ajuste-location'>Ubicación</Label>
							<Validation
								isValid={!formik.errors.location}
								isTouched={formik.touched.location}
								invalidFeedback={formik.errors.location}>
								<Select
									id='ajuste-location'
									name='location'
									disabled={frozen}
									value={formik.values.location}
									onChange={(event) => setLocation(event.target.value)}
									onBlur={formik.handleBlur}
									isValid={!formik.errors.location}
									isTouched={formik.touched.location}
									invalidFeedback={formik.errors.location}>
									<option value=''>Selecciona la ubicación…</option>
									{locationOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</Validation>
							<p className='text-xs text-zinc-500'>
								Todas las líneas del ajuste se registran en esta ubicación. «Sin
								ubicación» agrupa el stock que aún no tiene ubicación asignada.
							</p>
						</div>
					)}

					{wizard.stepKey === 'items' && (
						<div className='space-y-3'>
							{hasLocation ? (
								<p className='text-sm text-zinc-600 dark:text-zinc-300'>
									Ubicación: <strong>{locationLabel}</strong>
								</p>
							) : (
								<p className='text-sm text-zinc-600 dark:text-zinc-300'>
									Selecciona la ubicación en el paso 1 para cargar el stock.
								</p>
							)}
							{stockError && (
								<Alert
									color='red'
									title='No se pudo cargar el stock de la ubicación'>
									{stockError}
								</Alert>
							)}
							{hasLocation &&
								!loadingStock &&
								!stockError &&
								stockRows.length === 0 && (
									<Alert color='amber' title='Sin stock en esta ubicación'>
										La ubicación no registra saldo: sólo admite ingresos por
										ajuste.
									</Alert>
								)}

							<AdjustmentItemsEditor
								items={formik.values.items}
								products={products}
								loadingStock={loadingStock}
								hasLocation={hasLocation}
								disabled={frozen}
								totalsFor={totalsFor}
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

							<ul className='list-disc space-y-0.5 pl-5 text-xs text-zinc-500'>
								<li>
									<strong>Apto</strong>: disponible para la venta.{' '}
									<strong>No apto</strong>: no disponible para la venta.
								</li>
								<li>Los egresos se descuentan por orden de antigüedad (FIFO).</li>
								<li>
									El stock resultante no puede ser negativo. Si hay unidades
									reservadas, la confirmación informa cuántas quedan sin respaldo.
								</li>
							</ul>
						</div>
					)}

					{wizard.stepKey === 'reason' && (
						<div className='space-y-4'>
							<div className='space-y-1'>
								<Label htmlFor='ajuste-reason'>Motivo</Label>
								<Validation
									isValid={!formik.errors.reason}
									isTouched={formik.touched.reason}
									invalidFeedback={formik.errors.reason}>
									<Textarea
										id='ajuste-reason'
										name='reason'
										rows={2}
										disabled={frozen}
										value={formik.values.reason}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isValid={!formik.errors.reason}
										isTouched={formik.touched.reason}
										invalidFeedback={formik.errors.reason}
										placeholder='Ej: Diferencia detectada en conteo físico'
									/>
								</Validation>
							</div>
							<div className='space-y-1'>
								<Label htmlFor='ajuste-notes'>Notas (opcional)</Label>
								<Validation
									isValid={!formik.errors.notes}
									isTouched={formik.touched.notes}
									invalidFeedback={formik.errors.notes}>
									<Textarea
										id='ajuste-notes'
										name='notes'
										rows={2}
										disabled={frozen}
										value={formik.values.notes}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isValid={!formik.errors.notes}
										isTouched={formik.touched.notes}
										invalidFeedback={formik.errors.notes}
									/>
								</Validation>
							</div>

							{idempotentWrite.error && (
								<Alert color='red' title='No se pudo registrar el ajuste'>
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

export default AdjustmentPanel;
