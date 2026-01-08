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
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

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
		<Card
			rounded='rounded-2xl'
			className='dark:shadow-lg/10 border border-white/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5'>
			<FieldArray name='items'>
				{({ push, remove }) => (
					<>
						<CardHeader className='pb-2'>
							<CardHeaderChild className='w-full items-center justify-between'>
								<div>
									<CardTitle className='flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white'>
										<span className='flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200'>
											<Icon icon='DuoClipboardList' className='text-xl' />
										</span>
										<span>Ítems de la Cotización</span>
									</CardTitle>
									<p className='text-xs text-gray-500 dark:text-gray-300'>
										Combina productos del catálogo e ítems personalizados.
									</p>
								</div>
								<Badge className='rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100'>
									Paso 3
								</Badge>
							</CardHeaderChild>
							<CardHeaderChild className='flex flex-wrap justify-end gap-2'>
								<Button
									size='sm'
									variant='outline'
									icon='plus'
									type='button'
									rounded='rounded-full'
									className='border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-200 dark:hover:bg-emerald-400/10'
									onClick={() => push({ ...EMPTY_PRODUCT_ITEM })}>
									Agregar producto
								</Button>
								<Button
									size='sm'
									variant='outline'
									icon='plus'
									type='button'
									rounded='rounded-full'
									className='border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-200 dark:hover:bg-emerald-400/10'
									onClick={() => push({ ...EMPTY_CUSTOM_ITEM })}>
									Agregar ítem libre
								</Button>
							</CardHeaderChild>
						</CardHeader>
						<CardBody className='space-y-5'>
							{(values.items || []).length === 0 && (
								<div className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200'>
									Aún no agregas productos. Usa los botones superiores para
									comenzar.
								</div>
							)}

							{(values.items || []).map((item, index) => {
								const productInfo = item.product_id
									? saleableProductsMap[item.product_id]
									: undefined;
								const maxQuantity = productInfo?.stock ?? undefined;
								const isCustomItem = item.type === 'custom';

								return (
									<div
										key={index}
										className='group rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm transition hover:border-emerald-200/80 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40'>
										<div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
											<span className='rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:bg-white/10 dark:text-zinc-100 dark:group-hover:bg-emerald-400/10 dark:group-hover:text-emerald-200'>
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
												rounded='rounded-full'
												className='border-dashed dark:border-white/20'
												onClick={() => remove(index)}
												isDisable={(values.items?.length || 0) === 1}>
												Eliminar
											</Button>
										</div>

										{isCustomItem ? (
											<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
												<div className='md:col-span-2'>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
														Nombre del ítem *
													</p>
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
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
														SKU del cliente
													</p>
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
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
														Cantidad *
													</p>
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
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
														Precio neto unitario
													</p>
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
													<p className='mt-1 text-[11px] text-gray-500 dark:text-gray-300'>
														Ingresa el valor neto (sin IVA). Opcional.
													</p>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
														Descuento (neto)
													</p>
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
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
														Detalle / descripción
													</p>
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
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
														Producto *
													</p>
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
																	Number(selectedOption.value) ||
																	0;
																setFieldValue(
																	`items.${index}.product_id`,
																	nextProductId,
																);
																setFieldValue(
																	`items.${index}.type`,
																	'product',
																);

																// Asignar el precio del producto
																const selectedProduct =
																	saleableProductsMap[
																		nextProductId
																	];
																if (selectedProduct) {
																	setFieldValue(
																		`items.${index}.unit_price`,
																		selectedProduct.unit_price_net,
																	);
																}

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
														<p className='mt-1 text-xs text-gray-500 dark:text-gray-300'>
															Stock disponible:{' '}
															<strong>{productInfo.stock}</strong> ·
															Precio neto:{' '}
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
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
														Cantidad *
													</p>
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
																		Number.isFinite(rawValue) &&
																		rawValue > 0
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
						</CardBody>
					</>
				)}
			</FieldArray>
		</Card>
	);
};

export default ItemsListCard;
