import React from 'react';
import { FieldArray } from 'formik';
import type { FormikProps } from 'formik';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import { CostInput } from '@/components/procurement';
import { EMPTY_RECEPCION_LINE } from '../../types';
import type { IRecepcionLineFormValues, IStockReceiptFormValues } from '../../types';

interface IManualLinesEditorProps {
	formik: FormikProps<IStockReceiptFormValues>;
	productOptions: TSelectOption[];
	/** Con proveedor conocido el costo unitario es obligatorio (lo valida el servicio). */
	isCostRequired: boolean;
	disabled: boolean;
	fieldClassName?: string;
	selectClassName?: string;
	itemClassName?: string;
}

type TLineField = keyof IRecepcionLineFormValues;

const readRecord = (value: unknown, index: number): Record<string, unknown> | undefined => {
	if (!Array.isArray(value)) return undefined;
	const entry: unknown = value[index];
	return typeof entry === 'object' && entry !== null
		? (entry as Record<string, unknown>)
		: undefined;
};

/**
 * Líneas de una recepción sin documento: producto, cantidad y costo. El costo
 * usa `CostInput` (monto + base Neto/Bruto, con vista previa del IVA) en vez de
 * una casilla que cambiaba el significado del campo.
 */
const ManualLinesEditor: React.FC<IManualLinesEditorProps> = ({
	formik,
	productOptions,
	isCostRequired,
	disabled,
	fieldClassName,
	selectClassName,
	itemClassName,
}) => (
	<FieldArray name='items'>
		{(arrayHelpers) => (
			<div className='space-y-3'>
				{typeof formik.errors.items === 'string' && formik.submitCount > 0 && (
					<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
						{formik.errors.items}
					</Alert>
				)}

				{formik.values.items.map((line, index) => {
					const lineErrors = readRecord(formik.errors.items, index);
					const lineTouched = readRecord(formik.touched.items, index);
					const showErrors = formik.submitCount > 0;
					const errorFor = (field: TLineField): string | undefined => {
						const value = lineErrors?.[field];
						if (typeof value !== 'string') return undefined;
						return showErrors || lineTouched?.[field] ? value : undefined;
					};

					return (
						<div
							// eslint-disable-next-line react/no-array-index-key -- las líneas nuevas todavía no tienen id propio.
							key={index}
							className={itemClassName}>
							<div className='grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-start'>
								<div className='space-y-1'>
									<Label htmlFor={`items.${index}.product_id`}>
										Producto
										<span className='text-red-500'> *</span>
									</Label>
									<Validation
										isValid={!errorFor('product_id')}
										isTouched={Boolean(errorFor('product_id'))}
										invalidFeedback={errorFor('product_id')}>
										<SelectReact
											className={selectClassName}
											name={`items.${index}.product_id`}
											inputId={`items.${index}.product_id`}
											isDisabled={disabled}
											options={productOptions}
											placeholder='Busca un producto…'
											value={
												productOptions.find(
													(option) =>
														option.value === String(line.product_id),
												) ?? null
											}
											onChange={(option) => {
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
											isTouched={Boolean(errorFor('product_id'))}
											invalidFeedback={errorFor('product_id')}
										/>
									</Validation>
								</div>
								<div className='space-y-1'>
									<Label htmlFor={`items.${index}.quantity`}>
										Cantidad
										<span className='text-red-500'> *</span>
									</Label>
									<Validation
										isValid={!errorFor('quantity')}
										isTouched={Boolean(errorFor('quantity'))}
										invalidFeedback={errorFor('quantity')}>
										<Input
											id={`items.${index}.quantity`}
											className={fieldClassName}
											name={`items.${index}.quantity`}
											type='number'
											min={1}
											value={line.quantity}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={!errorFor('quantity')}
											isTouched={Boolean(errorFor('quantity'))}
											invalidFeedback={errorFor('quantity')}
										/>
									</Validation>
								</div>
								<div className='sm:pt-6'>
									<Button
										type='button'
										variant='outline'
										color='red'
										size='sm'
										icon='HeroTrash'
										aria-label={`Quitar producto ${index + 1}`}
										onClick={() => arrayHelpers.remove(index)}
										isDisable={disabled || formik.values.items.length === 1}
									/>
								</div>
							</div>
							<CostInput
								// Mismo fondo blanco que el resto de los campos del modal.
								className='mt-3 [&_input]:!bg-white dark:[&_input]:!bg-zinc-900 [&_select]:!bg-white dark:[&_select]:!bg-zinc-900'
								label={
									isCostRequired
										? 'Costo unitario (obligatorio con proveedor)'
										: 'Costo unitario (opcional)'
								}
								amountName={`items.${index}.unit_cost`}
								basisName={`items.${index}.unit_cost_basis`}
								amountValue={line.unit_cost}
								basisValue={line.unit_cost_basis}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								amountError={errorFor('unit_cost')}
								basisError={errorFor('unit_cost_basis')}
								disabled={disabled}
							/>
						</div>
					);
				})}

				<Button
					type='button'
					variant='outline'
					size='sm'
					icon='HeroPlus'
					isDisable={disabled}
					onClick={() => arrayHelpers.push({ ...EMPTY_RECEPCION_LINE })}>
					Agregar producto
				</Button>
			</div>
		)}
	</FieldArray>
);

export default ManualLinesEditor;
