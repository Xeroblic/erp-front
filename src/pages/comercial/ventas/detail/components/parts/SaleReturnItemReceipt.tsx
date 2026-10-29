import React from 'react';
import { getIn, type FormikProps } from 'formik';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Validation from '@/components/form/Validation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ISaleReturnItem } from '@/interface/sales.interface';
import type { IStockReceiptWarehouse } from '@/interface/procurement.interface';
import {
	UNLOCATED_KEY,
	sumAllocatedRows,
	toItemKey,
	toWarehouseKey,
	type IReturnAllocationRow,
	type IReturnReceiptValues,
	type IReturnSerialRow,
} from '../../types';
import { EMPTY_RETURN_ROW, describeReturnProduct } from '../../utils/saleReturnReceipt';
import { UNLOCATED_NAME } from '../../utils/locationAllocation';

export interface ISaleReturnItemReceiptProps {
	item: ISaleReturnItem;
	formik: FormikProps<IReturnReceiptValues>;
	/** Bodegas activas de la sucursal a la que vuelve el ítem. */
	warehouses: IStockReceiptWarehouse[];
	/** Nombre de esa sucursal, si se conoce. */
	branchName: string | null;
	disabled: boolean;
	/** Errores del backend con ruta `items.N…` de este ítem. */
	errors?: string[];
}

const asMessage = (value: unknown): string | undefined =>
	typeof value === 'string' ? value : undefined;

/** Error de un campo, sólo si ya se tocó. */
const fieldError = (formik: FormikProps<IReturnReceiptValues>, path: string) =>
	getIn(formik.touched, path) ? asMessage(getIn(formik.errors, path)) : undefined;

interface IFieldProps {
	formik: FormikProps<IReturnReceiptValues>;
	path: string;
	label: string;
	disabled: boolean;
}

const ConditionSelect: React.FC<IFieldProps & { value: string }> = ({
	formik,
	path,
	label,
	disabled,
	value,
}) => {
	const error = fieldError(formik, path);
	return (
		<Validation isValid={!error} isTouched={Boolean(error)} invalidFeedback={error}>
			<Select
				name={path}
				aria-label={label}
				disabled={disabled}
				value={value}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
				isValid={!error}
				isTouched={Boolean(error)}
				invalidFeedback={error}>
				<option value='fit'>Apta</option>
				<option value='unfit'>No apta</option>
			</Select>
		</Validation>
	);
};

const ReasonInput: React.FC<IFieldProps & { value: string }> = ({
	formik,
	path,
	label,
	disabled,
	value,
}) => {
	const error = fieldError(formik, path);
	return (
		<Validation isValid={!error} isTouched={Boolean(error)} invalidFeedback={error}>
			<Input
				name={path}
				aria-label={label}
				placeholder='¿Por qué no es apta?'
				maxLength={500}
				disabled={disabled}
				value={value}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
				isValid={!error}
				isTouched={Boolean(error)}
				invalidFeedback={error}
			/>
		</Validation>
	);
};

const WarehouseSelect: React.FC<
	IFieldProps & {
		value: string;
		warehouses: IStockReceiptWarehouse[];
		/** Texto de la opción `null`: «Sin ubicación» o, en una serie, conservar su bodega. */
		nullLabel: string;
		withPlaceholder: boolean;
	}
> = ({ formik, path, label, disabled, value, warehouses, nullLabel, withPlaceholder }) => {
	const error = fieldError(formik, path);
	return (
		<Validation isValid={!error} isTouched={Boolean(error)} invalidFeedback={error}>
			<Select
				name={path}
				aria-label={label}
				disabled={disabled}
				value={value}
				onChange={formik.handleChange}
				onBlur={formik.handleBlur}
				isValid={!error}
				isTouched={Boolean(error)}
				invalidFeedback={error}>
				{withPlaceholder && (
					<option value='' disabled>
						Elige una ubicación
					</option>
				)}
				<option value={UNLOCATED_KEY}>{nullLabel}</option>
				{warehouses.map((warehouse) => (
					<option key={warehouse.id} value={toWarehouseKey(warehouse.id)}>
						{warehouse.name}
					</option>
				))}
			</Select>
		</Validation>
	);
};

/**
 * Recepción de un ítem de la devolución. Sin serie, la cantidad se reparte en partes con
 * ubicación y condición, y debe sumar lo esperado. Con serie, cada serie lleva su bodega
 * (o conserva la suya) y su condición. Lo no apto siempre pide motivo.
 */
