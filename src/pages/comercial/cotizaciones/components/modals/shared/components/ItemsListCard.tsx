import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import { FieldArray, FormikErrors, FormikTouched } from 'formik';
import { FormQuotationValues, SaleableProduct } from '../types';
import { EMPTY_CUSTOM_ITEM, EMPTY_PRODUCT_ITEM } from '../constants';
import { formatCurrency } from '../helpers';

interface ItemsListCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
	errors: FormikErrors<FormQuotationValues>;
	touched: FormikTouched<FormQuotationValues>;
	productOptions: TSelectOptions;
	saleableProductsMap: Record<number, SaleableProduct>;
}

const ItemsListCard: React.FC<ItemsListCardProps> = ({
	values,
	setFieldValue,
	productOptions,
	saleableProductsMap,
}) => {
	return (
		<Card>
			<FieldArray name='items'>
				{({ push, remove }) => (
					<>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Ítems de la Cotización</CardTitle>
							</CardHeaderChild>
							<CardHeaderChild className='flex flex-wrap gap-2'>
								<Button
									size='sm'
									variant='outline'
									icon='plus'
									type='button'
									onClick={() => push({ ...EMPTY_PRODUCT_ITEM })}>
									Agregar producto
								</Button>
								<Button
									size='sm'
									variant='outline'
									icon='plus'
									type='button'
									onClick={() => push({ ...EMPTY_CUSTOM_ITEM })}>
									Agregar ítem libre
								</Button>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								{(values.items || []).map((item, index) => {
									const productInfo = item.product_id
										? saleableProductsMap[item.product_id]
										: undefined;
									const maxQuantity = productInfo?.stock ?? undefined;
									const isCustomItem = item.type === 'custom';

									return (
										<div
											key={index}
											className='rounded-md border border-gray-200 p-4'>
											<div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
												<span className='text-xs font-semibold uppercase text-gray-500'>
													{isCustomItem
														? 'Ítem libre'
														: 'Producto del catálogo'}
												</span>
												<Button
													variant='outline'
													color='red'
													size='sm'
													icon='trash'
													type='button'
													onClick={() => remove(index)}
													isDisable={(values.items?.length || 0) === 1}>
													Eliminar
												</Button>
											</div>

											{isCustomItem ? (
												<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
													<div className='md:col-span-2'>
														<label className='mb-1 block text-xs font-medium text-gray-500'>
															Nombre del ítem *
														</label>
														<Input
															name={`items.${index}.customer_name`}
															placeholder='Ej: Servicio de instalación'
															value={item.customer_name ?? ''}
															onChange={(e) =>
																setFieldValue(
																	`items.${index}.customer_name`,
																	e.target.value,
																)
															}
														/>
													</div>
													<div>
														<label className='mb-1 block text-xs font-medium text-gray-500'>
															SKU del cliente
														</label>
														<Input
															name={`items.${index}.customer_sku`}
															placeholder='Opcional'
															value={item.customer_sku ?? ''}
															onChange={(e) =>
																setFieldValue(
																	`items.${index}.customer_sku`,
																	e.target.value,
																)
															}
														/>
													</div>
													<div>
														<label className='mb-1 block text-xs font-medium text-gray-500'>
															Cantidad *
														</label>
														<Input
															name={`items.${index}.quantity`}
															type='number'
															min={1}
															placeholder='1'
															value={item.quantity ?? 1}
															onChange={(e) =>
																setFieldValue(
																	`items.${index}.quantity`,
																	(() => {
																		const rawValue = Number(
																			e.target.value,
																		);
																		return Number.isFinite(
																			rawValue,
																		) && rawValue > 0
																			? rawValue
																			: 1;
																	})(),
																)
															}
															dimension='sm'
														/>
													</div>
													<div>
														<label className='mb-1 block text-xs font-medium text-gray-500'>
															Precio neto unitario *
														</label>
														<Input
															name={`items.${index}.unit_price`}
															type='number'
															min={0}
															step='0.01'
															placeholder='0'
															value={item.unit_price ?? ''}
															onChange={(e) =>
																setFieldValue(
																	`items.${index}.unit_price`,
																	e.target.value === ''
																		? ''
																		: Number(e.target.value),
																)
															}
														/>
														<p className='mt-1 text-[11px] text-gray-500'>
															Ingresa el valor neto (sin IVA).
														</p>
													</div>
													<div>
														<label className='mb-1 block text-xs font-medium text-gray-500'>
															Descuento (neto)
														</label>
														<Input
															name={`items.${index}.discount_amount`}
															type='number'
															min={0}
															step='0.01'
															placeholder='0'
															value={item.discount_amount ?? ''}
															onChange={(e) =>
																setFieldValue(
																	`items.${index}.discount_amount`,
																	e.target.value === ''
																		? ''
																		: Number(e.target.value),
																)
															}
														/>
													</div>
													<div className='md:col-span-3'>
														<label className='mb-1 block text-xs font-medium text-gray-500'>
															Detalle / descripción
														</label>
														<Textarea
															name={`items.${index}.description`}
															rows={2}
															placeholder='Información adicional para el ítem'
															value={item.description ?? ''}
															onChange={(e) =>
																setFieldValue(
																	`items.${index}.description`,
																	e.target.value,
																)
															}
														/>
													</div>
												</div>
											) : (
												<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
													<div>
														<label className='mb-1 block text-xs font-medium text-gray-500'>
															Producto *
														</label>
														<SelectReact
															name={`items.${index}.product_id`}
															options={productOptions}
															placeholder='Seleccionar...'
															value={productOptions.find(
																(opt) =>
																	opt.value ===
																	String(item.product_id),
															)}
															onChange={(option) => {
																const selectedOption =
																	option as TSelectOption;
																if (
																	selectedOption &&
																	!Array.isArray(selectedOption)
																) {
																	const nextProductId =
																		Number(
																			selectedOption.value,
																		) || 0;
																	setFieldValue(
																		`items.${index}.product_id`,
																		nextProductId,
																	);
																	setFieldValue(
																		`items.${index}.type`,
																		'product',
																	);
																	const stock =
																		saleableProductsMap[
																			nextProductId
																		]?.stock;
																	const currentQuantity =
																		values.items?.[index]
																			?.quantity ?? 1;
																	if (
																		stock &&
																		currentQuantity > stock
																	) {
																		setFieldValue(
																			`items.${index}.quantity`,
																			stock,
																		);
																	}
																}
															}}
															dimension='sm'
														/>
														{productInfo && (
															<p className='mt-1 text-xs text-gray-500'>
																Stock disponible:{' '}
																<strong>{productInfo.stock}</strong>{' '}
																· Precio neto:{' '}
																{formatCurrency(
																	productInfo.unit_price_net,
																)}{' '}
																· Precio bruto:{' '}
																{formatCurrency(
																	productInfo.unit_price_gross,
																)}
															</p>
														)}
													</div>

													<div>
														<label className='mb-1 block text-xs font-medium text-gray-500'>
															Cantidad *
														</label>
														<Input
															name={`items.${index}.quantity`}
															type='number'
															min={1}
															max={maxQuantity}
															placeholder='1'
															value={item.quantity ?? 1}
															onChange={(e) =>
																setFieldValue(
																	`items.${index}.quantity`,
																	(() => {
																		const rawValue = Number(
																			e.target.value,
																		);
																		const normalizedValue =
																			Number.isFinite(
																				rawValue,
																			) && rawValue > 0
																				? rawValue
																				: 1;
																		if (
																			maxQuantity &&
																			normalizedValue >
																				maxQuantity
																		) {
																			return maxQuantity;
																		}
																		return normalizedValue;
																	})(),
																)
															}
															dimension='sm'
														/>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</CardBody>
					</>
				)}
			</FieldArray>
		</Card>
	);
};

export default ItemsListCard;
