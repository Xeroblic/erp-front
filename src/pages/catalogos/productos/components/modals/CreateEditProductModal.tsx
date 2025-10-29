import React, { useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers, FieldProps } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import SelectReact, { TSelectOptions, TSelectOption } from '@/components/form/SelectReact';
import { toast } from 'react-toastify';
import type { IProduct } from '@/interface/product.interface';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import { PRODUCT_FORM_SECTIONS, PRODUCT_TOGGLES } from '../../constants/products.constant';
import {
	buildInitialValues,
	buildSubmitPayload,
	createBrandOptions,
	createCategoryOptions,
} from '../../utils/productForm.utils';
import { productSchema, productSchemaCreate } from '../../validation/productForm.schema';
import type { ProductFormValues } from '../../types/products.types';
import Select from '@/components/form/Select';
import { PRODUCT_DEVICE_TYPES } from '../../constants/product-attributes.constants';
import UserBranchSelector from './components/UserBranchSelector';
import { useAppSelector } from '@/store';

interface CreateEditProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (payload: { data: Partial<IProduct>; categoryIds: number[] }) => Promise<void>;
	product?: IProduct;
	brands: IBrand[];
	categories: ICategory[];
	isLoading?: boolean;
}

type ProductToggleKey = Extract<(typeof PRODUCT_TOGGLES)[number]['key'], keyof ProductFormValues>;

const FieldContainer: React.FC<{
	id: string;
	label: string;
	children: React.ReactNode;
	error?: string;
}> = ({ id, label, children, error }) => (
	<div className='space-y-1'>
		<label className='text-sm font-medium' htmlFor={id}>
			{label}
		</label>
		{children}
		{error && <p className='text-xs text-red-500'>{error}</p>}
	</div>
);

