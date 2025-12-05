import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import { FormQuotationValues } from '../types';

interface TotalsCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
	IVA_RATE: number;
}

const TotalsCard: React.FC<TotalsCardProps> = ({ values, setFieldValue, IVA_RATE }) => {
	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Resumen</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Descuento Global %
						</label>
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

					<div className='rounded border border-dashed border-gray-200 p-4'>
						<label className='flex items-center gap-2 text-sm font-medium text-gray-700'>
							<input
								type='checkbox'
								className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
								checked={values.tax_percentage === IVA_RATE}
								onChange={(e) =>
									setFieldValue(
										'tax_percentage',
										e.target.checked ? IVA_RATE : 0,
									)
								}
							/>
							Aplicar IVA (19%)
						</label>
						<p className='mt-2 text-xs text-gray-500'>
							Activa esta opción si la cotización debe incluir IVA. Los cálculos finales
							se realizan en el backend.
						</p>
					</div>
				</div>

				<p className='mt-6 text-sm text-gray-500'>
					Los montos se calcularán automáticamente en el backend using los productos
					seleccionados. Aquí solo definimos el descuento global y si corresponde aplicar
					IVA.
				</p>
			</CardBody>
		</Card>
	);
};

export default TotalsCard;
