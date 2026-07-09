import React, { useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import salesService from '@/services/salesService';
import type { ISaleItem } from '@/interface/sales.interface';

interface Props {
	open: boolean;
	onClose: () => void;
	subsidiaryId: number;
	saleId: number;
	items: ISaleItem[];
	onSuccess?: () => void;
}

interface CorrectSerialFormValues {
	sale_item_id: number | '';
	old_serial: string;
	new_serial: string;
	reason: string;
}

/** Series conocidas del ítem (vendidas y/o devueltas) desde meta_json. */
const getItemSerials = (item: ISaleItem): string[] => {
	const reservation = (item.meta_json as Record<string, unknown> | undefined)?.reservation as
		| Record<string, unknown>
		| undefined;
	const sold = (reservation?.sold_serials as string[] | undefined) ?? [];
	const returned = (reservation?.returned_serials as string[] | undefined) ?? [];
	return Array.from(
		new Set(
			[...sold, ...returned]
				.filter((s): s is string => typeof s === 'string')
				.map((s) => s.trim())
				.filter(Boolean),
		),
	);
};

const CorrectSerialSchema = Yup.object({
	sale_item_id: Yup.number()
		.typeError('Selecciona un ítem')
		.required('Selecciona un ítem'),
	old_serial: Yup.string().trim().required('Selecciona la serie a corregir').max(255),
	new_serial: Yup.string()
		.trim()
		.required('Ingresa la serie correcta')
		.max(255)
		.notOneOf([Yup.ref('old_serial')], 'Debe ser distinta a la serie actual'),
	// El backend lo marca opcional; aquí es obligatorio por decisión de negocio.
	reason: Yup.string().trim().required('El motivo es obligatorio').max(500),
});

const CorrectSerialModal: React.FC<Props> = ({
	open,
	onClose,
	subsidiaryId,
	saleId,
	items,
	onSuccess,
}) => {
	// Solo ítems con series conocidas son corregibles.
	const serialItems = useMemo(
		() => items.filter((it) => getItemSerials(it).length > 0),
		[items],
	);

	const itemOptions = useMemo(
		() =>
			serialItems.map((it) => ({
				value: String(it.id),
				label: `${it.sku ? `${it.sku} — ` : ''}${it.product?.name || it.name || `Ítem #${it.id}`}`,
			})),
		[serialItems],
	);

	const initialValues: CorrectSerialFormValues = {
		sale_item_id: serialItems.length === 1 ? serialItems[0].id : '',
		old_serial: '',
		new_serial: '',
		reason: '',
	};

	const handleSubmit = async (
		values: CorrectSerialFormValues,
		{ setSubmitting }: { setSubmitting: (v: boolean) => void },
	) => {
		try {
			const res = await salesService.correctSaleSerials(subsidiaryId, saleId, [
				{
					sale_item_id: Number(values.sale_item_id),
					old_serial: values.old_serial.trim(),
					new_serial: values.new_serial.trim(),
					reason: values.reason.trim(),
				},
			]);
			toast.success(res.message || 'Series corregidas correctamente');
			onSuccess?.();
			onClose();
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string }>;
			const status = axiosError.response?.status;
			const message = axiosError.response?.data?.message;
			if (status === 403) {
				toast.error(message || 'No tienes permiso para corregir series en esta sucursal.');
			} else if (status === 422) {
				// Error de validación de negocio (producto/grade/estado/serie).
				toast.error(message || 'La corrección no es válida.');
			} else {
				toast.error(message || 'No se pudo corregir la serie.');
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal isOpen={open} setIsOpen={onClose} size='lg' isScrollable isStaticBackdrop>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30'>
						<Icon
							icon='HeroArrowsRightLeft'
							className='h-6 w-6 text-sky-700 dark:text-sky-300'
						/>
					</div>
					<div>
						<Badge className='text-lg font-bold'>Corregir serie</Badge>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>
							Intercambio atómico de una serie mal asignada. No altera montos ni el
							estado de la venta.
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={initialValues}
				validationSchema={CorrectSerialSchema}
				onSubmit={handleSubmit}>
				{(formik) => {
					const selectedItem = serialItems.find(
						(it) => it.id === Number(formik.values.sale_item_id),
					);
					const oldSerialOptions = selectedItem
						? getItemSerials(selectedItem).map((sn) => ({ value: sn, label: sn }))
						: [];

					return (
						<Form>
							<ModalBody className='space-y-4'>
								{serialItems.length === 0 ? (
									<Alert
										color='amber'
										colorIntensity='500'
										variant='outline'
										icon='HeroExclamationTriangle'
										className='text-sm'>
										Esta venta no tiene ítems con series asignadas para corregir.
									</Alert>
								) : (
									<>
										<div>
											<Label htmlFor='sale_item_id'>Ítem</Label>
											<SelectReact
												id='sale_item_id'
												name='sale_item_id'
												options={itemOptions}
												value={
													itemOptions.find(
														(o) =>
															Number(o.value) ===
															Number(formik.values.sale_item_id),
													) || null
												}
												onChange={(option: any) => {
													formik.setFieldValue(
														'sale_item_id',
														option?.value ? Number(option.value) : '',
													);
													// Al cambiar de ítem, resetea la serie vieja.
													formik.setFieldValue('old_serial', '');
												}}
												onBlur={() =>
													formik.setFieldTouched('sale_item_id', true)
												}
												placeholder='Selecciona el ítem a corregir'
											/>
											{formik.touched.sale_item_id &&
												formik.errors.sale_item_id && (
													<p className='mt-1 text-xs text-red-500'>
														{formik.errors.sale_item_id}
													</p>
												)}
										</div>

										<div>
											<Label htmlFor='old_serial'>Serie incorrecta (actual)</Label>
											<SelectReact
												id='old_serial'
												name='old_serial'
												options={oldSerialOptions}
												value={
													oldSerialOptions.find(
														(o) => o.value === formik.values.old_serial,
													) || null
												}
												onChange={(option: any) =>
													formik.setFieldValue(
														'old_serial',
														option?.value ?? '',
													)
												}
												onBlur={() =>
													formik.setFieldTouched('old_serial', true)
												}
												isDisabled={!selectedItem}
												placeholder={
													selectedItem
														? 'Selecciona la serie a reemplazar'
														: 'Primero selecciona un ítem'
												}
											/>
											{formik.touched.old_serial &&
												formik.errors.old_serial && (
													<p className='mt-1 text-xs text-red-500'>
														{formik.errors.old_serial}
													</p>
												)}
										</div>

										<div>
											<Label htmlFor='new_serial'>Serie correcta (reemplazo)</Label>
											<Input
												id='new_serial'
												name='new_serial'
												placeholder='Escanea o ingresa la serie correcta'
												value={formik.values.new_serial}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												isValid={formik.isValid}
												isTouched={!!formik.touched.new_serial}
												invalidFeedback={formik.errors.new_serial}
											/>
											<p className='mt-1 text-xs text-zinc-500'>
												Debe estar disponible y ser del mismo producto y
												grado que el ítem.
											</p>
										</div>

										<div>
											<Label htmlFor='reason'>Motivo (obligatorio)</Label>
											<Textarea
												id='reason'
												name='reason'
												rows={3}
												placeholder='Ej: Digitación incorrecta al facturar'
												value={formik.values.reason}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
											{formik.touched.reason && formik.errors.reason && (
												<p className='mt-1 text-xs text-red-500'>
													{formik.errors.reason}
												</p>
											)}
										</div>
									</>
								)}
							</ModalBody>

							<ModalFooter>
								<div className='flex w-full justify-end gap-3'>
									<Button
										type='button'
										variant='solid'
										color='red'
										icon='HeroXMark'
										onClick={onClose}
										isDisable={formik.isSubmitting}>
										Cancelar
									</Button>
									<Button
										type='submit'
										variant='solid'
										color='sky'
										icon={formik.isSubmitting ? 'DuoLoading' : 'HeroArrowsRightLeft'}
										isLoading={formik.isSubmitting}
										isDisable={formik.isSubmitting || serialItems.length === 0}>
										Corregir serie
									</Button>
								</div>
							</ModalFooter>
						</Form>
					);
				}}
			</Formik>
		</Modal>
	);
};

export default CorrectSerialModal;
