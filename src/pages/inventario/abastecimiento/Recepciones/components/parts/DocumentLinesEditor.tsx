import React from 'react';
import classNames from 'classnames';
import type { FormikProps } from 'formik';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import type { IPurchaseDocument } from '@/interface/procurement.interface';
import type { IStockReceiptFormValues } from '../../types';

interface IDocumentLinesEditorProps {
	formik: FormikProps<IStockReceiptFormValues>;
	selectedDocument: IPurchaseDocument | null;
	loading: boolean;
	disabled: boolean;
	fieldClassName?: string;
}

const readLineError = (
	errors: FormikProps<IStockReceiptFormValues>['errors']['items'],
	index: number,
): string | undefined => {
	if (!Array.isArray(errors)) return undefined;
	const lineErrors: unknown = errors[index];
	if (typeof lineErrors !== 'object' || lineErrors === null || !('quantity' in lineErrors))
		return undefined;
	return typeof lineErrors.quantity === 'string' ? lineErrors.quantity : undefined;
};

/**
 * Líneas de una recepción «con documento»: todas las pendientes del documento,
 * precargadas con lo pendiente (`useDocumentLinesSync`). El usuario sólo baja
 * la cantidad de lo que no llegó completo; `0` = no llegó y esa línea no viaja.
 * Producto y costo salen del documento y no se editan acá.
 */
const DocumentLinesEditor: React.FC<IDocumentLinesEditorProps> = ({
	formik,
	selectedDocument,
	loading,
	disabled,
	fieldClassName,
}) => {
	const { items, purchase_document_id: documentId } = formik.values;

	if (documentId === '') {
		return (
			<p className='text-sm text-zinc-500 dark:text-zinc-400'>
				Elige un documento para ver lo que falta recibir.
			</p>
		);
	}

	if (loading || !selectedDocument) {
		return (
			<p className='text-sm text-zinc-500 dark:text-zinc-400'>
				Cargando líneas del documento…
			</p>
		);
	}

	if (items.length === 0) {
		return (
			<Alert color='emerald' variant='outline' icon='HeroCheckCircle'>
				Este documento ya se recibió completo: no quedan unidades pendientes.
			</Alert>
		);
	}

	const lineById = new Map(selectedDocument.items.map((line) => [line.id, line]));
	const receivedTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
	const receivedLines = items.filter((item) => Number(item.quantity) > 0).length;
	const showErrors = formik.submitCount > 0;

	/**
	 * «Recibir todo» asigna el pendiente a la **primera** fila de cada línea del
	 * documento y deja en 0 las repetidas: una corrección puede traer varias
	 * filas contra la misma línea, y darles el pendiente a todas lo duplicaría.
	 */
	const setAll = (toPending: boolean) => {
		const seenLineIds = new Set<number | ''>();
		formik
			.setFieldValue(
				'items',
				items.map((item) => {
					const isFirstOfLine = !seenLineIds.has(item.purchase_document_line_id);
					seenLineIds.add(item.purchase_document_line_id);
					const quantity =
						toPending && isFirstOfLine
							? String(item.pending_quantity ?? item.quantity)
							: '0';
					return { ...item, quantity };
				}),
			)
			.catch(() => undefined);
	};

	return (
		<div className='space-y-3'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<p className='text-sm text-zinc-600 dark:text-zinc-300' aria-live='polite'>
					Recibes <strong className='tabular-nums'>{receivedTotal}</strong> unidad
					{receivedTotal === 1 ? '' : 'es'} en{' '}
					<strong className='tabular-nums'>{receivedLines}</strong> de {items.length}{' '}
					línea{items.length === 1 ? '' : 's'}.
				</p>
				<div className='flex gap-2'>
					<Button
						type='button'
						variant='outline'
						size='xs'
						icon='HeroCheck'
						isDisable={disabled}
						onClick={() => setAll(true)}>
						Recibir todo lo pendiente
					</Button>
					<Button
						type='button'
						variant='outline'
						size='xs'
						color='zinc'
						isDisable={disabled}
						onClick={() => setAll(false)}>
						Poner todo en 0
					</Button>
				</div>
			</div>

			{typeof formik.errors.items === 'string' && showErrors && (
				<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
					{formik.errors.items}
				</Alert>
			)}

			<div className='overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
				{/* En teléfono se oculta «Pedido»: «Recibido ahora» debe verse sin desplazar. */}
				<Table className='w-full sm:min-w-[640px]'>
					<THead>
						<Tr>
							<Th className='text-left'>Producto</Th>
							<Th className='hidden text-right sm:table-cell'>Pedido</Th>
							<Th className='text-right'>Pendiente</Th>
							<Th className='w-28 sm:w-40'>Recibido ahora</Th>
						</Tr>
					</THead>
					<TBody>
						{items.map((item, index) => {
							const line =
								item.purchase_document_line_id === ''
									? undefined
									: lineById.get(item.purchase_document_line_id);
							const inputId = `items.${index}.quantity`;
							const error = readLineError(formik.errors.items, index);
							const isSkipped = Number(item.quantity) === 0;
							return (
								<Tr
									// Una corrección puede repetir la línea del documento en
									// varias filas; el orden de las filas no cambia.
									// eslint-disable-next-line react/no-array-index-key
									key={index}
									className={classNames({ 'opacity-60': isSkipped })}>
									<Td>
										<label htmlFor={inputId} className='block'>
											<span className='block font-medium text-zinc-900 dark:text-white'>
												{line?.name_snapshot ?? 'Línea del documento'}
											</span>
											<span className='font-mono text-xs text-zinc-500'>
												{line?.sku_snapshot}
											</span>
										</label>
									</Td>
									<Td className='hidden text-right tabular-nums sm:table-cell'>
										{line?.quantity ?? '—'}
									</Td>
									<Td className='text-right tabular-nums'>
										{item.pending_quantity ?? '—'}
									</Td>
									<Td>
										<Validation
											isValid={!error}
											isTouched={showErrors || Boolean(error)}
											invalidFeedback={error}>
											<Input
												id={inputId}
												className={fieldClassName}
												name={inputId}
												type='number'
												min={0}
												max={item.pending_quantity}
												aria-label={`Recibido ahora de ${line?.name_snapshot ?? 'la línea'}`}
												value={item.quantity}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												isValid={!error}
												isTouched={showErrors || Boolean(error)}
												invalidFeedback={error}
											/>
										</Validation>
										{isSkipped && !error && (
											<span className='mt-1 block text-xs text-zinc-500'>
												No llegó: no se registra.
											</span>
										)}
									</Td>
								</Tr>
							);
						})}
					</TBody>
				</Table>
			</div>
		</div>
	);
};

export default DocumentLinesEditor;
