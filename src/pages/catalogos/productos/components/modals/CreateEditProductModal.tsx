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
import { productSchema } from '../../validation/productForm.schema';
import type { ProductFormValues } from '../../types/products.types';

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
	const brandOptions: TSelectOptions = useMemo(
		() => createBrandOptions(brands).map((option) => ({ ...option })),
		[brands],
	);

	const categoryOptions: TSelectOptions = useMemo(
		() => createCategoryOptions(categories).map((option) => ({ ...option })),
		[categories],
	);

	const initialValues = useMemo<ProductFormValues>(() => buildInitialValues(product), [product]);

	const handleSubmit = async (
		values: ProductFormValues,
		{ setSubmitting, resetForm }: FormikHelpers<ProductFormValues>,
	) => {
		try {
			const payload = buildSubmitPayload(values);
			await onSubmit(payload);
			resetForm();
			toast.success(
				product ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
			);
		} catch (error: any) {
			const message =
				typeof error === 'string'
					? error
					: error?.response?.data?.message ??
					  error?.message ??
					  'No se pudo guardar el producto. Intenta nuevamente.';
			toast.error(message);
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
				validationSchema={productSchema}
				enableReinitialize
				onSubmit={handleSubmit}>
				{({ values, errors, touched, setFieldValue, setFieldTouched, isSubmitting }) => {
					const isBusy = isLoading || isSubmitting;
					return (
						<Form>
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
													<div className='space-y-2 md:col-span-2'>
														<p className='text-sm font-medium'>Marca</p>
														<SelectReact
															name='brand_id'
															options={brandOptions}
															value={
																brandOptions.find(
																	(option) =>
																		option.value ===
																		values.brand_id,
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
															placeholder='Selecciona una marca'
															isDisabled={
																isBusy || !brandOptions.length
															}
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
													<Field name='product_type'>
														{({ field, meta }: FieldProps) => (
															<FieldContainer
																id='product_type'
																label='Tipo de producto'
																error={
																	meta.touched
																		? (meta.error as string)
																		: undefined
																}>
																<Input
																	id='product_type'
																	{...field}
																	disabled={isBusy}
																/>
															</FieldContainer>
														)}
													</Field>
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
										onClick={() => {
											const form = document.getElementById('productForm');
											form?.dispatchEvent(
												new Event('submit', {
													cancelable: true,
													bubbles: true,
												}),
											);
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
