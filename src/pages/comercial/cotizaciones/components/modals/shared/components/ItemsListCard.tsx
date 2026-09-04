import React from 'react';
import { FieldArray } from 'formik';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import SoftHoldsBadge from '@/components/ui/SoftHoldsBadge';
import { FormQuotationValues, SaleableProduct } from '../types';
import { EMPTY_CUSTOM_ITEM, EMPTY_PRODUCT_ITEM } from '../constants';
import { calculateQuotationGrossUnitPrice, formatCurrency } from '../helpers';
import {
	QUOTATION_CARD_CLASSNAME,
	QUOTATION_ITEM_CLASSNAME,
	QUOTATION_MUTED_TEXT_CLASSNAME,
	QUOTATION_PANEL_CLASSNAME,
	QUOTATION_READONLY_VALUE_CLASSNAME,
	QUOTATION_SUBTITLE_CLASSNAME,
} from '../styles';
import QuotationField from './QuotationField';

interface ItemsListCardProps {
	values: FormQuotationValues;
	setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void;
	productOptions: TSelectOptions;
	saleableProductsMap: Record<number, SaleableProduct>;
}

/**
 * El origen del ítem cambia qué campos se editan, así que se distingue por color además
 * del texto; ambas variantes mantienen el contraste del texto sobre su propio fondo.
 */
const ITEM_ORIGIN_CLASSNAME = {
	product:
		'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/30',
	custom: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30',
} as const;

const ITEM_GRID_CLASSNAME =
	'grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-[110px_160px_minmax(0,1fr)_190px_150px]';

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

/** Cantidad válida: entero positivo, acotado al stock disponible cuando lo hay. */
const normalizeQuantity = (rawValue: string, maxQuantity?: number) => {
	const parsedValue = Number(rawValue);
	const quantity = Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
	return maxQuantity && quantity > maxQuantity ? maxQuantity : quantity;
};

