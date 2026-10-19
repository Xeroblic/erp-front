import React, { useCallback, useEffect, useState } from 'react';
import Label from '@/components/form/Label';
import Validation from '@/components/form/Validation';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { MULTI_LOCATION_NOT_ENABLED_REASON } from '@/utils/procurementErrors.util';
import useInventoryAdjustment from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useInventoryAdjustment';
import useAdjustmentWarehouses from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useAdjustmentWarehouses';
import type { IWarehouseCompact } from '@/interface/procurement.interface';
import AdjustmentItemsEditor from '@/pages/inventario/abastecimiento/AjustesTraslados/components/adjustment/AdjustmentItemsEditor';
import AdjustmentResultCard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/adjustment/AdjustmentResultCard';
import StepWizard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';
import type { IWizardStepConfig } from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';
import {
	AJUSTE_STEPS,
	unattributedFromContext,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/types';
import type { IAjustesTrasladosPreselection } from '@/pages/inventario/abastecimiento/AjustesTraslados/types';

export interface AdjustmentPanelProps {
	branchId: number;
	subsidiaryId: number | null;
	owner: string;
	/**
	 * Etapa 2 de la filial: se elige la ubicación. En la etapa 1 (o mientras no
	 * se conoce) el ajuste queda fijo en «Sin ubicación». Se lee al montar.
	 */
	multiLocation?: boolean;
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
const AdjustmentForm = ({
	branchId,
	subsidiaryId,
	owner,
	multiLocation = false,
	preselection,
	onBusyChange,
	warehouses,
}: AdjustmentPanelProps & { warehouses: readonly IWarehouseCompact[] }) => {
	const {
		formik,
		locationOptions,
		products,
		productSearch,
		stockRows,
		loadingStock,
		stockError,
		retryStock,
		hasLocation,
		totalsFor,
		errorFor,
		serverLineErrorCount,
		shortage,
		setLocation,
		setItem,
		addItem,
		removeItem,
		idempotentWrite,
		result,
		clearResult,
		wizard,
		submit,
	} = useInventoryAdjustment(
		branchId,
		owner,
		subsidiaryId,
		preselection,
		multiLocation,
		warehouses,
	);

	const frozen = idempotentWrite.isSubmitting || idempotentWrite.canRetry;
	const writeError = idempotentWrite.error;
	const stockRejected = writeError?.code === 'INSUFFICIENT_LOCATION_STOCK';
	const unattributed = stockRejected ? unattributedFromContext(writeError.context) : 0;
	const unattributedNotice = unattributed > 0 && (
		<p>
			Hay {unattributed}{' '}
			{unattributed === 1
				? 'unidad sin procedencia registrada'
				: 'unidades sin procedencia registrada'}
			. Se regularizan automáticamente cada 15 minutos: vuelve a intentarlo más tarde.
		</p>
	);
	// Respaldo si la bandera no coincide con la etapa real: el mismo ajuste
	// responde lo mismo, así que no se ofrece reenviarlo hasta cambiar la ubicación.
	const singleLocation = writeError?.code === 'MULTI_LOCATION_NOT_ENABLED';

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
								isDisable={idempotentWrite.isSubmitting || singleLocation}
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
					{/* Una sola ubicación (etapa 1): el ajuste va siempre a «Sin ubicación». */}
					{wizard.stepKey === 'location' && !multiLocation && (
						<div className='space-y-1 md:max-w-md'>
							<p className='text-sm text-zinc-600 dark:text-zinc-300'>
								Ubicación: <strong>{locationLabel}</strong>
							</p>
							<p className='text-xs text-zinc-500'>
								La sucursal opera con una sola ubicación: todo el ajuste se registra
								en «Sin ubicación».
							</p>
						</div>
					)}
					{wizard.stepKey === 'location' && multiLocation && (
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
									<div className='flex flex-wrap items-center gap-3'>
										<span>{stockError}</span>
										<Button
											variant='outline'
											color='red'
											size='sm'
											icon='HeroArrowPath'
											onClick={retryStock}>
											Reintentar
										</Button>
									</div>
								</Alert>
							)}
							{/* El 409 con la línea identificada trae al usuario acá: el
							    aviso del lote viaja con él. */}
							{shortage && writeError && (
								<Alert color='red' title='No se pudo registrar el ajuste'>
									<div role='alert' className='space-y-1'>
										<p>{writeError.message}</p>
										<p>
											No se registró ninguna línea del ajuste: corrige la
											línea marcada y vuelve a confirmarlo.
										</p>
										{unattributedNotice}
									</div>
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
								productSearch={productSearch}
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
								<li>El stock resultante no puede ser negativo.</li>
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

							{writeError && (
								<Alert color='red' title='No se pudo registrar el ajuste'>
									<div role='alert' className='space-y-1'>
										<p>{writeError.message}</p>
										{stockRejected && (
											<p>No se registró ninguna línea del ajuste.</p>
										)}
										{singleLocation && (
											<p>
												{MULTI_LOCATION_NOT_ENABLED_REASON} Registra el
												ajuste en «Sin ubicación».
											</p>
										)}
										{serverLineErrorCount > 0 && (
											<div className='flex flex-wrap items-center gap-3'>
												<span>
													{serverLineErrorCount === 1
														? 'Una línea tiene errores: está marcada en «Productos».'
														: `${serverLineErrorCount} líneas tienen errores: están marcadas en «Productos».`}
												</span>
												<Button
													variant='outline'
													color='red'
													size='sm'
													icon='HeroArrowUturnLeft'
													onClick={() => {
														void wizard.stepClick(
															AJUSTE_STEPS.indexOf('items'),
														);
													}}>
													Revisar productos
												</Button>
											</div>
										)}
										{unattributedNotice}
									</div>
								</Alert>
							)}
						</div>
					)}
				</StepWizard>
			)}
		</form>
	);
};

