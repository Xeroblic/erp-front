import React from 'react';
import { getIn, type FormikProps } from 'formik';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Validation from '@/components/form/Validation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type {
	ISaleFulfillmentOptionItem,
	ISaleStockShortageItem,
} from '@/interface/sales.interface';
import {
	sumAllocatedRows,
	toItemKey,
	toWarehouseKey,
	type ILocationAllocationRow,
	type ILocationAllocationValues,
} from '../../types';
import { formatShortageQuantities } from './SaleStockShortageAlert';

export interface ISaleLocationAllocationItemProps {
	option: ISaleFulfillmentOptionItem;
	/** «SKU — nombre» del ítem. */
	label: string;
	formik: FormikProps<ILocationAllocationValues>;
	disabled: boolean;
	/** Por qué hay que volver a elegir tras un rechazo del cierre. */
	reselectNotes?: string[];
	/** Errores del backend para el ítem (`errors` por `sale_item_id`). */
	rowErrors?: string[];
	/** Faltante del ítem en el 409 `SALE_STOCK_INSUFFICIENT`. */
	shortage?: ISaleStockShortageItem;
}

const MODE_BADGE: Record<
	ISaleFulfillmentOptionItem['allocation_mode'],
	{ label: string; color: 'emerald' | 'blue' | 'red' }
> = {
	automatic: { label: 'Ubicación única', color: 'emerald' },
	manual: { label: 'Elegir ubicación', color: 'blue' },
	blocked: { label: 'Sin stock suficiente', color: 'red' },
};

const fitLabel = (count: number): string => (count === 1 ? '1 apta' : `${count} aptas`);

const asMessage = (value: unknown): string | undefined =>
	typeof value === 'string' ? value : undefined;

