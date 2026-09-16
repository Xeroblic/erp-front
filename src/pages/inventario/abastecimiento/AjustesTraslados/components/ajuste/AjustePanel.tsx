import React from 'react';
import Label from '@/components/form/Label';
import Validation from '@/components/form/Validation';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import useAjusteInventario from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useAjusteInventario';
import AjusteItemsEditor from '@/pages/inventario/abastecimiento/AjustesTraslados/components/ajuste/AjusteItemsEditor';
import AjusteResultCard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/ajuste/AjusteResultCard';
import StepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';
import type { IWizardStepConfig } from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';

export interface AjustePanelProps {
	branchId: number;
	subsidiaryId: number | null;
	owner: string;
}

const AJUSTE_STEP_CONFIG: readonly IWizardStepConfig[] = [
	{ key: 'location', label: 'Ubicación', icon: 'HeroMapPin' },
	{
		key: 'items',
		label: 'Productos',
		icon: 'HeroCube',
		hint: 'Cantidad positiva para sumar (ej. 3), negativa para restar (ej. -2). «Quedará» muestra el stock resultante.',
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
const AjustePanel = ({ branchId, subsidiaryId, owner }: AjustePanelProps) => {
	const {
		formik,
		locationOptions,
		products,
		stockRows,
		loadingStock,
		stockError,
		hasLocation,
		receiptOptions,
		originsFor,
		totalsFor,
		errorFor,
		setLocation,
		setRelatedReceipt,
		setItem,
		addItem,
		removeItem,
		idempotentWrite,
		result,
		clearResult,
		wizard,
		submit,
	} = useAjusteInventario(branchId, owner, subsidiaryId);

	const frozen = idempotentWrite.isSubmitting || idempotentWrite.canRetry;
	const hasLinkedReceipt = formik.values.relatedStockReceiptId !== '';

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
				<AjusteResultCard result={result} onDismiss={clearResult} />
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
								{idempotentWrite.canRetry ? 'Reintentar ajuste' : 'Aplicar ajuste'}
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
								«Sin ubicación» agrupa el stock que aún no tiene ubicación asignada.
							</p>
						</div>
					)}

					{wizard.stepKey === 'items' && (
						<div className='space-y-3'>
							{!hasLocation && (
								<p className='text-sm text-zinc-600 dark:text-zinc-300'>
									Selecciona la ubicación en el paso 1 para cargar el stock.
								</p>
							)}
							{stockError && (
								<Alert
									color='red'
									title='No pudimos cargar el stock de la ubicación'>
									{stockError}
								</Alert>
							)}
							{hasLocation &&
								!loadingStock &&
								!stockError &&
								stockRows.length === 0 && (
									<Alert color='amber' title='Sin stock en esta ubicación'>
										La ubicación no tiene saldo: sólo admite ingresos de
										unidades encontradas.
									</Alert>
								)}

							<AjusteItemsEditor
								items={formik.values.items}
								products={products}
								loadingStock={loadingStock}
								hasLocation={hasLocation}
								disabled={frozen}
								hasLinkedReceipt={hasLinkedReceipt}
								originsFor={originsFor}
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
								<li>
									El stock no puede quedar bajo cero. Si hay unidades reservadas,
									la confirmación informa cuántas quedan sin respaldo.
								</li>
							</ul>

							<div className='space-y-1 border-t border-zinc-200 pt-3 dark:border-zinc-700 md:max-w-md'>
								<Label htmlFor='ajuste-receipt'>
									Recepción enlazada (opcional)
								</Label>
								<Select
									id='ajuste-receipt'
									name='relatedStockReceiptId'
									disabled={frozen || receiptOptions.length === 0}
									value={
										formik.values.relatedStockReceiptId === ''
											? ''
											: String(formik.values.relatedStockReceiptId)
									}
									onChange={(event) =>
										setRelatedReceipt(
											event.target.value ? Number(event.target.value) : '',
										)
									}>
									<option value=''>Sin recepción enlazada</option>
									{receiptOptions.map((receiptId) => (
										<option key={receiptId} value={receiptId}>
											Recepción #{receiptId}
										</option>
									))}
								</Select>
								<p className='text-xs text-zinc-500'>
									{receiptOptions.length === 0
										? 'Para diferencias originadas en una recepción. Se habilita al elegir productos recibidos en una.'
										: 'Para diferencias originadas en una recepción. No la modifica, pero las líneas que restan deben descontar de ella.'}
								</p>
							</div>
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
										placeholder='Ej: Conteo físico: faltan dos unidades'
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

export default AjustePanel;