const SaleReturnItemReceipt: React.FC<ISaleReturnItemReceiptProps> = ({
	item,
	formik,
	warehouses,
	branchName,
	disabled,
	errors,
}) => {
	const label = describeReturnProduct(item);
	const itemPath = `items.${toItemKey(item.sale_item_id)}`;
	const rows: IReturnAllocationRow[] = getIn(formik.values, `${itemPath}.rows`) ?? [];
	const serials: IReturnSerialRow[] = getIn(formik.values, `${itemPath}.serials`) ?? [];
	const received = sumAllocatedRows(rows);
	const summaryError = getIn(formik.touched, `${itemPath}.rows`)
		? asMessage(getIn(formik.errors, `${itemPath}.summary`))
		: undefined;
	const hasIssue = (errors?.length ?? 0) > 0;

	const setRows = (next: IReturnAllocationRow[]) => {
		void formik.setFieldValue(`${itemPath}.rows`, next);
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
						Vuelven: <span className='font-semibold'>{item.quantity_expected}</span>
						{branchName ? ` · a ${branchName}` : ''}
					</p>
				</div>
				<Badge
					variant='outline'
					color={item.serial_tracking ? 'violet' : 'blue'}
					className='px-2 py-1 text-[11px]'>
					{item.serial_tracking ? 'Con serie' : 'Sin serie'}
				</Badge>
			</div>

			{hasIssue && (
				<ul
					role='alert'
					className='mt-2 space-y-0.5 text-xs text-red-600 dark:text-red-400'>
					{errors?.map((message) => (
						<li key={message}>{message}</li>
					))}
				</ul>
			)}
			{item.branch_id === null && !item.serial_tracking && (
				<p className='mt-2 text-xs text-zinc-600 dark:text-zinc-400'>
					El ítem no tiene sucursal. Elige al menos una bodega de recepción; las demás
					partes pueden quedar sin ubicación en esa misma sucursal.
				</p>
			)}

			{item.serial_tracking ? (
				<div className='mt-3 space-y-2'>
					{serials.map((serial, index) => {
						const serialPath = `${itemPath}.serials.${index}`;
						return (
							<div
								key={serial.serialNumber}
								className='flex flex-wrap items-start gap-2 border-t border-zinc-100 pt-2 first:border-t-0 first:pt-0 dark:border-zinc-800'>
								<span className='w-32 shrink-0 break-all pt-2 font-mono text-xs text-zinc-800 dark:text-zinc-200'>
									{serial.serialNumber}
								</span>
								<div className='min-w-[11rem] flex-1'>
									<WarehouseSelect
										formik={formik}
										path={`${serialPath}.warehouseKey`}
										label={`Bodega de la serie ${serial.serialNumber}`}
										disabled={disabled}
										value={serial.warehouseKey}
										warehouses={warehouses}
										nullLabel='Conservar su bodega'
										withPlaceholder={false}
									/>
								</div>
								<div className='w-32'>
									<ConditionSelect
										formik={formik}
										path={`${serialPath}.condition`}
										label={`Condición de la serie ${serial.serialNumber}`}
										disabled={disabled}
										value={serial.condition}
									/>
								</div>
								{serial.condition === 'unfit' && (
									<div className='min-w-[12rem] flex-1 basis-full sm:basis-auto'>
										<ReasonInput
											formik={formik}
											path={`${serialPath}.reason`}
											label={`Motivo de la serie ${serial.serialNumber}`}
											disabled={disabled}
											value={serial.reason}
										/>
									</div>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<div className='mt-3 space-y-2'>
					{rows.map((row, index) => {
						const rowPath = `${itemPath}.rows.${index}`;
						const quantityError = fieldError(formik, `${rowPath}.quantity`);
						const position = `${index + 1} de ${label}`;
						return (
							// Las partes no tienen id propio y dos pueden coincidir mientras se
							// corrigen: el índice es la única clave estable.
							// eslint-disable-next-line react/no-array-index-key
							<div key={index} className='flex flex-wrap items-start gap-2'>
								<div className='min-w-[11rem] flex-1'>
									<WarehouseSelect
										formik={formik}
										path={`${rowPath}.warehouseKey`}
										label={`Ubicación de la parte ${position}`}
										disabled={disabled}
										value={row.warehouseKey}
										warehouses={warehouses}
										nullLabel={UNLOCATED_NAME}
										withPlaceholder
									/>
								</div>
								<div className='w-24'>
									<Validation
										isValid={!quantityError}
										isTouched={Boolean(quantityError)}
										invalidFeedback={quantityError}>
										<Input
											name={`${rowPath}.quantity`}
											aria-label={`Cantidad de la parte ${position}`}
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
								<div className='w-32'>
									<ConditionSelect
										formik={formik}
										path={`${rowPath}.condition`}
										label={`Condición de la parte ${position}`}
										disabled={disabled}
										value={row.condition}
									/>
								</div>
								<Button
									type='button'
									variant='outline'
									color='red'
									icon='HeroTrash'
									isDisable={disabled || rows.length === 1}
									aria-label={`Quitar la parte ${position}`}
									onClick={() => setRows(rows.filter((_, i) => i !== index))}
								/>
								{row.condition === 'unfit' && (
									<div className='basis-full'>
										<ReasonInput
											formik={formik}
											path={`${rowPath}.reason`}
											label={`Motivo de la parte ${position}`}
											disabled={disabled}
											value={row.reason}
										/>
									</div>
								)}
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
							isDisable={disabled}
							onClick={() => setRows([...rows, { ...EMPTY_RETURN_ROW }])}>
							Agregar parte
						</Button>
						<span
							className={`text-xs tabular-nums ${
								received === item.quantity_expected
									? 'text-zinc-600 dark:text-zinc-400'
									: 'font-semibold text-red-600 dark:text-red-400'
							}`}>
							Recibido {received} de {item.quantity_expected}
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

export default SaleReturnItemReceipt;
