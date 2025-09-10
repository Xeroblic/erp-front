/**
 * Modal para Recibir Transferencias
 * Permite confirmar recepción de productos con validación de cantidades
 */
import React, { useState } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Badge from '@/components/ui/Badge';
import { ITransfer } from '@/interface/transfers.interface';
import { IReceiveTransferForm, IReceiveTransferRequest } from '../../types/transfers.types';

interface ReceiveTransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (receiveData: IReceiveTransferRequest) => Promise<void>;
	transfer: ITransfer | null;
	isLoading?: boolean;
}

// Esquema de validación
const receiveValidationSchema = Yup.object().shape({
	items: Yup.array()
		.of(
			Yup.object().shape({
				item_id: Yup.number().required(),
				received_quantity: Yup.number()
					.min(0, 'Cantidad no puede ser negativa')
					.max(Yup.ref('quantity'), 'No puede recibir más de lo enviado')
					.required('Cantidad recibida requerida'),
				condition: Yup.string()
					.oneOf(['GOOD', 'DAMAGED', 'MISSING'], 'Condición inválida')
					.required('Condición requerida'),
			}),
		)
		.min(1, 'Debe procesar al menos un producto'),
	notes: Yup.string().max(500, 'Notas muy largas'),
});

const ReceiveTransferModal: React.FC<ReceiveTransferModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	transfer,
	isLoading = false,
}) => {
	const conditionOptions: TSelectOptions = [
		{ value: 'GOOD', label: 'Buen estado' },
		{ value: 'DAMAGED', label: 'Dañado' },
		{ value: 'MISSING', label: 'Faltante' },
	];

	// Valores iniciales basados en la transferencia
	const getInitialValues = (): IReceiveTransferForm => {
		if (!transfer?.items) {
			return {
				items: [],
				notes: '',
				received_date: new Date().toISOString().split('T')[0],
			};
		}

		return {
			items: transfer.items.map((item) => ({
				item_id: item.id!,
				product_name: item.product?.name || '',
				product_sku: item.product?.sku || '',
				quantity: item.quantity,
				received_quantity: item.quantity, // Por defecto, recibir todo
				condition: 'GOOD',
				notes: '',
			})),
			notes: '',
			received_date: new Date().toISOString().split('T')[0],
		};
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const getConditionColor = (condition: string) => {
		switch (condition) {
			case 'GOOD':
				return 'emerald';
			case 'DAMAGED':
				return 'amber';
			case 'MISSING':
				return 'red';
			default:
				return 'gray';
		}
	};

	const calculateSummary = (items: any[]) => {
		const totalExpected = items.reduce((sum, item) => sum + item.quantity, 0);
		const totalReceived = items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
		const totalGood = items
			.filter((item) => item.condition === 'GOOD')
			.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
		const totalDamaged = items
			.filter((item) => item.condition === 'DAMAGED')
			.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
		const totalMissing = items
			.filter((item) => item.condition === 'MISSING')
			.reduce((sum, item) => sum + (item.received_quantity || 0), 0);

		return {
			totalExpected,
			totalReceived,
			totalGood,
			totalDamaged,
			totalMissing,
			isComplete: totalReceived === totalExpected,
		};
	};

	if (!transfer) {
		return null;
	}

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='4xl'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
						<Icon
							icon='HeroCheckCircle'
							className='h-6 w-6 text-green-600 dark:text-green-400'
						/>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
							Recibir Transferencia #{transfer.transfer_number}
						</h3>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							De: {transfer.from_warehouse?.name} → A: {transfer.to_warehouse?.name}
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={getInitialValues()}
				validationSchema={receiveValidationSchema}
				onSubmit={async (values) => {
					const receiveData: IReceiveTransferRequest = {
						transfer_id: transfer.id!,
						items: values.items.map((item) => ({
							item_id: item.item_id,
							received_quantity: item.received_quantity,
							condition: item.condition,
							notes: item.notes,
						})),
						received_date: values.received_date,
						notes: values.notes,
					};

					await onSubmit(receiveData);
				}}>
				{(formik) => {
					const summary = calculateSummary(formik.values.items);

					return (
						<Form>
							<ModalBody className='space-y-6'>
								{/* Información de la Transferencia */}
								<Card>
									<CardHeader>
										<CardTitle>Detalles de la Transferencia</CardTitle>
									</CardHeader>
									<CardBody>
										<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
											<div>
												<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
													Fecha de Envío
												</label>
												<p className='text-sm text-gray-900 dark:text-white'>
													{transfer.created_at
														? new Date(
																transfer.created_at,
															).toLocaleDateString('es-CO')
														: 'N/A'}
												</p>
											</div>
											<div>
												<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
													Estado Actual
												</label>
												<Badge
													color={
														transfer.status === 'SHIPPED'
															? 'blue'
															: transfer.status === 'COMPLETED'
																? 'emerald'
																: 'gray'
													}>
													{transfer.status}
												</Badge>
											</div>
											<div>
												<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
													Fecha de Recepción
												</label>
												<Input
													type='date'
													name='received_date'
													value={formik.values.received_date}
													onChange={formik.handleChange}
													max={new Date().toISOString().split('T')[0]}
												/>
											</div>
										</div>
									</CardBody>
								</Card>

								{/* Productos para Recibir */}
								<Card>
									<CardHeader>
										<CardTitle>Productos a Recibir</CardTitle>
									</CardHeader>
									<CardBody>
										<div className='space-y-4'>
											{formik.values.items.map((item, index) => (
												<Card
													key={index}
													className='border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'>
													<CardBody>
														<div className='grid grid-cols-1 gap-4 md:grid-cols-5'>
															{/* Información del Producto */}
															<div className='md:col-span-2'>
																<div className='mb-2'>
																	<h4 className='font-medium text-gray-900 dark:text-white'>
																		{item.product_name}
																	</h4>
																	<p className='text-sm text-gray-500'>
																		SKU: {item.product_sku}
																	</p>
																</div>
																<div className='flex items-center space-x-4'>
																	<div>
																		<span className='text-xs text-gray-500'>
																			Enviado:
																		</span>
																		<p className='font-semibold text-gray-900 dark:text-white'>
																			{item.quantity}
																		</p>
																	</div>
																</div>
															</div>

															{/* Cantidad Recibida */}
															<div>
																<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																	Cantidad Recibida *
																</label>
																<Input
																	type='number'
																	name={`items.${index}.received_quantity`}
																	value={item.received_quantity}
																	onChange={formik.handleChange}
																	min='0'
																	max={item.quantity}
																	className={
																		item.received_quantity >
																		item.quantity
																			? 'border-red-300 focus:border-red-500'
																			: ''
																	}
																/>
																{item.received_quantity >
																	item.quantity && (
																	<p className='mt-1 text-xs text-red-600'>
																		No puede ser mayor a lo
																		enviado
																	</p>
																)}
															</div>

															{/* Condición */}
															<div>
																<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																	Condición *
																</label>
																<SelectReact
																	name={`items.${index}.condition`}
																	options={conditionOptions}
																	value={conditionOptions.find(
																		(opt) =>
																			opt.value ===
																			item.condition,
																	)}
																	onChange={(selectedOption) => {
																		const option =
																			selectedOption as TSelectOption;
																		formik.setFieldValue(
																			`items.${index}.condition`,
																			option?.value || 'GOOD',
																		);
																	}}
																/>
															</div>

															{/* Notas */}
															<div>
																<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
																	Notas
																</label>
																<Textarea
																	name={`items.${index}.notes`}
																	value={item.notes}
																	onChange={formik.handleChange}
																	placeholder='Observaciones...'
																	rows={2}
																/>
															</div>
														</div>
													</CardBody>
												</Card>
											))}
										</div>

										{/* Resumen */}
										<div className='mt-6 border-t pt-4'>
											<h4 className='mb-4 font-medium text-gray-900 dark:text-white'>
												Resumen de Recepción
											</h4>
											<div className='grid grid-cols-2 gap-4 md:grid-cols-5'>
												<div className='text-center'>
													<p className='text-2xl font-bold text-gray-900 dark:text-white'>
														{summary.totalExpected}
													</p>
													<p className='text-sm text-gray-500'>
														Esperado
													</p>
												</div>
												<div className='text-center'>
													<p className='text-2xl font-bold text-blue-600'>
														{summary.totalReceived}
													</p>
													<p className='text-sm text-gray-500'>
														Recibido
													</p>
												</div>
												<div className='text-center'>
													<p className='text-2xl font-bold text-green-600'>
														{summary.totalGood}
													</p>
													<p className='text-sm text-gray-500'>
														Buen Estado
													</p>
												</div>
												<div className='text-center'>
													<p className='text-2xl font-bold text-yellow-600'>
														{summary.totalDamaged}
													</p>
													<p className='text-sm text-gray-500'>Dañados</p>
												</div>
												<div className='text-center'>
													<p className='text-2xl font-bold text-red-600'>
														{summary.totalMissing}
													</p>
													<p className='text-sm text-gray-500'>
														Faltantes
													</p>
												</div>
											</div>
											{summary.isComplete && (
												<div className='mt-3 flex items-center justify-center space-x-2'>
													<Icon
														icon='HeroCheckCircle'
														className='h-5 w-5 text-green-600'
													/>
													<span className='text-sm font-medium text-green-600'>
														Transferencia completa
													</span>
												</div>
											)}
										</div>
									</CardBody>
								</Card>

								{/* Notas Generales */}
								<Card>
									<CardHeader>
										<CardTitle>Observaciones Generales</CardTitle>
									</CardHeader>
									<CardBody>
										<Textarea
											name='notes'
											value={formik.values.notes}
											onChange={formik.handleChange}
											placeholder='Observaciones sobre la recepción de la transferencia...'
											rows={3}
										/>
									</CardBody>
								</Card>
							</ModalBody>

							<ModalFooter>
								<ModalFooterChild>
									<Button
										variant='outline'
										color='gray'
										onClick={onClose}
										isDisable={isLoading}>
										<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
										Cancelar
									</Button>
									<Button
										color='emerald'
										isDisable={isLoading || !formik.isValid}
										onClick={() => formik.handleSubmit()}>
										{isLoading ? (
											<>
												<Icon
													icon='HeroArrowPath'
													className='mr-2 h-4 w-4 animate-spin'
												/>
												Procesando...
											</>
										) : (
											<>
												<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
												Confirmar Recepción
											</>
										)}
									</Button>
								</ModalFooterChild>
							</ModalFooter>
						</Form>
					);
				}}
			</Formik>
		</Modal>
	);
};

export default ReceiveTransferModal;
