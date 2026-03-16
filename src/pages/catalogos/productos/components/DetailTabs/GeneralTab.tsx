import React, { useEffect } from 'react';
import { useFormikContext, useFormik } from 'formik';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { ProductDetailForm } from '../../types/products.types';
import type { IBrand } from '@/interface/brand.interface';
import { PRODUCT_STATUS_LABELS, PRODUCT_TYPE_LABELS } from '../../constants/products.constant';
import Label from '@/components/form/Label';
import Checkbox, { CheckboxGroup } from '@/components/form/Checkbox';
import Modal, { ModalBody, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface GeneralTabProps {
	brands: IBrand[];
	brandsLoading: boolean;
	hasRevisionSerials?: boolean;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
	brands,
	brandsLoading,
	hasRevisionSerials = false,
}) => {
	const { values, errors, touched, setFieldValue, submitForm } =
		useFormikContext<ProductDetailForm>();
	const [showConfirm, setShowConfirm] = React.useState(false);
	const [showConfirmStatus, setShowConfirmStatus] = React.useState(false);
	const [blockMessage, setBlockMessage] = React.useState<string | null>(null);

	const confirmFormik = useFormik<{ confirmText: string }>({
		initialValues: { confirmText: '' },
		validate: (vals) => {
			const errs: Record<string, string> = {};
			if (vals.confirmText !== 'SI') {
				errs.confirmText = "Debes escribir 'SI' para confirmar";
			}
			return errs;
		},
		onSubmit: () => {
			/* no-op: manejamos la confirmación manualmente */
		},
		validateOnChange: true,
		validateOnBlur: true,
	});

	// Sincronizar product_kind en attributes_json cuando cambia product_type
	useEffect(() => {
		if (values.product_type) {
			const productKindMap: Record<string, string> = {
				notebook: 'notebook',
				desktop_pc: 'desktop_pc',
				aio: 'aio',
				monitor: 'monitor',
				docking: 'docking',
			};

			const newProductKind = productKindMap[values.product_type];

			if (newProductKind) {
				const attrs =
					values.attributes_json && typeof values.attributes_json === 'object'
						? (values.attributes_json as Record<string, unknown>)
						: null;
				const currentProductKind =
					attrs && 'product_kind' in attrs ? attrs.product_kind : null;

				if (currentProductKind !== newProductKind) {
					void setFieldValue(
						'attributes_json',
						{
							...(values.attributes_json || {}),
							product_kind: newProductKind,
						},
						false,
					);
				}
			} else if (values.product_type === 'general' && values.attributes_json) {
				void setFieldValue('attributes_json', null, false);
			}
		}
	}, [values.product_type, setFieldValue]);

	const productTypeOptions = Object.entries(PRODUCT_TYPE_LABELS).map(([key, label]) => ({
		value: key,
		label,
	}));

	const brandOptions = brands.map((brand) => ({
		value: String(brand.id),
		label: brand.name,
	}));

	const statusOptions = [
		{ value: 'pending', label: 'Pendiente' },
		{ value: 'validated', label: 'Validado (Publicado)' },
		{ value: 'rejected', label: 'Rechazado' },
		{ value: 'archived', label: 'Archivado' },
	];

	return (
		<>
			<div className='mb-6 block'>
				<Label htmlFor='product_type' className='text-sm font-medium'>
					Tipo de producto
				</Label>
				<SelectReact
					name='product_type'
					value={productTypeOptions.find((opt) => opt.value === values.product_type)}
					options={productTypeOptions}
					onChange={(option) => {
						const selected = option as TSelectOption;
						if (selected) setFieldValue('product_type', selected.value);
					}}
				/>
				{touched.product_type && errors.product_type && (
					<p className='text-xs text-red-500'>{errors.product_type}</p>
				)}
			</div>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div className='space-y-1'>
					<Label htmlFor='sku' className='text-sm font-medium'>
						SKU
					</Label>
					<Input
						name='sku'
						placeholder='Ej: PROD-001'
						value={values.sku}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setFieldValue('sku', event.target.value)
						}
						isValid={!errors.sku}
						isTouched={touched.sku}
						invalidFeedback={errors.sku}
					/>
					{touched.sku && errors.sku && (
						<p className='text-xs text-red-500'>{errors.sku}</p>
					)}
				</div>

				<div className='space-y-1'>
					<Label htmlFor='name_product' className='text-sm font-medium'>
						Nombre del producto
					</Label>
					<Input
						name='name'
						placeholder='Nombre descriptivo del producto'
						value={values.name}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setFieldValue('name', event.target.value)
						}
						isValid={!errors.name}
						isTouched={touched.name}
						invalidFeedback={errors.name}
					/>
					{touched.name && errors.name && (
						<p className='text-xs text-red-500'>{errors.name}</p>
					)}
				</div>

				<div className='space-y-1'>
					<Label htmlFor='brand_id' className='text-sm font-medium'>
						Marca {brandsLoading ? '(Cargando...)' : `(${brands.length} disponibles)`}
					</Label>
					<SelectReact
						name='brand_id'
						value={brandOptions.find((opt) => opt.value === String(values.brand_id))}
						options={brandOptions}
						onChange={(option) => {
							const selected = option as TSelectOption;
							setFieldValue('brand_id', selected ? Number(selected.value) : '');
						}}
						isDisabled={brandsLoading}
						placeholder='Seleccionar marca'
					/>
					{touched.brand_id && errors.brand_id && (
						<p className='text-xs text-red-500'>{errors.brand_id}</p>
					)}
				</div>

				<div className='space-y-1'>
					<Label htmlFor='product_status' className='text-sm font-medium'>
						Estado de publicación
					</Label>
					<SelectReact
						name='product_status'
						value={statusOptions.find(
							(opt) => opt.value === (values.product_status || 'pending'),
						)}
						options={statusOptions}
						onChange={(option) => {
							const selected = option as TSelectOption;
							if (selected) setFieldValue('product_status', selected.value);
						}}
					/>
					{touched.product_status && errors.product_status && (
						<p className='text-xs text-red-500'>{errors.product_status}</p>
					)}
				</div>

				<div className='space-y-1'>
					<Label htmlFor='serial_tracking' className='flex items-center gap-2'>
						<Checkbox
							id='serial_tracking'
							checked={values.serial_tracking}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const next = event.target.checked;

								if (!next && values.serial_tracking) {
									if (hasRevisionSerials) {
										setBlockMessage(
											'No se puede quitar el seguimiento: existen series registradas en revisiones. Asigne o edite las series antes de desactivar.',
										);
										return;
									}

									setShowConfirm(true);
									return;
								}

								setBlockMessage(null);
								setShowConfirm(false);
								setFieldValue('serial_tracking', next);
							}}
							className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Seguimiento por número de serie</span>
					</Label>
					{touched.serial_tracking && errors.serial_tracking && (
						<p className='text-xs text-red-500'>{errors.serial_tracking}</p>
					)}

					{blockMessage && (
						<p className='mt-2 text-xs text-red-600' role='alert'>
							{blockMessage}
						</p>
					)}

					<Modal isOpen={showConfirm} setIsOpen={setShowConfirm} size='sm' isCentered>
						<ModalHeader>Confirmar</ModalHeader>
						<ModalBody>
							<p className='mb-4 text-sm text-neutral-700 dark:text-neutral-300'>
								Para confirmar que deseas quitar el seguimiento, escribe{' '}
								<strong>SI</strong> en el campo y confirma.
							</p>
							<div className='max-w-sm'>
								<Input
									name='confirmText'
									placeholder='Escribe SI para confirmar'
									value={confirmFormik.values.confirmText}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										confirmFormik.setFieldValue('confirmText', e.target.value)
									}
									onBlur={() =>
										confirmFormik.setFieldTouched('confirmText', true)
									}
									isValid={!confirmFormik.errors.confirmText}
									isTouched={Boolean(confirmFormik.touched.confirmText)}
									invalidFeedback={confirmFormik.errors.confirmText}
								/>
								<p className='mt-2 text-xs text-neutral-500'>
									Escribe explicitamente y en mayusculas SI
								</p>
							</div>
						</ModalBody>
						<ModalFooter>
							<div />
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									onClick={() => {
										setShowConfirm(false);
										confirmFormik.resetForm();
									}}>
									No
								</Button>
								<Button
									variant='solid'
									color='red'
									onClick={() => {
										const errors = confirmFormik.validateForm();
										errors.then((errs) => {
											if (!errs || Object.keys(errs).length === 0) {
												setFieldValue('serial_tracking', false);
												void submitForm();
												setShowConfirm(false);
												setBlockMessage(null);
												confirmFormik.resetForm();
											} else {
												confirmFormik.setFieldTouched('confirmText', true);
											}
										});
									}}>
									Sí, quitar seguimiento
								</Button>
							</div>
						</ModalFooter>
					</Modal>
				</div>
				<div className='space-y-1'>
					<Label htmlFor='is_active_checkbox' className='flex items-center gap-2'>
						<Checkbox
							id='is_active_checkbox'
							checked={values.is_active}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const next = event.target.checked;

								if (!next && values.is_active) {
									setShowConfirmStatus(true);
									return;
								}

								setFieldValue('is_active', next);
							}}
							className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Producto activo</span>
					</Label>
					{touched.is_active && errors.is_active && (
						<p className='text-xs text-red-500'>{errors.is_active}</p>
					)}

					<Modal
						isOpen={showConfirmStatus}
						setIsOpen={setShowConfirmStatus}
						size='sm'
						isCentered>
						<ModalHeader>Confirmar desactivación</ModalHeader>
						<ModalBody>
							<p className='mb-4 text-sm text-neutral-700 dark:text-neutral-300'>
								Para confirmar que deseas desactivar este producto, escribe{' '}
								<strong>SI</strong> en el campo y confirma.
							</p>
							<div className='max-w-sm'>
								<Input
									name='confirmText'
									placeholder='Escribe SI para confirmar'
									value={confirmFormik.values.confirmText}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										confirmFormik.setFieldValue('confirmText', e.target.value)
									}
									onBlur={() =>
										confirmFormik.setFieldTouched('confirmText', true)
									}
									isValid={!confirmFormik.errors.confirmText}
									isTouched={Boolean(confirmFormik.touched.confirmText)}
									invalidFeedback={confirmFormik.errors.confirmText}
								/>
								<p className='mt-2 text-xs text-neutral-500'>
									Escribe explícitamente y en mayúsculas SI
								</p>
							</div>
						</ModalBody>
						<ModalFooter>
							<div />
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									onClick={() => {
										setShowConfirmStatus(false);
										confirmFormik.resetForm();
									}}>
									No
								</Button>
								<Button
									variant='solid'
									color='red'
									onClick={() => {
										const errors = confirmFormik.validateForm();
										errors.then((errs) => {
											if (!errs || Object.keys(errs).length === 0) {
												setFieldValue('is_active', false);
												void submitForm();
												setShowConfirmStatus(false);
												confirmFormik.resetForm();
											} else {
												confirmFormik.setFieldTouched('confirmText', true);
											}
										});
									}}>
									Sí, desactivar producto
								</Button>
							</div>
						</ModalFooter>
					</Modal>
				</div>
			</div>
		</>
	);
};

export default GeneralTab;