const AdjustmentPanel = ({
	branchId,
	subsidiaryId,
	owner,
	multiLocation = false,
	preselection,
	onBusyChange,
}: AdjustmentPanelProps) => {
	const catalog = useAdjustmentWarehouses(branchId, multiLocation, owner);
	const [unlocatedFallback, setUnlocatedFallback] = useState<string | null>(null);
	const [fallbackBusy, setFallbackBusy] = useState(false);
	const onFallbackBusyChange = useCallback(
		(busy: boolean) => {
			setFallbackBusy(busy);
			onBusyChange?.(busy);
		},
		[onBusyChange],
	);
	if (catalog.status === 'loading') return <p role='status'>Cargando bodegas de la sucursal…</p>;
	if (catalog.status === 'ready')
		return (
			<AdjustmentForm
				key={catalog.key}
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				owner={owner}
				multiLocation={multiLocation}
				preselection={preselection}
				onBusyChange={onBusyChange}
				warehouses={catalog.warehouses}
			/>
		);
	// Reintentar con el ajuste «Sin ubicación» abierto lo reemplazaría al resolver
	// y perdería su borrador o su comprobante: primero hay que cerrarlo.
	const isFallbackOpen = unlocatedFallback === catalog.key;
	return (
		<div className='space-y-4'>
			<Alert color='amber' variant='outline' title='No pudimos cargar las bodegas'>
				<p>{catalog.message}</p>
				<div className='mt-3 flex flex-wrap gap-2'>
					<Button variant='outline' isDisable={isFallbackOpen} onClick={catalog.retry}>
						Reintentar bodegas
					</Button>
					{/* Claves propias: el guard de clic del botón recién usado no bloquea al otro. */}
					{isFallbackOpen ? (
						<Button
							key='close-unlocated'
							variant='outline'
							isDisable={fallbackBusy}
							onClick={() => setUnlocatedFallback(null)}>
							Cerrar ajuste sin ubicación
						</Button>
					) : (
						<Button
							key='open-unlocated'
							variant='outline'
							onClick={() => setUnlocatedFallback(catalog.key)}>
							Ajustar solo Sin ubicación
						</Button>
					)}
				</div>
				{isFallbackOpen && (
					<p className='mt-2 text-sm'>
						Para volver a cargar las bodegas, cierra primero el ajuste sin ubicación.
					</p>
				)}
			</Alert>
			{isFallbackOpen && (
				<AdjustmentForm
					key={`${catalog.key}:unlocated`}
					branchId={branchId}
					subsidiaryId={subsidiaryId}
					owner={owner}
					multiLocation={false}
					onBusyChange={onFallbackBusyChange}
					preselection={undefined}
					warehouses={[]}
				/>
			)}
		</div>
	);
};

export default AdjustmentPanel;
