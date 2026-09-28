import React, { FC, useMemo } from 'react';
import classNames from 'classnames';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Validation from '@/components/form/Validation';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { CONDITION_OPTIONS } from '@/components/procurement';
import type {
	IInventoryStockRow,
	IProcurementProduct,
	TStockCondition,
} from '@/interface/procurement.interface';
import type { IAjusteItemDraft } from '@/pages/inventario/abastecimiento/AjustesTraslados/adjustment.types';
import {
	filterProductOption,
	productNoOptionsMessage,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/productSearch';

export interface IAdjustmentItemsEditorProps {
	items: IAjusteItemDraft[];
	/** Catálogo corregible: no depende del saldo vigente en la ubicación. */
	products: IProcurementProduct[];
	loadingStock: boolean;
	hasLocation: boolean;
	disabled: boolean;
	totalsFor: (productId: number | '') => IInventoryStockRow | null;
	/** Mensaje de Yup para un campo de una línea, o `undefined` si está bien. */
	errorFor: (index: number, field: keyof IAjusteItemDraft) => string | undefined;
	onChangeItem: (index: number, patch: Partial<IAjusteItemDraft>) => void;
	onAddItem: () => void;
	onRemoveItem: (index: number) => void;
}

/**
 * Líneas de un ajuste. Todas corrigen el saldo de la ubicación elegida en el
 * primer paso: un egreso descuenta unidades de esa ubicación (FIFO) y un
 * ingreso las registra como origen de ajuste.
 *
 * El selector de producto ofrece el **catálogo** de la filial, no el stock de
 * la ubicación: un producto que llegó a cero sigue siendo corregible al alza,
 * que es la razón de existir de un conteo.
 */
const AdjustmentItemsEditor: FC<IAdjustmentItemsEditorProps> = ({
	items,
	products,
	loadingStock,
	hasLocation,
	disabled,
	totalsFor,
	errorFor,
	onChangeItem,
	onAddItem,
	onRemoveItem,
}) => {
	// El buscador filtra por la etiqueta (SKU y nombre) y no lista nada sin texto.
	const productOptions = useMemo<TSelectOption[]>(
		() =>
			products.map((product) => ({
				value: String(product.id),
				label: `${product.sku} · ${product.name}`,
			})),
		[products],
	);

	return (
		<div className='space-y-3'>
			<div className='overflow-x-auto'>
				<Table aria-label='Líneas del ajuste' className='min-w-[800px]'>
					<THead>
						<Tr>
							<Th scope='col'>Producto</Th>
							<Th scope='col'>Condición</Th>
							<Th scope='col'>Stock en sistema</Th>
							<Th scope='col'>Ajuste (±)</Th>
							<Th scope='col'>Stock resultante</Th>
							<Th scope='col'>
								<span className='sr-only'>Acciones</span>
							</Th>
						</Tr>
					</THead>
					<TBody>
						{items.map((item, index) => {
							const totals = totalsFor(item.productId);
							// Un producto elegido sin fila de stock tiene saldo 0 en esta
							// ubicación, que no es lo mismo que «saldo desconocido»: sin
							// producto elegido no hay saldo que mostrar.
							const conditionBalance = (row: IInventoryStockRow | null): number => {
								if (row === null) return 0;
								return item.condition === 'fit'
									? row.fit_quantity
									: row.unfit_quantity;
							};
							const balance = item.productId === '' ? null : conditionBalance(totals);
							const delta = Number(item.quantityDelta);
							const isEgress = Number.isInteger(delta) && delta < 0;
							const isEntry = Number.isInteger(delta) && delta > 0;
							// Con el stock aún cargando, el saldo todavía no es una
							// afirmación: avisar «hay 0» ahí sería un falso rechazo.
							const belowZero =
								isEgress &&
								!loadingStock &&
								balance !== null &&
								Math.abs(delta) > balance;
							let balanceLabel = '—';
							if (balance !== null)
								balanceLabel = loadingStock ? '…' : String(balance);
							// El stock resultante sólo es una afirmación con saldo conocido y una
							// diferencia entera distinta de cero.
							const finalBalance =
								balance !== null && !loadingStock && (isEgress || isEntry)
									? balance + delta
									: null;
							const productError = errorFor(index, 'productId');
							// El saldo bajo cero se avisa al escribir; el resto de los
							// mensajes de la línea vienen del esquema al enviar.
							const deltaError = belowZero
								? `El egreso supera el stock en sistema (${balance ?? 0}).`
								: errorFor(index, 'quantityDelta');
							return (
								// El índice es la identidad real de una línea en blanco: dos
								// filas recién agregadas no tienen producto que las distinga.
								// Celdas alineadas arriba: un mensaje de error bajo un campo agranda
								// sólo su celda, sin recentrar ni desplazar las demás de la fila.
								// eslint-disable-next-line react/no-array-index-key
								<Tr key={index} className='[&>td]:align-top'>
									<Td className='min-w-[18rem]'>
										<Validation
											isValid={!productError}
											isTouched={Boolean(productError)}
											invalidFeedback={productError}>
											<SelectReact
												name={`items[${index}].productId`}
												aria-label={`Producto de la línea ${index + 1}`}
												isDisabled={disabled || !hasLocation}
												options={productOptions}
												placeholder='Buscar por SKU o nombre…'
												filterOption={filterProductOption}
												noOptionsMessage={productNoOptionsMessage}
												value={
													productOptions.find(
														(option) =>
															option.value === String(item.productId),
													) ?? null
												}
												onChange={(option) => {
													if (Array.isArray(option)) return;
													const selected = option as TSelectOption | null;
													onChangeItem(index, {
														productId: selected
															? Number(selected.value)
															: '',
													});
												}}
											/>
										</Validation>
									</Td>
									<Td>
										<Select
											name={`items[${index}].condition`}
											aria-label={`Condición de la línea ${index + 1}`}
											disabled={disabled}
											value={item.condition}
											onChange={(event) =>
												onChangeItem(index, {
													condition: event.target
														.value as TStockCondition,
												})
											}>
											{CONDITION_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</Select>
									</Td>
									<Td
										className={
											balance === null || loadingStock
												? 'tabular-nums text-zinc-500'
												: 'tabular-nums'
										}>
										<div className='flex min-h-[2.25rem] items-center'>
											{balanceLabel}
										</div>
									</Td>
									<Td className='w-44'>
										<Validation
											isValid={!deltaError}
											isTouched={Boolean(deltaError)}
											invalidFeedback={deltaError}>
											<Input
												name={`items[${index}].quantityDelta`}
												aria-label={`Cantidad de ajuste de la línea ${index + 1}`}
												type='number'
												step={1}
												disabled={disabled}
												value={item.quantityDelta}
												onChange={(event) =>
													onChangeItem(index, {
														quantityDelta: event.target.value,
													})
												}
												isValid={!deltaError}
												isTouched={Boolean(deltaError)}
												invalidFeedback={deltaError}
												placeholder='Ej: -2'
											/>
										</Validation>
									</Td>
									<Td
										className={classNames('tabular-nums', {
											'text-zinc-500': finalBalance === null,
											'font-semibold': finalBalance !== null,
											'text-red-600 dark:text-red-400':
												finalBalance !== null && finalBalance < 0,
										})}>
										<div
											className='flex min-h-[2.25rem] items-center'
											data-testid={`ajuste-stock-resultante-${index}`}>
											{finalBalance === null ? '—' : finalBalance}
										</div>
									</Td>
									<Td>
										<div className='flex min-h-[2.25rem] items-center'>
											<Button
												type='button'
												variant='outline'
												color='red'
												size='sm'
												icon='HeroTrash'
												isDisable={disabled}
												aria-label={`Quitar la línea ${index + 1}`}
												onClick={() => onRemoveItem(index)}>
												Quitar
											</Button>
										</div>
									</Td>
								</Tr>
							);
						})}
					</TBody>
				</Table>
			</div>
			<Button
				type='button'
				variant='outline'
				icon='HeroPlus'
				isDisable={disabled || !hasLocation}
				onClick={onAddItem}>
				Agregar producto
			</Button>
		</div>
	);
};

export default AdjustmentItemsEditor;
