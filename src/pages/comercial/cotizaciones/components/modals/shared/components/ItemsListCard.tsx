import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
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
	const getAvailableStock = (product?: SaleableProduct) => {
		if (!product) return undefined;
		if (typeof product.stock === 'number') return product.stock;
		if (Array.isArray(product.assigned_branches)) {
			return product.assigned_branches.reduce(
				(total, branch) => total + (Number(branch.assigned_stock) || 0),
				0,
			);
		}
		return undefined;
	};

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
								<div className='ml-auto flex flex-wrap items-center justify-end gap-2'>
									<Button
										size='default'
										icon='HeroPlus'
										color='emerald'
										colorIntensity='400'
										variant='solid'
										type='button'
										rounded='rounded-full'
										className='text-emerald-700 dark:text-emerald-200'
										onClick={() => push({ ...EMPTY_PRODUCT_ITEM })}>
										Agregar producto
									</Button>
									<Button
										size='default'
										variant='solid'
										color='violet'
										colorIntensity='400'
										icon='HeroPlus'
										type='button'
										rounded='rounded-full'
										className='text-violet-700 dark:text-violet-200'
										onClick={() => push({ ...EMPTY_CUSTOM_ITEM })}>
										Agregar ítem libre
									</Button>
									<Badge className='rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100'>
										Paso 2
									</Badge>
								</div>
							</CardHeaderChild>
						</CardHeader>
						<CardBody className='space-y-4 pt-3'>
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
								const maxQuantity = getAvailableStock(productInfo);
								const isCustomItem = item.type === 'custom';
								const rowNetTotal =
									(Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
								const rowGrossTotal = item.includes_tax
									? rowNetTotal * 1.19
									: rowNetTotal;

								return (
									<div
										key={index}
										className='group rounded-2xl border border-zinc-100 bg-white/90 p-3 shadow-sm transition hover:border-emerald-200/80 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40'>
										<div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
											<span className='rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:bg-white/10 dark:text-zinc-100 dark:group-hover:bg-emerald-400/10 dark:group-hover:text-emerald-200'>
												{isCustomItem
													? 'Ítem libre'
													: 'Producto del catálogo'}
											</span>
											<Button
												variant='solid'
												color='red'
												colorIntensity='400'
												size='sm'
												icon='trash'
												type='button'
												rounded='rounded-full'
												className=''
												onClick={() => remove(index)}
												isDisable={(values.items?.length || 0) === 1}>
												Eliminar
											</Button>
										</div>

										{isCustomItem ? (
											<div className='grid grid-cols-1 gap-3 rounded-xl border border-zinc-100/80 bg-zinc-50/50 p-3 dark:border-white/10 dark:bg-white/[0.03] xl:grid-cols-[110px_150px_minmax(0,1fr)_190px_150px]'>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Cantidad</p>
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
																	const rawValue = Number(e.target.value);
																	return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 1;
																})(),
															)
														}
														dimension='sm'
													/>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Código</p>
													<Input
														name={`items.${index}.customer_sku`}
														placeholder='SKU / código'
														value={item.customer_sku ?? ''}
														onChange={(e) =>
															setFieldValue(`items.${index}.customer_sku`, e.target.value)
														}
														dimension='sm'
													/>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Producto / descripción</p>
													<div className='space-y-2'>
														<Input
															name={`items.${index}.customer_name`}
															placeholder='Nombre del ítem'
															value={item.customer_name ?? ''}
															onChange={(e) =>
																setFieldValue(`items.${index}.customer_name`, e.target.value)
															}
															dimension='sm'
														/>
														<Textarea
															name={`items.${index}.description`}
															rows={2}
															placeholder='Descripción o detalle del ítem'
															value={item.description ?? ''}
															onChange={(e) =>
																setFieldValue(`items.${index}.description`, e.target.value)
															}
														/>
													</div>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Precio unitario</p>
													<div className='space-y-2'>
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
																	e.target.value === '' ? '' : Number(e.target.value),
																)
															}
															dimension='sm'
														/>
														<Checkbox
															name={`items.${index}.includes_tax`}
															checked={Boolean(item.includes_tax)}
															onChange={(e) => setFieldValue(`items.${index}.includes_tax`, e.target.checked)}
															label='Con IVA'
															color='indigo'
															dimension='sm'
														/>
													</div>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Total</p>
													<div className='rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100'>
														{formatCurrency(rowGrossTotal)}
													</div>
												</div>
											</div>
										) : (
											<div className='grid grid-cols-1 gap-3 rounded-xl border border-zinc-100/80 bg-zinc-50/50 p-3 dark:border-white/10 dark:bg-white/[0.03] xl:grid-cols-[110px_150px_minmax(0,1fr)_190px_150px]'>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Cantidad</p>
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
																	const rawValue = Number(e.target.value);
																	const normalizedValue = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 1;
																	if (maxQuantity && normalizedValue > maxQuantity) {
																		return maxQuantity;
																	}
																	return normalizedValue;
																})(),
															)
														}
														dimension='sm'
													/>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Código</p>
													<Input
														name={`items.${index}.product_code_preview`}
														value={productInfo?.sku ?? ''}
														placeholder='SKU producto'
														dimension='sm'
														disabled
													/>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Producto / descripción</p>
													<div className='space-y-2'>
														<SelectReact
															name={`items.${index}.product_id`}
															options={productOptions}
															placeholder='Seleccionar producto...'
															value={productOptions.find(
																(opt) => opt.value === String(item.product_id),
															)}
															onChange={(option) => {
																const selectedOption = option as TSelectOption;
																if (selectedOption && !Array.isArray(selectedOption)) {
																	const nextProductId = Number(selectedOption.value) || 0;
																	setFieldValue(`items.${index}.product_id`, nextProductId);
																	setFieldValue(`items.${index}.type`, 'product');
																	const selectedProduct = saleableProductsMap[nextProductId];
																	if (selectedProduct) {
																		setFieldValue(`items.${index}.unit_price`, selectedProduct.unit_price_net);
																	}
																	const stock = getAvailableStock(saleableProductsMap[nextProductId]);
																	const currentQuantity = values.items?.[index]?.quantity ?? 1;
																	if (stock && currentQuantity > stock) {
																		setFieldValue(`items.${index}.quantity`, stock);
																	}
																}
															}}
															menuPortalTarget={document.body}
															styles={{
																menuPortal: (base) => ({ ...base, zIndex: 9999 }),
																menu: (base) => ({ ...base, zIndex: 9999 }),
															}}
															dimension='sm'
														/>
														<Textarea
															name={`items.${index}.description`}
															rows={2}
															placeholder='Descripción adicional del producto'
															value={item.description ?? ''}
															onChange={(e) => setFieldValue(`items.${index}.description`, e.target.value)}
														/>
														{productInfo && (
															<p className='text-xs text-gray-500 dark:text-gray-300'>
																Stock: <strong>{maxQuantity ?? 0}</strong> · Neto: {formatCurrency(productInfo.unit_price_net)} · Bruto: {formatCurrency(productInfo.unit_price_gross)}
															</p>
														)}
													</div>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Precio unitario</p>
													<div className='space-y-2'>
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
																	e.target.value === '' ? '' : Number(e.target.value),
																)
															}
															dimension='sm'
														/>
														<Checkbox
															name={`items.${index}.includes_tax`}
															checked={Boolean(item.includes_tax)}
															onChange={(e) => setFieldValue(`items.${index}.includes_tax`, e.target.checked)}
															label='Con IVA'
															color='indigo'
															dimension='sm'
														/>
													</div>
												</div>
												<div>
													<p className='mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>Total</p>
													<div className='rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100'>
														{formatCurrency(rowGrossTotal)}
													</div>
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