const CreateEditProductModal: React.FC<CreateEditProductModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	product,
	brands,
	categories,
	isLoading = false,
}) => {
	const currentUser = useAppSelector((state) => state.auth.user);
	const isEditMode = !!product;

	const userId = currentUser?.id || currentUser?.pk;

	const brandOptions: TSelectOptions = useMemo(
		() => createBrandOptions(brands).map((option) => ({ ...option })),
		[brands],
	);

	const categoryOptions: TSelectOptions = useMemo(
		() => createCategoryOptions(categories).map((option) => ({ ...option })),
		[categories],
	);

	const initialValues = useMemo<ProductFormValues>(() => {
		const values = buildInitialValues(product);
		return values;
	}, [product]);

	const handleSubmit = async (
		values: ProductFormValues,
		{ setSubmitting, resetForm, setErrors }: FormikHelpers<ProductFormValues>,
	) => {
		try {
			let payload: { data: Partial<IProduct>; categoryIds: number[] };
			if (product) {
				payload = buildSubmitPayload(values);
			} else {
				const categoryIds = (values.categories || []).map((c) => Number(c.value));

				const data: Partial<IProduct> = {
					sku: values.sku.trim(),
					name: values.name.trim(),
					brand_id: Number(values.brand_id),
					price: Number(values.price),
					is_active: typeof values.is_active === 'boolean' ? values.is_active : true,
					serial_tracking:
						typeof values.serial_tracking === 'boolean'
							? values.serial_tracking
							: false,
				};

				// Agregar branch_id si está presente (solo en crear)
				if (values.branch_id) {
					data.branch_id = Number(values.branch_id);
				}

				if (values.commercial_sku?.trim())
					data.commercial_sku = values.commercial_sku.trim();
				if (values.barcode?.trim()) data.barcode = values.barcode.trim();
				if (values.product_type) data.product_type = values.product_type;
				if (values.condition_policy) data.condition_policy = values.condition_policy;
				if (values.uom) data.uom = values.uom;
				if (values.cost !== '' && values.cost !== undefined)
					data.cost = Number(values.cost);
				if (values.offer_price !== '' && values.offer_price !== undefined)
					data.offer_price = Number(values.offer_price);
				if (values.warranty_months !== '' && values.warranty_months !== undefined)
					data.warranty_months = Number(values.warranty_months);

				payload = { data, categoryIds };
			}

			await onSubmit(payload);

			if (!product) {
				resetForm();
			}
			onClose();
		} catch (error: any) {
			const payload = error?.response?.data ?? error ?? {};
			if (payload && typeof payload === 'object') {
				const serverErrors: Record<string, string> = {};
				if (payload.errors && typeof payload.errors === 'object') {
					Object.entries(payload.errors).forEach(([key, val]) => {
						if (Array.isArray(val) && val.length) serverErrors[key] = String(val[0]);
						else if (typeof val === 'string') serverErrors[key] = val;
					});
					if (serverErrors['category_ids'] && !serverErrors['categories']) {
						serverErrors['categories'] = serverErrors['category_ids'];
					}
				}

				if (Object.keys(serverErrors).length) {
					setErrors(serverErrors as any);
				}

				const message =
					typeof payload.message === 'string'
						? payload.message
						: (payload?.message ??
							'No se pudo guardar el producto. Intenta nuevamente.');
				toast.error(message);
			} else {
				const message =
					typeof error === 'string'
						? error
						: (error?.message ?? 'No se pudo guardar el producto. Intenta nuevamente.');
				toast.error(message);
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='md'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<Icon
						icon={product ? 'HeroPencilSquare' : 'HeroSparkles'}
						className='h-5 w-5'
					/>
					<div>
						<p className='text-lg font-semibold'>
							{product ? 'Editar producto' : 'Nuevo producto'}
						</p>
						<p className='text-sm text-neutral-500'>
							Completa la informacion para sincronizar el producto.
						</p>
					</div>
				</div>
			</ModalHeader>
			<Formik
				initialValues={initialValues}
				validationSchema={product ? productSchema : productSchemaCreate}
				enableReinitialize
				onSubmit={handleSubmit}>
				{({
					values,
					errors,
					touched,
					setFieldValue,
					setFieldTouched,
					isSubmitting,
					submitForm,
				}) => {
					const isBusy = isLoading || isSubmitting;

					return (
						<Form id='productForm'>
							<ModalBody className='space-y-5'>
								{PRODUCT_FORM_SECTIONS.map((section) => (
									<Card key={section.key} className={section.cardClass}>
										<CardHeader className='pb-2'>
											<div className='flex items-start gap-3'>
												<Icon icon={section.icon} className='h-5 w-5' />
												<div>
													<CardTitle className='text-base font-semibold'>
														{section.title}
													</CardTitle>
													<p className='text-sm text-neutral-500'>
														{section.description}
													</p>
												</div>
											</div>
										</CardHeader>
										<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
											{section.key === 'general' && (
												<>
													<Field name='sku'>
														{({ field, meta }: FieldProps) => (
															<FieldContainer
																id='sku'
																label='SKU'
																error={
																	meta.touched
																		? (meta.error as string)
																		: undefined
																}>
																<Input
																	id='sku'
																	{...field}
																	required
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
													<Field name='name'>
														{({ field, meta }: FieldProps) => (
															<FieldContainer
																id='name'
																label='Nombre'
																error={
																	meta.touched
																		? (meta.error as string)
																		: undefined
																}>
																<Input
																	id='name'
																	{...field}
																	required
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
													{/* Selector de Branch - Solo en modo CREAR */}
													{(!isEditMode && userId) && (
														<div className='space-y-2 md:col-span-2'>
															<UserBranchSelector
																userId={userId}
																name='branch_id'
																value={values.branch_id ?? ''}
																onChange={(branchId) => {
																	setFieldValue(
																		'branch_id',
																		branchId,
																	);
																	setFieldTouched(
																		'branch_id',
																		true,
																	);
																}}
																label='Sucursal *'
																placeholder='Selecciona la sucursal para este producto'
																disabled={isBusy}
																required
															/>
															{touched.branch_id &&
																errors.branch_id && (
																	<p className='text-xs text-red-500'>
																		{typeof errors.branch_id ===
																		'string'
																			? errors.branch_id
																			: 'Selecciona una sucursal'}
																	</p>
																)}
														</div>
													)}

													<div className='space-y-2 md:col-span-2'>
														<p className='text-sm font-medium'>Marca</p>
														<SelectReact
															name='brand_id'
															options={brandOptions}
															value={
																brandOptions.find(
																	(option) =>
																		String(option.value) ===
																		String(values.brand_id),
																) ?? null
															}
															onChange={(option) =>
																setFieldValue(
																	'brand_id',
																	(option as TSelectOption | null)
																		?.value ?? '',
																)
															}
															onBlur={() =>
																setFieldTouched('brand_id', true)
															}
															placeholder={
																isBusy
																	? 'Cargando marcas...'
																	: !brandOptions.length && !values.branch_id
																	? 'Selecciona la sucursal primero'
																	: 'Selecciona una marca'
															}
															// Disable only while busy or when there are no brands for the selected branch
															isDisabled={isBusy || (!brandOptions.length && !values.branch_id)}
															menuPortalTarget={document.body}
															styles={{
																menuPortal: (base) => ({
																	...base,
																	zIndex: 9999,
																}),
															}}
														/>
														{touched.brand_id && errors.brand_id && (
															<p className='text-xs text-red-500'>
																{errors.brand_id}
															</p>
														)}
													</div>

													<Field name='uom'>
														{({ field }: FieldProps) => (
															<FieldContainer
																id='uom'
																label='Unidad de medida'>
																<Input
																	id='uom'
																	{...field}
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
													<Field name='condition_policy'>
														{({ field }: FieldProps) => (
															<FieldContainer
																id='condition_policy'
																label='Condicion'>
																<Input
																	id='condition_policy'
																	{...field}
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
												</>
											)}

											{section.key === 'pricing' && (
												<>
													<Field name='price'>
														{({ field, meta }: FieldProps) => (
															<FieldContainer
																id='price'
																label='Precio'
																error={
																	meta.touched
																		? (meta.error as string)
																		: undefined
																}>
																<Input
																	id='price'
																	type='number'
																	min='0'
																	{...field}
																	required
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
													<Field name='cost'>
														{({ field }: FieldProps) => (
															<FieldContainer id='cost' label='Costo'>
																<Input
																	id='cost'
																	type='number'
																	min='0'
																	{...field}
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
													<Field name='offer_price'>
														{({ field }: FieldProps) => (
															<FieldContainer
																id='offer_price'
																label='Precio oferta'>
																<Input
																	id='offer_price'
																	type='number'
																	min='0'
																	{...field}
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
													<Field name='warranty_months'>
														{({ field }: FieldProps) => (
															<FieldContainer
																id='warranty_months'
																label='Meses de garantia'>
																<Input
																	id='warranty_months'
																	type='number'
																	min='0'
																	{...field}
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
												</>
											)}

											{section.key === 'classification' && (
												<>
													<div className='space-y-2'>
														<p className='text-sm font-medium'>
															Tipo de dispositivo
														</p>
														<Select
															name='product_type'
															value={
																PRODUCT_DEVICE_TYPES.some(
																	(opt) =>
																		opt.value ===
																		values.product_type,
																)
																	? values.product_type
																	: ''
															}
															onChange={(
																event: React.ChangeEvent<HTMLSelectElement>,
															) =>
																setFieldValue(
																	'product_type',
																	event.target.value,
																)
															}
															disabled={isBusy}>
															<option value=''>
																Seleccionar tipo
															</option>
															{PRODUCT_DEVICE_TYPES.map((option) => (
																<option
																	key={option.value}
																	value={option.value}>
																	{option.label}
																</option>
															))}
														</Select>
													</div>
													<div className='space-y-2 md:col-span-2'>
														<p className='text-sm font-medium'>
															Categorias
														</p>
														<SelectReact
															name='categories'
															isMulti
															options={categoryOptions}
															value={values.categories.map(
																(option) => ({
																	value: option.value,
																	label: option.label,
																}),
															)}
															onChange={(option) =>
																setFieldValue(
																	'categories',
																	(
																		(option as TSelectOption[]) ??
																		[]
																	).map((item) => ({
																		value: item.value,
																		label: item.label,
																	})),
																)
															}
															onBlur={() =>
																setFieldTouched('categories', true)
															}
															isDisabled={
																isBusy || !categoryOptions.length
															}
															placeholder='Selecciona las categorias'
															menuPortalTarget={document.body}
															styles={{
																menuPortal: (base) => ({
																	...base,
																	zIndex: 9999,
																}),
															}}
														/>
														<ErrorMessage name='categories'>
															{(msg) => (
																<p className='text-xs text-red-500'>
																	{msg}
																</p>
															)}
														</ErrorMessage>
													</div>
												</>
											)}
										</CardBody>
									</Card>
								))}

								<Card>
									<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										{PRODUCT_TOGGLES.map((toggle) => (
											<div
												key={toggle.key}
												className='flex items-center gap-4 rounded-lg border p-4'>
												<span className='flex h-11 w-11 items-center justify-center rounded-lg border'>
													<Icon icon={toggle.icon} className='h-5 w-5' />
												</span>
												<div className='flex-1'>
													<p className='text-sm font-semibold'>
														{toggle.title}
													</p>
													<p className='text-xs text-neutral-500'>
														{toggle.description}
													</p>
												</div>
												<Checkbox
													checked={
														values[
															toggle.key as ProductToggleKey
														] as boolean
													}
													onChange={(event) =>
														setFieldValue(
															toggle.key,
															event.target.checked,
														)
													}
													disabled={isBusy}
												/>
											</div>
										))}
									</CardBody>
								</Card>
							</ModalBody>

							<ModalFooter>
								<div className='flex w-full justify-end gap-3'>
									<Button
										variant='outline'
										onClick={onClose}
										isDisable={isBusy}
										icon='HeroXMark'>
										Cancelar
									</Button>
									<Button
										onClick={(e) => {
											e.preventDefault();
											submitForm();
										}}
										color='blue'
										isLoading={isBusy}
										isDisable={isBusy}
										icon={product ? 'HeroArrowPath' : 'HeroCheck'}>
										{product ? 'Actualizar producto' : 'Crear producto'}
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

export default CreateEditProductModal;
