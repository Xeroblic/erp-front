import React from 'react';
import Label from '@/components/form/Label';
import Validation from '@/components/form/Validation';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import useTrasladoInterno from '@/pages/inventario/abastecimiento/TrasladosInternos/hooks/useTrasladoInterno';
import TrasladoItemsEditor from '@/pages/inventario/abastecimiento/TrasladosInternos/components/TrasladoItemsEditor';
import TrasladoResultCard from '@/pages/inventario/abastecimiento/TrasladosInternos/components/TrasladoResultCard';
import { locationToken } from '@/utils/inventoryLocation.util';

const TrasladoSession = ({ branchId, owner }: { branchId: number; owner: string }) => {
	const {
		formik,
		warehouses,
		destinationOptions,
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
	} = useTrasladoInterno(branchId, owner);

	// Con un resultado incierto (`canRetry`) el formulario se congela: el
	// reintento tiene que llevar exactamente el mismo comando y la misma clave.
	const frozen = idempotentWrite.isSubmitting || idempotentWrite.canRetry;
	const hasOrigin = Boolean(formik.values.from);

	return (
		<form onSubmit={formik.handleSubmit} className='space-y-4' noValidate>
			<Card>
				<CardHeader>
					<CardTitle>Mover stock dentro de la sucursal</CardTitle>
				</CardHeader>
				<CardBody className='space-y-4'>
					<Alert
						color='blue'
						variant='outline'
						icon='HeroInformationCircle'
						title='Esto no cambia el stock de la sucursal'>
						Un traslado sólo cambia dónde están las unidades: el total de la sucursal
						queda igual. La condición no cambia en un traslado y la procedencia se
						conserva. Para mover stock a <strong>otra sucursal</strong> usa el flujo de
						transferencias, no esta pantalla.
					</Alert>

					<div className='grid gap-4 md:grid-cols-2'>
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
									<option value={locationToken(null)}>Sin ubicación</option>
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
							<p className='text-xs text-zinc-500'>
								Sólo ubicaciones de esta sucursal. «Sin ubicación» es un destino
								válido.
							</p>
						</div>
					</div>

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
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Productos a mover</CardTitle>
					<p
						data-testid='traslado-preview'
						className='text-sm font-semibold tabular-nums'>
						{totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'} · Efecto neto en la
						sucursal: 0
					</p>
				</CardHeader>
				<CardBody className='space-y-3'>
					{!hasOrigin && (
						<p className='text-sm text-zinc-600 dark:text-zinc-300'>
							Elige primero el origen: los productos disponibles salen de esa
							ubicación.
						</p>
					)}
					{originError && (
						<Alert color='red' title='No pudimos cargar el stock del origen'>
							{originError}
						</Alert>
					)}
					{hasOrigin && !loadingOrigin && !originError && originRows.length === 0 && (
						<Alert color='amber' title='Sin stock en el origen'>
							Esta ubicación no tiene productos que trasladar.
						</Alert>
					)}
					<TrasladoItemsEditor
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

					{idempotentWrite.error && (
						<Alert color='red' title='No se pudo registrar el traslado'>
							<span role='alert'>{idempotentWrite.error.message}</span>
						</Alert>
					)}

					<div className='flex flex-wrap gap-3'>
						<Button
							type='submit'
							variant='solid'
							color='blue'
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
					</div>
				</CardBody>
			</Card>

			{result && <TrasladoResultCard result={result} onDismiss={clearResult} />}
		</form>
	);
};

const TrasladosInternosView = () => {
	const { branchId, subsidiaryId } = useCurrentBranch();
	const { authorize, isLoading } = useAuthorization();
	const userId = useAppSelector((state) => state.auth.user?.id);
	// Sección 15 del contrato: traslados y ajustes son `edit-product` sobre
	// ambas ubicaciones de la sucursal, no un permiso propio inventado.
	const canWrite = authorize({
		permission: 'edit-product',
		branchId,
		subsidiaryId,
		scope: 'access',
	});
	const owner = `${userId}:${subsidiaryId}:${branchId}`;

	let content;
	if (isLoading) content = <p role='status'>Comprobando acceso…</p>;
	else if (!branchId)
		content = (
			<Alert title='Selecciona una sucursal'>
				Necesitas una sucursal activa para mover su stock.
			</Alert>
		);
	else if (!canWrite)
		content = (
			<Alert color='amber' title='Sin permiso'>
				No tienes permiso para mover el stock de esta sucursal.
			</Alert>
		);
	else if (!INVENTORY_STOCK_USE_MOCKS)
		content = (
			<Alert title='Traslados no habilitados'>
				Los traslados internos aún no están habilitados en este entorno.
			</Alert>
		);
	// La sesión autorizada se monta con `key` ANTES de renderizar: un cambio de
	// usuario, filial o sucursal desmonta el formulario en vez de dejar que
	// pinte líneas y saldos de un contexto que ya no es el activo.
	else content = <TrasladoSession key={owner} owner={owner} branchId={branchId} />;

	return (
		<PageWrapper isProtectedRoute title='Traslados internos'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroArrowsRightLeft' />
					<span>Inventario / Traslados internos</span>
				</SubheaderLeft>
			</Subheader>
			<Container className='space-y-4'>
				{INVENTORY_STOCK_USE_MOCKS && (
					<Alert color='amber' title='Datos simulados'>
						Pantalla de demostración. Los traslados no afectan al inventario real.
					</Alert>
				)}
				{content}
			</Container>
		</PageWrapper>
	);
};

export default TrasladosInternosView;
