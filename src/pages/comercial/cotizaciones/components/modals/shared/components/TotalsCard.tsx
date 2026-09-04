import React, { useEffect } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import { FormQuotationValues } from '../types';
import { formatCurrency } from '../helpers';
import {
	QUOTATION_CARD_CLASSNAME,
	QUOTATION_MUTED_TEXT_CLASSNAME,
	QUOTATION_PANEL_CLASSNAME,
	QUOTATION_SUBTITLE_CLASSNAME,
	QUOTATION_VALUE_TEXT_CLASSNAME,
} from '../styles';
import QuotationField from './QuotationField';

interface TotalsCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void;
	IVA_RATE: number;
}

const TotalsCard: React.FC<TotalsCardProps> = ({ values, setFieldValue, IVA_RATE }) => {
	// Calcular totales automáticamente cuando cambien los items o porcentajes
	useEffect(() => {
		const items = values.items || [];
		const ivaMultiplier = IVA_RATE / 100;

		// Calcular subtotal (suma de precio * cantidad de todos los items)
		const subtotal = items.reduce((sum, item) => {
			const price = Number(item.unit_price) || 0;
			const quantity = Number(item.quantity) || 0;
			return sum + price * quantity;
		}, 0);

		// Calcular descuento
		const discountPercentage = Number(values.discount_percentage) || 0;
		const discountAmount = (subtotal * discountPercentage) / 100;

		// Calcular base neta global (subtotal - descuento)
		const taxableAmount = subtotal - discountAmount;

		const taxableItemsSubtotal = items.reduce((sum, item) => {
			if (!item.includes_tax) return sum;
			const price = Number(item.unit_price) || 0;
			const quantity = Number(item.quantity) || 0;
			return sum + price * quantity;
		}, 0);

		const discountedTaxableItemsAmount =
			taxableItemsSubtotal - (taxableItemsSubtotal * discountPercentage) / 100;

		// Calcular Recargo (Sobre el Neto)
		const surchargePercentage = Number(values.payment_surcharge_percentage) || 0;
		const surchargeAmount = (taxableAmount * surchargePercentage) / 100;

		const surchargeTaxableAmount =
			discountedTaxableItemsAmount > 0
				? (surchargeAmount * discountedTaxableItemsAmount) / taxableAmount
				: 0;

		const taxAmount =
			discountedTaxableItemsAmount * ivaMultiplier + surchargeTaxableAmount * ivaMultiplier;
		const hasTaxableItems = items.some((item) => Boolean(item.includes_tax));

		// Calcular total
		const total = taxableAmount + surchargeAmount + taxAmount;

		// Actualizar valores en el formulario
		setFieldValue('subtotal', subtotal, false);
		setFieldValue('discount_amount', discountAmount, false);
		setFieldValue('tax_amount', taxAmount, false);
		setFieldValue('tax_percentage', hasTaxableItems ? IVA_RATE : 0, false);
		setFieldValue('payment_surcharge_amount', surchargeAmount, false);
		setFieldValue('total_amount', total, false);
	}, [
		values.items,
		values.discount_percentage,
		values.payment_surcharge_percentage,
		setFieldValue,
		IVA_RATE,
	]);

	const summaryRows = [
		{ label: 'Subtotal neto', value: Number(values.subtotal ?? 0) },
		{ label: 'Descuento global', value: Number(values.discount_amount ?? 0) },
		{ label: 'Recargo', value: Number(values.payment_surcharge_amount ?? 0) },
		{ label: 'IVA', value: Number(values.tax_amount ?? 0) },
	];

	return (
		<Card className={QUOTATION_CARD_CLASSNAME}>
			<CardHeader className='pb-2'>
				<div>
					<CardTitle className='text-lg'>Resumen</CardTitle>
					<p className={QUOTATION_SUBTITLE_CLASSNAME}>
						Ajustes globales y total estimado de la cotización.
					</p>
				</div>
			</CardHeader>
			<CardBody className='grid grid-cols-1 gap-x-4 gap-y-3 2xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)]'>
				<div className='space-y-3'>
					<QuotationField name='discount_percentage' label='Descuento global (%)'>
						{() => (
							<Input
								id='discount_percentage'
								name='discount_percentage'
								type='number'
								min={0}
								max={100}
								placeholder='0'
								value={values.discount_percentage ?? 0}
								onChange={(e) =>
									setFieldValue('discount_percentage', Number(e.target.value))
								}
							/>
						)}
					</QuotationField>

					<div className={`${QUOTATION_PANEL_CLASSNAME} p-3`}>
						<Checkbox
							name='tax_percentage_toggle'
							checked={values.tax_percentage === IVA_RATE}
							onChange={() => undefined}
							label={`Calcula IVA por ítem (${IVA_RATE}%)`}
							dimension='sm'
							disabled
						/>
						<p className={`mt-1 text-xs ${QUOTATION_MUTED_TEXT_CLASSNAME}`}>
							El IVA se calcula sólo sobre los ítems con «Calcular IVA» marcado. El
							reajuste global se sigue aplicando sobre el neto total.
						</p>
					</div>

					{values.payment_surcharge_percentage > 0 && (
						<div className='rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10'>
							<QuotationField
								name='payment_surcharge_percentage'
								label='Recargo por Método de Pago %'>
								{() => (
									<Input
										id='payment_surcharge_percentage'
										name='payment_surcharge_percentage'
										type='number'
										min={0}
										placeholder='0'
										value={values.payment_surcharge_percentage ?? 0}
										onChange={(e) =>
											setFieldValue(
												'payment_surcharge_percentage',
												Number(e.target.value),
											)
										}
									/>
								)}
							</QuotationField>
							<p className='mt-2 text-xs text-amber-800 dark:text-amber-200'>
								Monto recargo:{' '}
								<strong>{formatCurrency(values.payment_surcharge_amount)}</strong>
							</p>
						</div>
					)}
				</div>

				<div className={`${QUOTATION_PANEL_CLASSNAME} p-4`}>
					<dl className='space-y-2'>
						{summaryRows.map((row) => (
							<div
								key={row.label}
								className='flex items-center justify-between gap-4 text-sm'>
								<dt className={QUOTATION_MUTED_TEXT_CLASSNAME}>{row.label}</dt>
								<dd className={QUOTATION_VALUE_TEXT_CLASSNAME}>
									{formatCurrency(row.value)}
								</dd>
							</div>
						))}
						<div className='flex items-center justify-between gap-4 border-t border-zinc-300 pt-2 text-base font-semibold text-zinc-900 dark:border-zinc-600 dark:text-white'>
							<dt>Total</dt>
							<dd>{formatCurrency(Number(values.total_amount ?? 0))}</dd>
						</div>
					</dl>
					<p
						className={`mt-3 border-t border-dashed border-zinc-300 pt-3 text-xs dark:border-zinc-600 ${QUOTATION_MUTED_TEXT_CLASSNAME}`}>
						Los montos definitivos se recalculan en el backend según los productos
						seleccionados. Esta sección sólo define los ajustes globales.
					</p>
				</div>
			</CardBody>
		</Card>
	);
};

export default TotalsCard;
