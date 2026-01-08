import React, { useEffect } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import { FormQuotationValues } from '../types';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

interface TotalsCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
	IVA_RATE: number;
}

const TotalsCard: React.FC<TotalsCardProps> = ({ values, setFieldValue, IVA_RATE }) => {
	// Calcular totales automáticamente cuando cambien los items o porcentajes
	useEffect(() => {
		const items = values.items || [];

		// Calcular subtotal (suma de precio * cantidad de todos los items)
		const subtotal = items.reduce((sum, item) => {
			const price = Number(item.unit_price) || 0;
			const quantity = Number(item.quantity) || 0;
			return sum + price * quantity;
		}, 0);

		// Calcular descuento
		const discountPercentage = Number(values.discount_percentage) || 0;
		const discountAmount = (subtotal * discountPercentage) / 100;

		// Calcular base imponible (subtotal - descuento)
		const taxableAmount = subtotal - discountAmount;

		// Calcular impuesto
		const taxPercentage = Number(values.tax_percentage) || 0;
		const taxAmount = (taxableAmount * taxPercentage) / 100;

		// Calcular total
		const total = taxableAmount + taxAmount;

		// Actualizar valores en el formulario
		setFieldValue('subtotal_amount', subtotal, false);
		setFieldValue('discount_amount', discountAmount, false);
		setFieldValue('tax_amount', taxAmount, false);
		setFieldValue('total_amount', total, false);
	}, [values.items, values.discount_percentage, values.tax_percentage, setFieldValue]);

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
							Ajusta descuentos y decide si la cotización llevará IVA.
						</p>
					</div>
					<Badge className='rounded-full bg-indigo-50 px-4 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-100'>
						Paso 4
					</Badge>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='space-y-5 pt-2'>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div className='rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-inner dark:border-white/10 dark:bg-white/5 dark:shadow-none'>
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
					</div>

					<div className='flex flex-col gap-2 rounded-2xl border border-indigo-100/70 bg-indigo-50/40 p-4 shadow-inner dark:border-indigo-400/20 dark:bg-indigo-400/5'>
						<label className='flex items-center gap-3 text-sm font-semibold text-indigo-900 dark:text-indigo-100'>
							<input
								type='checkbox'
								className='h-4 w-4 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500'
								checked={values.tax_percentage === IVA_RATE}
								onChange={(e) =>
									setFieldValue('tax_percentage', e.target.checked ? IVA_RATE : 0)
								}
							/>
							Aplicar IVA (19%)
						</label>
						<p className='text-xs text-indigo-900/80 dark:text-indigo-100/80'>
							Activa esta opción si la cotización debe incluir IVA. Los cálculos
							finales se realizan automáticamente al guardar la cotización.
						</p>
					</div>
				</div>

				<div className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 p-4 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'>
					Los montos definitivos se recalculan en el backend según los productos
					seleccionados. Esta sección solo define los ajustes globales.
				</div>
			</CardBody>
		</Card>
	);
};

export default TotalsCard;
