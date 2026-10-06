import React from 'react';
import type { FormikProps } from 'formik';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import { formatPesoInput } from '@/utils/procurementDecimal.util';
import {
	DOCUMENTO_ITEM_CLASSNAME,
	DOCUMENTO_ITEM_GRID_CLASSNAME,
	DOCUMENTO_TOTAL_OUTPUT_CLASSNAME,
} from './purchaseDocumentFormStyles';
import type { IPurchaseDocumentFormValues } from '../../types';
import { formatGrossTotal, getShippingTotalCents } from '../../utils/purchaseDocumentTotals';

interface IShippingCostRowProps {
	formik: FormikProps<IPurchaseDocumentFormValues>;
	onPesoChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Costo de envío como una línea más (cantidad 1), con la misma grilla que las líneas. */
const ShippingCostRow: React.FC<IShippingCostRowProps> = ({ formik, onPesoChange }) => {
	const shippingCalculatesVat = formik.values.shipping_cost_basis === 'net';

	return (
		<div className={DOCUMENTO_ITEM_CLASSNAME}>
			<div className='mb-2'>
				<span className='rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30'>
					Envío
				</span>
			</div>
			<div className={DOCUMENTO_ITEM_GRID_CLASSNAME}>
				<div className='space-y-1'>
					<Label htmlFor='shipping-quantity'>Cantidad</Label>
					<Input id='shipping-quantity' name='shipping_quantity' value='1' disabled />
				</div>
				<div className='space-y-1'>
					<Label htmlFor='shipping-description'>Descripción</Label>
					<Input
						id='shipping-description'
						name='shipping_description'
						value='Costo de envío'
						disabled
					/>
				</div>
				<div className='space-y-1'>
					<Label htmlFor='shipping-cost'>
						{shippingCalculatesVat ? 'Costo neto' : 'Costo bruto c/ IVA'}{' '}
						<span className='text-red-500'>*</span>
					</Label>
					<Input
						id='shipping-cost'
						name='shipping_cost'
						className='!bg-white dark:!bg-zinc-900'
						type='text'
						inputMode='decimal'
						placeholder='$0'
						value={formatPesoInput(formik.values.shipping_cost)}
						onChange={onPesoChange('shipping_cost')}
						onBlur={formik.handleBlur}
						isValid={!formik.errors.shipping_cost}
						isTouched={Boolean(formik.touched.shipping_cost)}
						invalidFeedback={formik.errors.shipping_cost}
					/>
					<Checkbox
						id='shipping-cost-basis'
						name='shipping_cost_basis'
						checked={shippingCalculatesVat}
						onChange={(event) =>
							formik
								.setFieldValue(
									'shipping_cost_basis',
									event.target.checked ? 'net' : 'gross',
								)
								.catch(() => undefined)
						}
						label='Calcular IVA'
						dimension='sm'
					/>
				</div>
				<div className='space-y-1'>
					<Label htmlFor='shipping-total'>Total</Label>
					<output id='shipping-total' className={DOCUMENTO_TOTAL_OUTPUT_CLASSNAME}>
						{formatGrossTotal(getShippingTotalCents(formik.values)) ?? '—'}
					</output>
				</div>
			</div>
		</div>
	);
};

export default ShippingCostRow;
