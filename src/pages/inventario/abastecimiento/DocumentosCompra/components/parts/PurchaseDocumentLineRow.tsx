import React from 'react';
import type { FormikProps } from 'formik';
import type { InputActionMeta } from 'react-select';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import { formatPesoInput } from '@/utils/procurementDecimal.util';
import {
	DOCUMENTO_ITEM_CLASSNAME,
	DOCUMENTO_ITEM_GRID_CLASSNAME,
	DOCUMENTO_TOTAL_OUTPUT_CLASSNAME,
} from './purchaseDocumentFormStyles';
import type usePurchasableProductOptions from '../../hooks/usePurchasableProductOptions';
import type { IDocumentoCompraLineFormValues, IPurchaseDocumentFormValues } from '../../types';
import { formatGrossTotal, getLineGrossTotalCents } from '../../utils/purchaseDocumentTotals';

interface IPurchaseDocumentLineRowProps {
	formik: FormikProps<IPurchaseDocumentFormValues>;
	line: IDocumentoCompraLineFormValues;
	index: number;
	subsidiaryId: number | null;
	productOptions: ReturnType<typeof usePurchasableProductOptions>;
	isEditingDisabled?: boolean;
	/** Bloquea «Nuevo producto» mientras se guarda o el documento no se puede guardar. */
	isCreateProductDisabled: boolean;
	/** La última línea no se elimina: el documento exige al menos una. */
	isOnlyLine: boolean;
	onRemove: () => void;
	/** Abre el alta de producto en línea para esta línea. */
	onCreateProduct: () => void;
	onPesoChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Una línea del documento: cantidad, producto, costo con su base y total con IVA. */
const PurchaseDocumentLineRow: React.FC<IPurchaseDocumentLineRowProps> = ({
	formik,
	line,
	index,
	subsidiaryId,
	productOptions,
	isEditingDisabled = false,
	isCreateProductDisabled,
	isOnlyLine,
	onRemove,
	onCreateProduct,
	onPesoChange,
}) => {
	const lineErrors = Array.isArray(formik.errors.items) ? formik.errors.items[index] : undefined;
	const lineTouched = Array.isArray(formik.touched.items)
		? formik.touched.items[index]
		: undefined;
	const errorFor = (field: keyof typeof line): string | undefined => {
		if (!lineErrors || typeof lineErrors === 'string') return undefined;
		const value = (lineErrors as Record<string, unknown>)[field];
		return typeof value === 'string' ? value : undefined;
	};
	const touchedFor = (field: keyof typeof line): boolean =>
		Boolean(
			lineTouched &&
				typeof lineTouched === 'object' &&
				(lineTouched as Record<string, unknown>)[field],
		);
	const calculatesVat = line.unit_cost_basis === 'net';
	const grossTotal = formatGrossTotal(
		getLineGrossTotalCents(line.quantity, line.unit_cost, line.unit_cost_basis),
	);

	return (
		<div className={DOCUMENTO_ITEM_CLASSNAME}>
			<div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
				<span className='rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 ring-inset dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/30'>
					Línea {index + 1}
				</span>
				<Button
					type='button'
					variant='outline'
					color='red'
					size='xs'
					icon='HeroTrash'
					onClick={onRemove}
					isDisable={isOnlyLine}>
					Eliminar
				</Button>
			</div>
			<div className={DOCUMENTO_ITEM_GRID_CLASSNAME}>
				<div className='space-y-1'>
					<Label htmlFor={`items.${index}.quantity`}>
						Cantidad <span className='text-red-500'>*</span>
					</Label>
					<Input
						id={`items.${index}.quantity`}
						className='bg-white! dark:bg-zinc-900!'
						name={`items.${index}.quantity`}
						type='number'
						min={1}
						value={line.quantity}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						isValid={!errorFor('quantity')}
						isTouched={touchedFor('quantity')}
						invalidFeedback={errorFor('quantity')}
					/>
				</div>
				<div className='space-y-1'>
					<div className='relative'>
						<Label htmlFor={`items.${index}.product_id`} className='pe-36'>
							Producto <span className='text-red-500'>*</span>
						</Label>
						{/* Botón fuera del flujo: la fila del label mide lo mismo que en Cantidad y Costo. */}
						<ProtectedButton
							type='button'
							permission='create-product'
							subsidiaryId={subsidiaryId}
							scope='access'
							fallbackMode='hidden'
							size='xs'
							variant='outline'
							color='blue'
							icon='HeroPlus'
							className='absolute -top-1 right-0 whitespace-nowrap'
							isDisable={isCreateProductDisabled}
							onClick={onCreateProduct}>
							Nuevo producto
						</ProtectedButton>
					</div>
					<SelectReact
						name={`items.${index}.product_id`}
						inputId={`items.${index}.product_id`}
						options={productOptions.options}
						isDisabled={isEditingDisabled}
						placeholder='Busca por nombre o SKU…'
						// La búsqueda la hace el servidor: filtrar otra vez acá escondería coincidencias por código de barras.
						filterOption={null}
						// Elegir o cerrar el menú vacía la caja: el término compartido se vacía con ella.
						onInputChange={(text: string, meta: InputActionMeta) => {
							if (meta.action === 'input-change') productOptions.onSearchChange(text);
							else productOptions.clearSearch();
						}}
						isLoading={productOptions.loading}
						noOptionsMessage={() =>
							productOptions.loading
								? 'Buscando…'
								: 'Sin productos no serializados que coincidan.'
						}
						value={productOptions.getOption(line.product_id)}
						onChange={(option) => {
							if (isEditingDisabled) return;
							const selected = option as TSelectOption | null;
							if (Array.isArray(selected)) return;
							formik
								.setFieldValue(
									`items.${index}.product_id`,
									selected ? Number(selected.value) : '',
								)
								.catch(() => undefined);
						}}
						isValid={!errorFor('product_id')}
						isTouched={touchedFor('product_id')}
						invalidFeedback={errorFor('product_id')}
					/>
				</div>
				<div className='space-y-1'>
					<Label htmlFor={`items.${index}.unit_cost`}>
						{calculatesVat ? 'Costo neto' : 'Costo bruto c/ IVA'}{' '}
						<span className='text-red-500'>*</span>
					</Label>
					<Input
						id={`items.${index}.unit_cost`}
						name={`items.${index}.unit_cost`}
						className='bg-white! dark:bg-zinc-900!'
						type='text'
						inputMode='decimal'
						placeholder='$0'
						value={formatPesoInput(line.unit_cost)}
						onChange={onPesoChange(`items.${index}.unit_cost`)}
						onBlur={formik.handleBlur}
						isValid={!errorFor('unit_cost')}
						isTouched={touchedFor('unit_cost')}
						invalidFeedback={errorFor('unit_cost')}
					/>
					<Checkbox
						id={`items.${index}.unit_cost_basis`}
						name={`items.${index}.unit_cost_basis`}
						checked={calculatesVat}
						onChange={(event) =>
							formik
								.setFieldValue(
									`items.${index}.unit_cost_basis`,
									event.target.checked ? 'net' : 'gross',
								)
								.catch(() => undefined)
						}
						label='Calcular IVA'
						dimension='sm'
					/>
					{touchedFor('unit_cost_basis') && errorFor('unit_cost_basis') && (
						<p role='alert' className='text-xs text-red-500/70'>
							{errorFor('unit_cost_basis')}
						</p>
					)}
				</div>
				<div className='space-y-1'>
					<Label htmlFor={`items.${index}.total`}>Total</Label>
					<output
						id={`items.${index}.total`}
						className={DOCUMENTO_TOTAL_OUTPUT_CLASSNAME}>
						{grossTotal ?? '—'}
					</output>
				</div>
			</div>
		</div>
	);
};

export default PurchaseDocumentLineRow;
