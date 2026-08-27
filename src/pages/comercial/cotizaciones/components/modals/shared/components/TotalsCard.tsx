import React, { useEffect } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import { FormQuotationValues } from '../types';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { formatCurrency } from '../helpers';

interface TotalsCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
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

	return (
		<Card
			rounded='rounded-2xl'
			className='dark:shadow-lg/10 border border-white/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5'>
			<CardHeader className='pb-2'>
				<CardHeaderChild className='w-full items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white'>
							<span className='flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-400/40 dark:bg-indigo-400/10 dark:text-indigo-200'>
								<Icon icon='DuoCalculator' className='text-xl' />
							</span>
							<span>Resumen</span>
						</CardTitle>
						<p className='text-xs text-gray-500 dark:text-gray-300'>
							Ajustes globales y total estimado.
						</p>
					</div>
					<Badge className='rounded-full bg-indigo-50 px-4 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-100'>
						Paso 4
					</Badge>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='space-y-3 pt-2'>
				<div className='grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]'>
					<div className='space-y-3'>
						<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
							Descuento Global %
						</p>
						<Input
							name='discount_percentage'
							type='number'
							placeholder='0'
							value={values.discount_percentage ?? 0}
							onChange={(e) =>
								setFieldValue('discount_percentage', Number(e.target.value))
							}
						/>
						<div className='rounded-2xl border border-indigo-100/70 bg-indigo-50/40 p-3 dark:border-indigo-400/20 dark:bg-indigo-400/5'>
							<Checkbox
								name='tax_percentage_toggle'
								checked={values.tax_percentage === IVA_RATE}
								onChange={() => undefined}
								label='IVA por ítem (19%)'
								color='indigo'
								dimension='sm'
								disabled
							/>
							<p className='text-[11px] text-indigo-900/80 dark:text-indigo-100/80'>
								El IVA se calcula solo sobre los ítems marcados con `Con IVA`. El
								reajuste global se sigue aplicando sobre el neto total.
							</p>
						</div>

						{values.payment_surcharge_percentage > 0 && (
							<div className='rounded-2xl border border-orange-100 bg-orange-50/70 p-3 dark:border-orange-400/20 dark:bg-orange-400/5'>
								<p className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-300'>
									Recargo por Método de Pago %
								</p>
								<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
									<Input
										name='payment_surcharge_percentage'
										type='number'
										placeholder='0'
										value={values.payment_surcharge_percentage ?? 0}
										onChange={(e) =>
											setFieldValue(
												'payment_surcharge_percentage',
												Number(e.target.value),
											)
										}
										className='sm:w-32'
									/>
									<div className='text-sm text-orange-700 dark:text-orange-200'>
										Monto recargo:{' '}
										<strong>
											{formatCurrency(values.payment_surcharge_amount)}
										</strong>
									</div>
								</div>
							</div>
						)}
					</div>

					<div className='border-t border-zinc-200 pt-2 dark:border-white/10 lg:border-l lg:border-t-0 lg:pl-6'>
						<div className='space-y-2'>
							<div className='flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-300'>
								<span>Subtotal Neto</span>
								<strong className='text-gray-900 dark:text-white'>
									{formatCurrency(Number(values.subtotal ?? 0))}
								</strong>
							</div>
							<div className='flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-300'>
								<span>Descuento Global</span>
								<strong className='text-gray-900 dark:text-white'>
									{formatCurrency(Number(values.discount_amount ?? 0))}
								</strong>
							</div>
							<div className='flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-300'>
								<span>Recargo</span>
								<strong className='text-gray-900 dark:text-white'>
									{formatCurrency(Number(values.payment_surcharge_amount ?? 0))}
								</strong>
							</div>
							<div className='flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-300'>
								<span>IVA</span>
								<strong className='text-gray-900 dark:text-white'>
									{formatCurrency(Number(values.tax_amount ?? 0))}
								</strong>
							</div>
							<div className='border-t border-zinc-200 pt-2 dark:border-white/10'>
								<div className='flex items-center justify-between gap-4 text-base font-semibold text-gray-900 dark:text-white'>
									<span>Total</span>
									<span>{formatCurrency(Number(values.total_amount ?? 0))}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='border-t border-dashed border-zinc-200 pt-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-300'>
					Los montos definitivos se recalculan en el backend según los productos
					seleccionados. Esta sección solo define los ajustes globales.
				</div>
			</CardBody>
		</Card>
	);
};

export default TotalsCard;
