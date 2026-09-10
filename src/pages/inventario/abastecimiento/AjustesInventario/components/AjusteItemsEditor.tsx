import React, { FC } from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Validation from '@/components/form/Validation';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { CONDITION_OPTIONS } from '@/components/procurement';
import type {
	IInventoryStockOriginRow,
	IInventoryStockRow,
	IProcurementProduct,
	TStockCondition,
} from '@/interface/procurement.interface';
import type { IAjusteItemDraft } from '@/pages/inventario/abastecimiento/AjustesInventario/types';

export interface IAjusteItemsEditorProps {
	items: IAjusteItemDraft[];
	/** Catálogo corregible: no depende del saldo vigente en la ubicación. */
	products: IProcurementProduct[];
	loadingStock: boolean;
	hasLocation: boolean;
	disabled: boolean;
	hasLinkedReceipt: boolean;
	originsFor: (productId: number | '') => IInventoryStockOriginRow[];
	totalsFor: (productId: number | '') => IInventoryStockRow | null;
	/** Mensaje de Yup para un campo de una línea, o `undefined` si está bien. */
	errorFor: (index: number, field: keyof IAjusteItemDraft) => string | undefined;
	onChangeItem: (index: number, patch: Partial<IAjusteItemDraft>) => void;
	onAddItem: () => void;
	onRemoveItem: (index: number) => void;
}

const originLabel = (origin: IInventoryStockOriginRow): string => {
	const document = origin.purchase_document
		? `${origin.purchase_document.document_number}`
		: 'Sin documento';
	const supplier = origin.supplier ? ` · ${origin.supplier.display_name}` : '';
	return `#${origin.origin_id} · ${document}${supplier} (${origin.physical_quantity})`;
};

/**
 * Líneas de un ajuste.
 *
 * El selector de procedencia sólo existe en los **egresos**: un ingreso
 * positivo no puede atribuirse a un origen viejo, crea un origen desconocido
 * de ajuste (sección 11). Con una recepción enlazada el origen deja de ser
 * opcional y se limita a las procedencias de esa recepción.
 *
 * El selector de producto ofrece el **catálogo** de la filial, no el stock de
 * la ubicación: un producto que llegó a cero sigue siendo corregible al alza,
 * que es la razón de existir de un conteo.
 */
const AjusteItemsEditor: FC<IAjusteItemsEditorProps> = ({
	items,
	products,
	loadingStock,
	hasLocation,
	disabled,
	hasLinkedReceipt,
	originsFor,
	totalsFor,
	errorFor,
	onChangeItem,
	onAddItem,
	onRemoveItem,
}) => (
	<div className='space-y-3'>
		<div className='overflow-x-auto'>
			<Table aria-label='Líneas del ajuste' className='min-w-[880px]'>
				<THead>
					<Tr>
						<Th scope='col'>Producto</Th>
						<Th scope='col'>Condición</Th>
						<Th scope='col'>Diferencia</Th>
						<Th scope='col'>Saldo actual</Th>
						<Th scope='col'>Procedencia</Th>
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
							return item.condition === 'fit' ? row.fit_quantity : row.unfit_quantity;
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
						if (balance !== null) balanceLabel = loadingStock ? '…' : String(balance);
						const origins = originsFor(item.productId);
						const productError = errorFor(index, 'productId');
						// El saldo bajo cero se avisa al escribir; el resto de los
						// mensajes de la línea vienen del esquema al enviar.
						const deltaError = belowZero
							? `El egreso dejaría el saldo bajo cero (hay ${balance ?? 0}).`
							: errorFor(index, 'quantityDelta');
						const originError =
							hasLinkedReceipt && item.originId === ''
								? 'Con una recepción enlazada el egreso debe indicar un origen.'
								: errorFor(index, 'originId');
						return (
							// El índice es la identidad real de una línea en blanco: dos
							// filas recién agregadas no tienen producto que las distinga.
							// eslint-disable-next-line react/no-array-index-key
							<Tr key={index}>
								<Td>
									<Validation
										isValid={!productError}
										isTouched={Boolean(productError)}
										invalidFeedback={productError}>
										<Select
											name={`items[${index}].productId`}
											aria-label={`Producto de la línea ${index + 1}`}
											disabled={disabled || !hasLocation}
											value={
												item.productId === '' ? '' : String(item.productId)
											}
											onChange={(event) =>
												onChangeItem(index, {
													productId: event.target.value
														? Number(event.target.value)
														: '',
													originId: '',
												})
											}>
											<option value=''>Selecciona un producto…</option>
											{products.map((product) => (
												<option key={product.id} value={product.id}>
													{product.sku} · {product.name}
												</option>
											))}
										</Select>
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
												condition: event.target.value as TStockCondition,
											})
										}>
										{CONDITION_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</Select>
								</Td>
								<Td className='w-32'>
									<Validation
										isValid={!deltaError}
										isTouched={Boolean(deltaError)}
										invalidFeedback={deltaError}>
										<Input
											name={`items[${index}].quantityDelta`}
											aria-label={`Diferencia de la línea ${index + 1}`}
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
									className={
										balance === null || loadingStock
											? 'tabular-nums text-zinc-500'
											: 'tabular-nums'
									}>
									{balanceLabel}
								</Td>
								<Td>
									{isEntry ? (
										<span className='text-xs text-zinc-500'>
											Un ingreso crea un origen de ajuste: no se atribuye a
											una procedencia anterior.
										</span>
									) : (
										<Validation
											isValid={!originError}
											isTouched={Boolean(originError)}
											invalidFeedback={originError}>
											<Select
												name={`items[${index}].originId`}
												aria-label={`Procedencia de la línea ${index + 1}`}
												disabled={disabled || item.productId === ''}
												value={
													item.originId === ''
														? ''
														: String(item.originId)
												}
												onChange={(event) =>
													onChangeItem(index, {
														originId: event.target.value
															? Number(event.target.value)
															: '',
													})
												}
												isValid={!originError}
												isTouched={Boolean(originError)}
												invalidFeedback={originError}>
												<option value=''>
													{hasLinkedReceipt
														? 'Selecciona un origen…'
														: 'FIFO automático'}
												</option>
												{origins.map((origin) => (
													<option
														key={origin.origin_id}
														value={origin.origin_id}>
														{originLabel(origin)}
													</option>
												))}
											</Select>
										</Validation>
									)}
								</Td>
								<Td>
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

export default AjusteItemsEditor;