const ItemsListCard: React.FC<ItemsListCardProps> = ({
	values,
	setFieldValue,
	productOptions,
	saleableProductsMap,
}) => (
	<Card className={QUOTATION_CARD_CLASSNAME}>
		<FieldArray name='items'>
			{({ push, remove }) => (
				<>
					<CardHeader className='pb-2'>
						<CardHeaderChild className='w-full items-start justify-between gap-3'>
							<div>
								<CardTitle className='text-lg'>Ítems de la cotización</CardTitle>
								<p className={QUOTATION_SUBTITLE_CLASSNAME}>
									Combina productos del catálogo e ítems personalizados.
								</p>
							</div>
							<div className='flex flex-wrap items-center justify-end gap-2'>
								<Button
									type='button'
									variant='outline'
									size='sm'
									icon='HeroPlus'
									className='whitespace-nowrap'
									onClick={() => push({ ...EMPTY_PRODUCT_ITEM })}>
									Agregar producto
								</Button>
								<Button
									type='button'
									variant='outline'
									size='sm'
									icon='HeroPlus'
									className='whitespace-nowrap'
									onClick={() => push({ ...EMPTY_CUSTOM_ITEM })}>
									Agregar ítem libre
								</Button>
							</div>
						</CardHeaderChild>
					</CardHeader>
					<CardBody className='space-y-3'>
						{(values.items || []).length === 0 && (
							<div
								className={`${QUOTATION_PANEL_CLASSNAME} border-dashed p-6 text-center text-sm ${QUOTATION_MUTED_TEXT_CLASSNAME}`}>
								Aún no agregas productos. Usa los botones superiores para comenzar.
							</div>
						)}

						{(values.items || []).map((item, index) => {
							const productInfo = item.product_id
								? saleableProductsMap[item.product_id]
								: undefined;
							const maxQuantity = getAvailableStock(productInfo);
							const isCustomItem = item.type === 'custom';
							const calculatesVat = Boolean(item.includes_tax);
							/** Igual que en Pagos Diferidos: se redondea el unitario, no el total. */
							const grossUnitPrice =
								calculateQuotationGrossUnitPrice(item.unit_price, calculatesVat) ??
								0;
							const rowGrossTotal = (Number(item.quantity) || 0) * grossUnitPrice;

							return (
								<div
									// eslint-disable-next-line react/no-array-index-key -- Los ítems nuevos aún no tienen id propio.
									key={index}
									className={QUOTATION_ITEM_CLASSNAME}>
									<div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
										<span
											className={`rounded-full px-3 py-1 text-xs font-medium ${
												ITEM_ORIGIN_CLASSNAME[
													isCustomItem ? 'custom' : 'product'
												]
											}`}>
											{isCustomItem ? 'Ítem libre' : 'Producto del catálogo'}
										</span>
										<Button
											type='button'
											variant='outline'
											color='red'
											size='xs'
											icon='HeroTrash'
											onClick={() => remove(index)}
											isDisable={(values.items?.length || 0) === 1}>
											Eliminar
										</Button>
									</div>

									<div className={ITEM_GRID_CLASSNAME}>
										<QuotationField
											name={`items.${index}.quantity`}
											label='Cantidad'>
											{({ error, isTouched, isValid }) => (
												<Input
													id={`items.${index}.quantity`}
													name={`items.${index}.quantity`}
													type='number'
													min={1}
													max={isCustomItem ? undefined : maxQuantity}
													placeholder='1'
													value={item.quantity ?? 1}
													onChange={(e) =>
														setFieldValue(
															`items.${index}.quantity`,
															normalizeQuantity(
																e.target.value,
																isCustomItem
																	? undefined
																	: maxQuantity,
															),
														)
													}
													isValid={isValid}
													isTouched={isTouched}
													invalidFeedback={error}
												/>
											)}
										</QuotationField>

										<QuotationField
											name={`items.${index}.customer_sku`}
											label='Código'>
											{() =>
												isCustomItem ? (
													<Input
														id={`items.${index}.customer_sku`}
														name={`items.${index}.customer_sku`}
														placeholder='SKU / código'
														value={item.customer_sku ?? ''}
														onChange={(e) =>
															setFieldValue(
																`items.${index}.customer_sku`,
																e.target.value,
															)
														}
													/>
												) : (
													<Input
														id={`items.${index}.customer_sku`}
														name={`items.${index}.customer_sku`}
														value={productInfo?.sku ?? ''}
														placeholder='SKU producto'
														disabled
													/>
												)
											}
										</QuotationField>

										<QuotationField
											name={
												isCustomItem
													? `items.${index}.customer_name`
													: `items.${index}.product_id`
											}
											label='Producto / descripción'>
											{({ error, isTouched, isValid }) => (
												<div className='space-y-2'>
													{isCustomItem ? (
														<Input
															id={`items.${index}.customer_name`}
															name={`items.${index}.customer_name`}
															placeholder='Nombre del ítem'
															value={item.customer_name ?? ''}
															onChange={(e) =>
																setFieldValue(
																	`items.${index}.customer_name`,
																	e.target.value,
																)
															}
															isValid={isValid}
															isTouched={isTouched}
															invalidFeedback={error}
														/>
													) : (
														<SelectReact
															name={`items.${index}.product_id`}
															inputId={`items.${index}.product_id`}
															options={productOptions}
															placeholder='Seleccionar producto...'
															value={productOptions.find(
																(opt) =>
																	opt.value ===
																	String(item.product_id),
															)}
															onChange={(option) => {
																const selectedOption =
																	option as TSelectOption;
																if (
																	!selectedOption ||
																	Array.isArray(selectedOption)
																)
																	return;
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
																const selectedProduct =
																	saleableProductsMap[
																		nextProductId
																	];
																if (selectedProduct)
																	setFieldValue(
																		`items.${index}.unit_price`,
																		selectedProduct.unit_price_net,
																	);
																const stock =
																	getAvailableStock(
																		selectedProduct,
																	);
																const currentQuantity =
																	values.items?.[index]
																		?.quantity ?? 1;
																if (
																	stock &&
																	currentQuantity > stock
																)
																	setFieldValue(
																		`items.${index}.quantity`,
																		stock,
																	);
															}}
															isValid={isValid}
															isTouched={isTouched}
															invalidFeedback={error}
														/>
													)}
													<Textarea
														id={`items.${index}.description`}
														name={`items.${index}.description`}
														rows={2}
														placeholder={
															isCustomItem
																? 'Descripción o detalle del ítem'
																: 'Descripción adicional del producto'
														}
														value={item.description ?? ''}
														onChange={(e) =>
															setFieldValue(
																`items.${index}.description`,
																e.target.value,
															)
														}
													/>
													{!isCustomItem && productInfo && (
														<p
															className={`text-xs ${QUOTATION_MUTED_TEXT_CLASSNAME}`}>
															Stock:{' '}
															<strong>{maxQuantity ?? 0}</strong> ·
															Neto:{' '}
															{formatCurrency(
																productInfo.unit_price_net,
															)}{' '}
															· Bruto:{' '}
															{formatCurrency(
																productInfo.unit_price_gross,
															)}
														</p>
													)}
													{!isCustomItem &&
														productInfo?.soft_holds &&
														productInfo.soft_holds.quantity > 0 && (
															<SoftHoldsBadge
																softHolds={productInfo.soft_holds}
																availableStock={maxQuantity}
															/>
														)}
												</div>
											)}
										</QuotationField>

										<QuotationField
											name={`items.${index}.unit_price`}
											label={
												calculatesVat
													? 'Precio neto'
													: 'Precio bruto c/ IVA'
											}>
											{({ error, isTouched, isValid }) => (
												<div className='space-y-2'>
													<Input
														id={`items.${index}.unit_price`}
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
														isValid={isValid}
														isTouched={isTouched}
														invalidFeedback={error}
													/>
													{calculatesVat &&
														item.unit_price !== '' &&
														item.unit_price !== null && (
															<p
																className={`text-xs ${QUOTATION_MUTED_TEXT_CLASSNAME}`}>
																Bruto calculado:{' '}
																{formatCurrency(grossUnitPrice)}
															</p>
														)}
													<Checkbox
														id={`items.${index}.includes_tax`}
														name={`items.${index}.includes_tax`}
														checked={calculatesVat}
														onChange={(e) =>
															setFieldValue(
																`items.${index}.includes_tax`,
																e.target.checked,
															)
														}
														label='Calcular IVA'
														dimension='sm'
													/>
												</div>
											)}
										</QuotationField>

										<QuotationField name={`items.${index}.total`} label='Total'>
											{() => (
												<output
													id={`items.${index}.total`}
													className={`block ${QUOTATION_READONLY_VALUE_CLASSNAME}`}>
													{formatCurrency(rowGrossTotal)}
												</output>
											)}
										</QuotationField>
									</div>
								</div>
							);
						})}
					</CardBody>
				</>
			)}
		</FieldArray>
	</Card>
);

export default ItemsListCard;
