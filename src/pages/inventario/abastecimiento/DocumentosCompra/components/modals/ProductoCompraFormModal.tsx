import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import SelectReact from '@/components/form/SelectReact';
import type { TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import {
	PRODUCT_FORM_SECTIONS,
	PRODUCT_TOGGLES,
} from '@/pages/catalogos/productos/constants/products.constant';
import { PRODUCT_DEVICE_TYPES } from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { IProcurementProduct } from '@/interface/procurement.interface';
import useProductoCompraForm from '../../hooks/useProductoCompraForm';

/**
 * Alta en línea de producto desde una línea del documento de compra, con los
 * campos y reglas del alta por filial.
 *
 * Replica el formulario de «Crear producto» de `catalogos/productos`: las mismas
 * dos secciones (`PRODUCT_FORM_SECTIONS`), el mismo orden de campos y los mismos
 * interruptores de serie y estado (`PRODUCT_TOGGLES`). Sólo cambia lo que el
 * mock de abastecimiento exige: sin selector de sucursal (el producto es de la
 * filial) y con el SKU siempre generado.
 *
 * Se apila sobre `DocumentoCompraFormModal` y, al crear, el producto queda
 * seleccionado en la línea que abrió el modal (salvo si lleva serie: las
 * líneas de compra sólo admiten productos no serializados).
 */

interface IProductoCompraFormModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	subsidiaryId: number | null;
	onSuccess?: (product: IProcurementProduct) => void;
}

