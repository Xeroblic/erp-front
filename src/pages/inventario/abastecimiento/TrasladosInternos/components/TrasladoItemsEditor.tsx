import React, { FC } from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Validation from '@/components/form/Validation';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { CONDITION_OPTIONS } from '@/components/procurement';
import type { IInventoryStockRow, TStockCondition } from '@/interface/procurement.interface';
import type { ITrasladoItemDraft } from '@/pages/inventario/abastecimiento/TrasladosInternos/types';

export interface ITrasladoItemsEditorProps {
	items: ITrasladoItemDraft[];
	originRows: IInventoryStockRow[];
	loadingOrigin: boolean;
	hasOrigin: boolean;
	disabled: boolean;
	balanceFor: (productId: number | '', condition: TStockCondition) => number | null;
	/** Mensaje de Yup para un campo de una línea, o `undefined` si está bien. */
	errorFor: (index: number, field: keyof ITrasladoItemDraft) => string | undefined;
	onChangeItem: (index: number, patch: Partial<ITrasladoItemDraft>) => void;
	onAddItem: () => void;
	onRemoveItem: (index: number) => void;
}

/**
 * Líneas de un traslado.
 *
 * **Una sola condición por línea, sin condición de destino.** El contrato
 * prohíbe la conversión entre condiciones dentro de un traslado (sección 9), y
 * la card lo exige como criterio de aceptación: la UI no puede ofrecer el
 * control que haría posible convertir apto en no apto al mover.
 */
const TrasladoItemsEditor: FC<ITrasladoItemsEditorProps> = ({
	items,
	originRows,
	loadingOrigin,
	hasOrigin,
	disabled,
	balanceFor,
	errorFor,
	onChangeItem,
	onAddItem,
	onRemoveItem,
}) => (
	<div className='space-y-3'>
		<div className='overflow-x-auto'>
			<Table aria-label='Líneas del traslado' className='min-w-[720px]'>
				<THead>
					<Tr>
						<Th scope='col'>Producto</Th>
						<Th scope='col'>Condición</Th>
						<Th scope='col'>Cantidad</Th>
						<Th scope='col'>Saldo en el origen</Th>
						<Th scope='col'>
							<span className='sr-only'>Acciones</span>
						</Th>
					</Tr>
				</THead>
				<TBody>
					{items.map((item, index) => {
						const balance = balanceFor(item.productId, item.condition);
						const quantity = Number(item.quantity);
						const exceeds =
							balance !== null &&
							Number.isInteger(quantity) &&
							quantity > 0 &&
							quantity > balance;
						const productError = errorFor(index, 'productId');
						// El saldo insuficiente se avisa al escribir; el resto de los
						// mensajes de la línea vienen del esquema al enviar.
						const quantityError = exceeds
							? `No hay suficiente saldo en el origen (${balance ?? 0}).`
							: errorFor(index, 'quantity');
						return (
							// El índice es la identidad real de una línea en blanco:
							// dos filas recién agregadas no tienen todavía producto que
							// las distinga.
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
											disabled={disabled || !hasOrigin || loadingOrigin}
											value={
												item.productId === '' ? '' : String(item.productId)
											}
											onChange={(event) =>
												onChangeItem(index, {
													productId: event.target.value
														? Number(event.target.value)
														: '',
												})
											}>
											<option value=''>
												{loadingOrigin
													? 'Cargando productos…'
													: 'Selecciona un producto…'}
											</option>
											{originRows.map((row) => (
												<option key={row.product.id} value={row.product.id}>
													{row.product.sku} · {row.product.name}
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
										isValid={!quantityError}
										isTouched={Boolean(quantityError)}
										invalidFeedback={quantityError}>
										<Input
											name={`items[${index}].quantity`}
											aria-label={`Cantidad de la línea ${index + 1}`}
											type='number'
											min={1}
											disabled={disabled}
											value={item.quantity}
											onChange={(event) =>
												onChangeItem(index, {
													quantity: event.target.value,
												})
											}
											isValid={!quantityError}
											isTouched={Boolean(quantityError)}
											invalidFeedback={quantityError}
										/>
									</Validation>
								</Td>
								<Td className='tabular-nums'>
									{balance === null ? (
										<span className='text-zinc-500'>—</span>
									) : (
										balance
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
			isDisable={disabled || !hasOrigin}
			onClick={onAddItem}>
			Agregar producto
		</Button>
	</div>
);

export default TrasladoItemsEditor;
