import React from 'react';
import Label from '@/components/form/Label';
import Validation from '@/components/form/Validation';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import useAjusteInventario from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useAjusteInventario';
import AjusteItemsEditor from '@/pages/inventario/abastecimiento/AjustesTraslados/components/ajuste/AjusteItemsEditor';
import AjusteResultCard from '@/pages/inventario/abastecimiento/AjustesTraslados/components/ajuste/AjusteResultCard';

export interface AjustePanelProps {
	branchId: number;
	subsidiaryId: number | null;
	owner: string;
}

/**
 * Pestaña «Ajuste de inventario». La autorización, la sucursal y la bandera de
 * mocks las resuelve `AjustesTrasladosView` antes de montarla.
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
	} = useAjusteInventario(branchId, owner, subsidiaryId);

	const frozen = idempotentWrite.isSubmitting || idempotentWrite.canRetry;
	const hasLinkedReceipt = formik.values.relatedStockReceiptId !== '';

	return (
		<form onSubmit={formik.handleSubmit} className='space-y-4' noValidate>
			<Card>
				<CardHeader>
					<CardTitle>Ajuste por conteo o corrección</CardTitle>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid gap-4 md:grid-cols-2'>
						<div className='space-y-1'>
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
								«Sin ubicación» es una ubicación real de la sucursal, no un vacío.
							</p>
						</div>
						<div className='space-y-1'>
							<Label htmlFor='ajuste-receipt'>Recepción enlazada (opcional)</Label>
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
									? 'Aparecen las recepciones que respaldan los productos elegidos abajo.'
									: 'Enlazar no reescribe la recepción: cada egreso pasa a exigir un origen suyo.'}
							</p>
						</div>
					</div>

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
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Diferencias a aplicar</CardTitle>
				</CardHeader>
				<CardBody className='space-y-3'>
					{!hasLocation && (
						<p className='text-sm text-zinc-600 dark:text-zinc-300'>
							Elige primero la ubicación: el saldo de cada línea es el de ahí.
						</p>
					)}
					{stockError && (
						<Alert color='red' title='No pudimos cargar el stock de la ubicación'>
							{stockError}
						</Alert>
					)}
					{hasLocation && !loadingStock && !stockError && stockRows.length === 0 && (
						<Alert color='amber' title='Sin stock en esta ubicación'>
							Ningún producto tiene saldo acá: sólo se pueden registrar unidades
							encontradas, no egresos.
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

					<p className='text-xs text-zinc-500'>
						Un ajuste no puede dejar el físico ni una condición bajo cero. Sí puede
						dejar el disponible de la sucursal por debajo de lo reservado: ese faltante
						se muestra en la confirmación, no se oculta ni se trunca en cero.
					</p>

					{idempotentWrite.error && (
						<Alert color='red' title='No se pudo registrar el ajuste'>
							<span role='alert'>{idempotentWrite.error.message}</span>
						</Alert>
					)}

					<div className='flex flex-wrap gap-3'>
						<Button
							type='submit'
							variant='solid'
							color='blue'
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
					</div>
				</CardBody>
			</Card>

			{result && <AjusteResultCard result={result} onDismiss={clearResult} />}
		</form>
	);
};

export default AjustePanel;