const ProductoCompraFormModal: React.FC<IProductoCompraFormModalProps> = ({
	isOpen,
	setIsOpen,
	subsidiaryId,
	onSuccess,
}) => {
	const {
		formik,
		isSubmitting,
		reset,
		hasBranch,
		brandOptions,
		categoryOptions,
		loadingBrands,
		loadingCategories,
		sku,
	} = useProductoCompraForm({
		isOpen,
		subsidiaryId,
		onSuccess: (product) => {
			// Primero se entrega al caller: la línea que abrió el modal se resuelve
			// antes de que el cierre limpie ese estado.
			onSuccess?.(product);
			setIsOpen(false);
		},
	});

	const closeIfIdle = () => {
		if (isSubmitting) return;
		setIsOpen(false);
		reset();
	};

	const selectedCategories = categoryOptions.filter((option) =>
		formik.values.category_ids.includes(option.value),
	);

	let brandPlaceholder = 'Selecciona una marca';
	if (loadingBrands) brandPlaceholder = 'Cargando marcas...';
	else if (!hasBranch) brandPlaceholder = 'Selecciona una sucursal activa primero';

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={closeIfIdle}
			size='lg'
			isScrollable
			isStaticBackdrop={isSubmitting}>
			<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
				<div>
					<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
						Crear producto
					</h2>
					<p className='text-sm font-normal text-zinc-600 dark:text-zinc-400'>
						Crea el producto en la filial y úsalo en esta línea sin salir del documento.
					</p>
				</div>
			</ModalHeader>
			<ModalBody className='min-h-0 flex-1 overflow-y-auto'>
				<form onSubmit={formik.handleSubmit} className='space-y-5' noValidate>
					<Alert color='amber' variant='outline' icon='HeroExclamationTriangle'>
						El producto se crea en los datos de ejemplo de abastecimiento: no se
						registra en el catálogo de productos real.
					</Alert>

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
										<div className='space-y-1'>
											<Label htmlFor='producto-compra-sku'>SKU</Label>
											<Input
												id='producto-compra-sku'
												name='sku'
												value={sku}
												placeholder='Se genera automáticamente...'
												// Deshabilitado, no sólo `readOnly`: no recibe foco ni se
												// puede seleccionar, así no parece un campo editable.
												disabled
												className='select-none'
												aria-describedby='producto-compra-sku-help'
											/>
											<p
												id='producto-compra-sku-help'
												className='text-xs text-zinc-500'>
												<Icon
													icon='HeroInformationCircle'
													className='mr-1 inline h-3 w-3'
												/>
												Se genera con nombre, marca y tipo, y es único en la
												filial.
											</p>
										</div>

										<div className='space-y-1'>
											<Label htmlFor='producto-compra-name'>Nombre</Label>
											<Input
												id='producto-compra-name'
												className='!bg-white dark:!bg-zinc-900'
												name='name'
												value={formik.values.name}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={isSubmitting}
												isValid={!formik.errors.name}
												isTouched={Boolean(formik.touched.name)}
												invalidFeedback={formik.errors.name}
											/>
										</div>

										<div className='space-y-1 md:col-span-2'>
											<Label htmlFor='producto-compra-brand'>Marca</Label>
											<SelectReact
												name='brand_id'
												inputId='producto-compra-brand'
												options={brandOptions}
												isLoading={loadingBrands}
												isDisabled={!hasBranch || isSubmitting}
												placeholder={brandPlaceholder}
												value={
													brandOptions.find(
														(option) =>
															option.value === formik.values.brand_id,
													) ?? null
												}
												onChange={(option) => {
													if (Array.isArray(option)) return;
													const selected = option as TSelectOption | null;
													formik
														.setFieldValue(
															'brand_id',
															selected?.value ?? '',
														)
														.catch(() => undefined);
												}}
												onBlur={() => {
													formik
														.setFieldTouched('brand_id', true)
														.catch(() => undefined);
												}}
												isValid={!formik.errors.brand_id}
												isTouched={Boolean(formik.touched.brand_id)}
												invalidFeedback={formik.errors.brand_id}
											/>
										</div>
									</>
								)}

								{section.key === 'classification' && (
									<>
										<div className='space-y-1'>
											<Label htmlFor='producto-compra-type'>
												Tipo de dispositivo
											</Label>
											<Select
												id='producto-compra-type'
												name='product_type'
												// `Select` pinta el borde con el color del tema aunque no tenga
												// foco y parece seleccionado: acá el borde en reposo es gris,
												// como el de `Input`, y el fondo blanco. Hover y foco no cambian.
												className='!bg-white dark:!bg-zinc-900'
												style={
													{
														'--select-border': '#d4d4d8',
													} as React.CSSProperties
												}
												value={formik.values.product_type}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												disabled={isSubmitting}
												isValid={!formik.errors.product_type}
												isTouched={Boolean(formik.touched.product_type)}
												invalidFeedback={formik.errors.product_type}>
												{PRODUCT_DEVICE_TYPES.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</Select>
										</div>

										<div className='space-y-1 md:col-span-2'>
											<Label htmlFor='producto-compra-categories'>
												Categorias
											</Label>
											<SelectReact
												name='category_ids'
												inputId='producto-compra-categories'
												isMulti
												options={categoryOptions}
												isLoading={loadingCategories}
												isDisabled={isSubmitting || loadingCategories}
												placeholder={
													loadingCategories
														? 'Cargando categorías...'
														: 'Selecciona las categorías'
												}
												value={selectedCategories}
												onChange={(options) => {
													const selected = Array.isArray(options)
														? (options as TSelectOption[])
														: [];
													formik
														.setFieldValue(
															'category_ids',
															selected.map((option) => option.value),
														)
														.catch(() => undefined);
												}}
											/>
										</div>
									</>
								)}
							</CardBody>
						</Card>
					))}

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						{PRODUCT_TOGGLES.map((toggle) => {
							const toggleId = `producto-compra-${toggle.key}`;
							return (
								<Card
									key={toggle.key}
									className='border-2 border-dashed transition-all duration-200 ease-in-out hover:border-solid hover:border-neutral-300'>
									<CardBody className='p-0'>
										<div className='flex w-full items-center gap-4 p-4'>
											<span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border'>
												<Icon icon={toggle.icon} className='h-5 w-5' />
											</span>
											<div className='flex-1'>
												<label
													htmlFor={toggleId}
													className='cursor-pointer text-sm font-semibold'>
													{toggle.title}
												</label>
												<p className='text-xs text-neutral-500'>
													{toggle.description}
												</p>
											</div>
											<Checkbox
												id={toggleId}
												name={toggle.key}
												checked={formik.values[toggle.key]}
												onChange={(event) => {
													formik
														.setFieldValue(
															toggle.key,
															event.target.checked,
														)
														.catch(() => undefined);
												}}
												disabled={isSubmitting}
											/>
										</div>
									</CardBody>
								</Card>
							);
						})}
					</div>

					{formik.values.serial_tracking && (
						<Alert color='amber' variant='outline' icon='HeroInformationCircle'>
							Los documentos de compra sólo admiten productos sin seguimiento por
							serie: el producto se creará, pero no quedará seleccionado en esta
							línea.
						</Alert>
					)}
				</form>
			</ModalBody>
			<ModalFooter className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
				<div className='flex w-full justify-end gap-3'>
					<Button
						type='button'
						variant='outline'
						icon='HeroXMark'
						isDisable={isSubmitting}
						onClick={closeIfIdle}>
						Cancelar
					</Button>
					<Button
						type='button'
						onClick={() => formik.handleSubmit()}
						color='blue'
						icon='HeroCheck'
						isLoading={isSubmitting}
						isDisable={isSubmitting}>
						Crear producto
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default ProductoCompraFormModal;
