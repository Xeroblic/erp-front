import React, { FC, FocusEventHandler, ChangeEventHandler, useId } from 'react';
import classNames from 'classnames';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import type { TCostEntryBasis } from '@/interface/procurement.interface';
import { previewCostBreakdown } from '@/utils/procurementCost.util';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import { COST_ENTRY_BASIS_OPTIONS, normalizeCostInput } from './costEntry.schema';

/**
 * Entrada de costo de compra del contrato de abastecimiento.
 *
 * Son **dos** campos: monto y base neto/bruto. Y nada más. El IVA, el neto
 * derivado, el bruto derivado y el costo efectivo no se digitan ni se envían —
 * el contrato los calcula y los persiste en el backend, y rechaza que el cliente
 * los mande.
 *
 * La previsualización de abajo es exactamente eso: ayuda mientras se escribe. Lo
 * que queda registrado es el `cost` que devuelve el servidor, que se muestra con
 * `CostBlock`.
 */

export interface ICostInputProps {
	/** Nombre Formik del monto (ej. `unit_cost` o `items[0].unit_cost`). */
	amountName: string;
	/** Nombre Formik de la base (ej. `unit_cost_basis`). */
	basisName: string;
	amountValue: string;
	basisValue: TCostEntryBasis | '';
	onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
	onBlur: FocusEventHandler<HTMLInputElement | HTMLSelectElement>;
	/** Error del monto ya resuelto por el caller (`touched ? errors : undefined`). */
	amountError?: string;
	/** Error de la base ya resuelto por el caller. */
	basisError?: string;
	label?: string;
	currencyCode?: string;
	disabled?: boolean;
	/** Oculta la previsualización local donde el espacio no da. */
	showPreview?: boolean;
	className?: string;
}

const CostInput: FC<ICostInputProps> = ({
	amountName,
	basisName,
	amountValue,
	basisValue,
	onChange,
	onBlur,
	amountError,
	basisError,
	label = 'Costo unitario',
	currencyCode = 'CLP',
	disabled = false,
	showPreview = true,
	className,
}) => {
	const generatedId = useId();
	const amountId = `${generatedId}-monto`;
	const basisId = `${generatedId}-base`;
	const amountErrorId = `${amountId}-error`;
	const basisErrorId = `${basisId}-error`;
	const previewId = `${generatedId}-preview`;

	const preview =
		basisValue === ''
			? null
			: previewCostBreakdown(normalizeCostInput(amountValue), basisValue);

	return (
		<fieldset
			data-component-name='Procurement/CostInput'
			className={classNames('min-w-0', className)}>
			<legend className='sr-only'>{label}</legend>

			<div className='flex flex-wrap items-end gap-3'>
				<div className='min-w-[10rem] grow'>
					<Label htmlFor={amountId}>{label}</Label>
					<Input
						id={amountId}
						name={amountName}
						type='text'
						inputMode='decimal'
						autoComplete='off'
						placeholder='0,00'
						value={amountValue}
						onChange={onChange}
						onBlur={onBlur}
						disabled={disabled}
						isTouched={amountError !== undefined}
						isValid={amountError === undefined}
						invalidFeedback={amountError}
						aria-invalid={amountError !== undefined}
						aria-describedby={
							classNames(
								amountError !== undefined && amountErrorId,
								preview !== null && showPreview && previewId,
							) || undefined
						}
					/>
					{amountError !== undefined && (
						<p id={amountErrorId} role='alert' className='mt-2 text-xs text-red-500/70'>
							{amountError}
						</p>
					)}
				</div>

				<div className='w-36'>
					<Label htmlFor={basisId}>Base</Label>
					<Select
						id={basisId}
						name={basisName}
						value={basisValue}
						onChange={onChange}
						onBlur={onBlur}
						disabled={disabled}
						isTouched={basisError !== undefined}
						isValid={basisError === undefined}
						invalidFeedback={basisError}
						aria-invalid={basisError !== undefined}
						aria-describedby={basisError !== undefined ? basisErrorId : undefined}>
						<option value=''>Selecciona</option>
						{COST_ENTRY_BASIS_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
					{basisError !== undefined && (
						<p id={basisErrorId} role='alert' className='mt-2 text-xs text-red-500/70'>
							{basisError}
						</p>
					)}
				</div>
			</div>

			{showPreview && preview !== null && (
				<p
					id={previewId}
					className='mt-2 text-xs text-zinc-500 dark:text-zinc-400'
					data-component-name='Procurement/CostInput/Preview'>
					{/* Previsualización, no dato registrado: el desglose definitivo
					    es el que devuelve el servidor tras guardar. */}
					<span className='font-medium'>Vista previa</span>
					{` (IVA ${preview.vat_rate_percent}%): neto `}
					{formatDecimalAmount(preview.net_unit_amount, currencyCode)}
					{' · IVA '}
					{formatDecimalAmount(preview.vat_unit_amount, currencyCode)}
					{' · bruto '}
					{formatDecimalAmount(preview.gross_unit_amount, currencyCode)}. El desglose
					definitivo lo calcula el servidor al guardar.
				</p>
			)}
		</fieldset>
	);
};

export default CostInput;