const SaleLocationAllocationItem: React.FC<ISaleLocationAllocationItemProps> = ({
	option,
	label,
	formik,
	disabled,
	reselectNotes,
	rowErrors,
	shortage,
}) => {
	const itemPath = `items.${toItemKey(option.sale_item_id)}`;
	const rows: ILocationAllocationRow[] = getIn(formik.values, `${itemPath}.rows`) ?? [];
	const allocated = sumAllocatedRows(rows);
	const summaryError = getIn(formik.touched, `${itemPath}.rows`)
		? asMessage(getIn(formik.errors, `${itemPath}.summary`))
		: undefined;
	const hasIssue =
		option.allocation_mode === 'blocked' ||
		Boolean(shortage) ||
		(rowErrors?.length ?? 0) > 0 ||
		(reselectNotes?.length ?? 0) > 0;
	const badge = MODE_BADGE[option.allocation_mode];
	const totalFit = option.locations.reduce((sum, location) => sum + location.fit_quantity, 0);

	const setRows = (next: ILocationAllocationRow[]) => {
		void formik.setFieldValue(`${itemPath}.rows`, next);
	};

	const addRow = () => {
		const used = new Set(rows.map((row) => row.warehouseKey));
		const free = option.locations.find(
			(location) => !used.has(toWarehouseKey(location.warehouse_id)),
		);
		setRows([
			...rows,
			{ warehouseKey: free ? toWarehouseKey(free.warehouse_id) : '', quantity: '' },
		]);
	};

	return (
		<div
			role='group'
			aria-label={label}
			className={`rounded-lg border bg-white/80 p-3 shadow-sm dark:bg-zinc-900/60 ${
				hasIssue
					? 'border-red-400 dark:border-red-700'
					: 'border-zinc-200 dark:border-zinc-700'
			}`}>
			<div className='flex flex-wrap items-start justify-between gap-2'>
				<div className='min-w-0 space-y-1'>
					<p className='break-words text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
						{label}
					</p>
					<p className='text-xs text-zinc-600 dark:text-zinc-400'>
						Cantidad: <span className='font-semibold'>{option.quantity_required}</span>
					</p>
				</div>
				<div className='flex flex-wrap items-center justify-end gap-1'>
					<Badge variant='outline' color={badge.color} className='px-2 py-1 text-[11px]'>
						{badge.label}
					</Badge>
					{shortage && (
						<Badge
							variant='solid'
							color='red'
							className='whitespace-nowrap px-2 py-1 text-[11px] text-white'>
							{formatShortageQuantities(shortage)}
						</Badge>
					)}
				</div>
			</div>

			{reselectNotes && reselectNotes.length > 0 && (
				<ul
					className='mt-2 space-y-0.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
					aria-label='Ubicaciones a elegir de nuevo'>
					{reselectNotes.map((note) => (
						<li key={note}>{note}</li>
					))}
				</ul>
			)}

			{rowErrors && rowErrors.length > 0 && (
				<ul className='mt-2 space-y-0.5 text-xs text-red-600 dark:text-red-400'>
					{rowErrors.map((message) => (
						<li key={message}>{message}</li>
					))}
				</ul>
			)}

			{option.allocation_mode === 'automatic' && (
				<p className='mt-2 flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300'>
					<Icon icon='HeroMapPin' className='h-4 w-4 shrink-0' />
					<span>
						Sale de «{option.locations[0]?.name ?? 'Sin ubicación'}», la única ubicación
						con stock.
					</span>
				</p>
			)}

			{option.allocation_mode === 'blocked' && (
				<div className='mt-2 space-y-1 text-xs text-zinc-700 dark:text-zinc-300'>
					<p className='font-semibold text-red-700 dark:text-red-300'>
						La sucursal no tiene stock suficiente: el ítem pide{' '}
						{option.quantity_required} y hay {totalFit} entre todas sus ubicaciones.
					</p>
					<p>
						No se puede cerrar la venta así. Traslada stock desde otra sucursal,
						registra la entrada que falta o corrige la venta.
					</p>
				</div>
			)}

			{option.allocation_mode === 'manual' && (
				<div className='mt-3 space-y-2'>
					{rows.map((row, index) => {
						const rowPath = `${itemPath}.rows.${index}`;
						const locationError = getIn(formik.touched, `${rowPath}.warehouseKey`)
							? asMessage(getIn(formik.errors, `${rowPath}.warehouseKey`))
							: undefined;
						const quantityError = getIn(formik.touched, `${rowPath}.quantity`)
							? asMessage(getIn(formik.errors, `${rowPath}.quantity`))
							: undefined;
						return (
							// Las filas no tienen id propio y dos pueden compartir ubicación
							// mientras se corrigen: el índice es la única clave estable.
							// eslint-disable-next-line react/no-array-index-key
							<div key={index} className='flex flex-wrap items-start gap-2'>
								<div className='min-w-[12rem] flex-1'>
									<Validation
										isValid={!locationError}
										isTouched={Boolean(locationError)}
										invalidFeedback={locationError}>
										<Select
											name={`${rowPath}.warehouseKey`}
											aria-label={`Ubicación ${index + 1} de ${label}`}
											disabled={disabled}
											value={row.warehouseKey}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={!locationError}
											isTouched={Boolean(locationError)}
											invalidFeedback={locationError}>
											<option value='' disabled>
												Elige una ubicación
											</option>
											{option.locations.map((location) => (
												<option
													key={toWarehouseKey(location.warehouse_id)}
													value={toWarehouseKey(location.warehouse_id)}>
													{location.name} ·{' '}
													{fitLabel(location.fit_quantity)}
												</option>
											))}
										</Select>
									</Validation>
								</div>
								<div className='w-28'>
									<Validation
										isValid={!quantityError}
										isTouched={Boolean(quantityError)}
										invalidFeedback={quantityError}>
										<Input
											name={`${rowPath}.quantity`}
											aria-label={`Cantidad de la ubicación ${index + 1} de ${label}`}
											type='number'
											min={1}
											step={1}
											inputMode='numeric'
											disabled={disabled}
											value={row.quantity}
											onChange={(event) => {
												void formik.setFieldValue(
													`${rowPath}.quantity`,
													event.target.value === ''
														? ''
														: Number(event.target.value),
												);
											}}
											onBlur={formik.handleBlur}
											isValid={!quantityError}
											isTouched={Boolean(quantityError)}
											invalidFeedback={quantityError}
										/>
									</Validation>
								</div>
								<Button
									type='button'
									variant='outline'
									color='red'
									icon='HeroTrash'
									isDisable={disabled || rows.length === 1}
									aria-label={`Quitar la ubicación ${index + 1} de ${label}`}
									onClick={() => setRows(rows.filter((_, i) => i !== index))}
								/>
							</div>
						);
					})}

					<div className='flex flex-wrap items-center justify-between gap-2'>
						<Button
							type='button'
							variant='outline'
							color='blue'
							size='sm'
							icon='HeroPlus'
							isDisable={disabled || rows.length >= option.locations.length}
							onClick={addRow}>
							Agregar ubicación
						</Button>
						<span
							className={`text-xs tabular-nums ${
								allocated === option.quantity_required
									? 'text-zinc-600 dark:text-zinc-400'
									: 'font-semibold text-red-600 dark:text-red-400'
							}`}>
							Asignado {allocated} de {option.quantity_required}
						</span>
					</div>

					{summaryError && (
						<p role='alert' className='text-xs text-red-600 dark:text-red-400'>
							{summaryError}
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default SaleLocationAllocationItem;
