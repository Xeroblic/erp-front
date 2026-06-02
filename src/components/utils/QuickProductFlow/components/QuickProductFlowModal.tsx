/**
 * Componente escalable para crear producto rápido
 * Reutilizable en múltiples contextos (IngresoStock, Revisiones técnicas, etc.)
 */
import React from 'react';
import { FormikProps } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalFooterChild } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Checkbox from '@/components/form/Checkbox';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import type { IQuickProductForm } from '../types/types';
import { PRODUCT_TYPE_LABELS } from '@/pages/catalogos/productos/constants/products.constant';

const PRODUCT_TYPE_OPTIONS: TSelectOption[] = Object.entries(PRODUCT_TYPE_LABELS).map(
	([value, label]) => ({ value, label }),
);

interface QuickProductFlowModalProps {
	isOpen: boolean;
	onClose: () => void;
	form: FormikProps<IQuickProductForm>;
	isSubmitting: boolean;
	branchId: string;
	brandOptions: TSelectOption[];
	onBrandChange: (brandId: string) => void;
	onCreateBrand: (brandName: string) => Promise<void>;
	title?: string;
	description?: string;
	submitLabel?: string;
	cancelLabel?: string;
}

/**
 * Modal escalable para crear producto rápido con marca
 * Soporta:
 * - Producto express (sin seguimiento)
 * - Producto con seguimiento de serie (con marca obligatoria)
 */
export const QuickProductFlowModal: React.FC<QuickProductFlowModalProps> = ({
	isOpen,
	onClose,
	form,
	isSubmitting,
	branchId,
	brandOptions,
	onBrandChange,
	onCreateBrand,
	title = 'Crear Producto Exprés',
	description = 'Crea un producto rápidamente sin pasar por el catálogo completo.',
	submitLabel = 'Crear y Agregar',
	cancelLabel = 'Cancelar',
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg' isCentered isScrollable>
			{/* ── BODY ── */}
			<ModalBody className='px-6 py-6'>
				<div className='flex flex-col gap-6'>
					{/* Encabezado */}
					<div className='flex items-start gap-4'>
						<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'>
							<Icon icon='DuoThunder1' className='h-7 w-7' />
						</div>
						<div className='flex-1'>
							<h3 className='text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100'>
								{title}
							</h3>
							<p className='mt-0.5 text-sm text-zinc-500 dark:text-zinc-400'>
								{description}
							</p>
						</div>
						<button
							onClick={onClose}
							type='button'
							className='rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
							<Icon icon='HeroXMark' className='h-5 w-5' />
						</button>
					</div>

					{/* Banner de sucursal */}
					{branchId && branchId !== '' && (
						<div className='flex items-center gap-3 rounded-xl border border-blue-200/60 bg-blue-50/70 px-4 py-2.5 dark:border-blue-800/40 dark:bg-blue-950/30'>
							<Icon
								icon='DuoBuilding'
								className='h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400'
							/>
							<p className='text-sm text-blue-700 dark:text-blue-300'>
								Asignado a sucursal{' '}
								<span className='ml-1 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'>
									{branchId}
								</span>
							</p>
						</div>
					)}

					{/* ── SECCIÓN: Identidad del producto ── */}
					<div>
						<div className='mb-3 flex items-center gap-2'>
							<span className='h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800' />
							<span className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500'>
								Identidad del producto
							</span>
							<span className='h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800' />
						</div>

						<div className='grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2'>
							{/* Nombre */}
							<div className='md:col-span-2'>
								<Label
									htmlFor='name'
									className='mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
									<span className='flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400'>
										<Icon icon='DuoBox1' className='h-3.5 w-3.5' />
									</span>
									Nombre del producto
									<span className='text-red-500'>*</span>
								</Label>
								<Input
									id='name'
									name='name'
									value={form.values.name}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.name}
									invalidFeedback={form.errors.name}
									placeholder='Ej: Laptop Dell Inspiron 15'
									disabled={isSubmitting}
								/>
							</div>

							{/* SKU */}
							<div className='col-span-1'>
								<Label
									htmlFor='sku'
									className='mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
									<span className='flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-violet-500 dark:bg-violet-950/50 dark:text-violet-400'>
										<Icon icon='DuoBarcode' className='h-3.5 w-3.5' />
									</span>
									SKU
									<span className='text-red-500'>*</span>
									<span className='ml-auto text-[10px] font-normal text-zinc-400 dark:text-zinc-500'>
										Código único
									</span>
								</Label>
								<Input
									id='sku'
									name='sku'
									value={form.values.sku}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.sku}
									invalidFeedback={form.errors.sku}
									placeholder='DELL-INS-001'
									disabled={isSubmitting}
									className='font-mono uppercase tracking-wide'
								/>
							</div>

							{/* Tipo */}
							<div className='col-span-1'>
								<Label
									htmlFor='tipo'
									className='mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
									<span className='flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400'>
										<Icon icon='DuoLayers' className='h-3.5 w-3.5' />
									</span>
									Tipo de producto
									<span className='text-red-500'>*</span>
								</Label>
								<SelectReact
									id='tipo'
									name='tipo'
									options={PRODUCT_TYPE_OPTIONS}
									value={
										PRODUCT_TYPE_OPTIONS.find(
											(opt) => opt.value === form.values.tipo,
										) || null
									}
									onChange={(option) => {
										if (Array.isArray(option)) return;
										const nextValue =
											option && 'value' in option
												? String(option.value)
												: '';
										form.setFieldValue('tipo', nextValue);
									}}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.tipo}
									invalidFeedback={form.errors.tipo}
									placeholder='Selecciona un tipo'
									isDisabled={isSubmitting}
								/>
							</div>
						</div>
					</div>

					{/* ── SECCIÓN: Datos Comerciales ── */}
					<div>
						<div className='mb-3 flex items-center gap-2'>
							<span className='h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800' />
							<span className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500'>
								Datos comerciales
							</span>
							<span className='h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800' />
						</div>

						<div className='grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2'>
							{/* Marca */}
							<div className='col-span-1'>
								<Label
									htmlFor='brandId'
									className='mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
									<span className='flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-400'>
										<Icon icon='DuoShieldCheck' className='h-3.5 w-3.5' />
									</span>
									Marca
									<span className='text-red-500'>*</span>
								</Label>
								<SelectReact
									name='brandId'
									placeholder='Seleccionar o crear marca'
									options={brandOptions}
									isCreatable
									isDisabled={isSubmitting}
									value={
										brandOptions.find(
											(opt) => opt.value === form.values.brandId,
										) || null
									}
									onChange={(option) => {
										if (Array.isArray(option)) return;
										const nextValue =
											option && 'value' in option
												? String(option.value)
												: '';
										onBrandChange(nextValue);
									}}
									onCreateOption={(inputValue) => {
										void onCreateBrand(inputValue);
									}}
								/>
								{form.touched.brandId && form.errors.brandId && (
									<p className='mt-1.5 flex items-center gap-1 text-xs text-red-500'>
										<Icon icon='DuoInfoCircle' className='h-3 w-3' />
										{form.errors.brandId}
									</p>
								)}
							</div>

							{/* Precio */}
							<div className='col-span-1'>
								<Label
									htmlFor='price'
									className='mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
									<span className='flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-500 dark:bg-teal-950/50 dark:text-teal-400'>
										<Icon icon='DuoPrice1' className='h-3.5 w-3.5' />
									</span>
									Precio
									<span className='ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-normal text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'>
										Opcional
									</span>
								</Label>
								<Input
									id='price'
									name='price'
									type='number'
									min={0}
									step={0.01}
									value={form.values.price}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.price}
									invalidFeedback={form.errors.price}
									placeholder='0.00'
									disabled={isSubmitting}
								/>
							</div>
						</div>
					</div>

					{/* ── Toggle de seguimiento por serie ── */}
					<div
						className={[
							'relative overflow-hidden rounded-2xl border p-4 transition-all duration-200',
							form.values.serialTracking === '1'
								? 'border-blue-300/70 bg-blue-50/60 dark:border-blue-700/50 dark:bg-blue-950/30'
								: 'border-zinc-200 bg-zinc-50/40 dark:border-zinc-800/60 dark:bg-zinc-900/20',
						].join(' ')}>
						{/* Línea de acento izquierda */}
						<div
							className={[
								'absolute inset-y-0 left-0 w-1 rounded-l-2xl transition-all duration-200',
								form.values.serialTracking === '1'
									? 'bg-blue-500'
									: 'bg-zinc-300 dark:bg-zinc-700',
							].join(' ')}
						/>

						<div className='ml-3 flex items-start gap-4'>
							<div
								className={[
									'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
									form.values.serialTracking === '1'
										? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
										: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
								].join(' ')}>
								<Icon icon='DuoBarcodeScan' className='h-5 w-5' />
							</div>

							<div className='flex-1'>
								<p
									className={[
										'text-sm font-semibold transition-colors duration-200',
										form.values.serialTracking === '1'
											? 'text-blue-800 dark:text-blue-300'
											: 'text-zinc-700 dark:text-zinc-300',
									].join(' ')}>
									Seguimiento por número de serie
								</p>
								<p className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
									Rastrea el ciclo de vida individual de cada unidad con un
									número único.
								</p>
								<Checkbox
									id='serialTracking'
									name='serialTracking'
									label='Habilitar seguimiento por serie'
									checked={form.values.serialTracking === '1'}
									onChange={(e) => {
										form.setFieldValue(
											'serialTracking',
											e.target.checked ? '1' : '0',
										);
									}}
									disabled={isSubmitting}
									className='mt-2.5 text-xs'
								/>
							</div>

							{form.values.serialTracking === '1' && (
								<div className='shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'>
									Activo
								</div>
							)}
						</div>
					</div>
				</div>
			</ModalBody>

			{/* ── FOOTER ── */}
			<ModalFooter className='border-t border-zinc-200/80 dark:border-zinc-800'>
				<ModalFooterChild>
					<p className='flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500'>
						<span className='inline-block h-1.5 w-1.5 rounded-full bg-red-500' />
						Campos obligatorios
					</p>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						color='zinc'
						variant='outline'
						onClick={onClose}
						isDisable={isSubmitting}>
						{cancelLabel}
					</Button>
					<Button
						color='blue'
						variant='solid'
						icon='DuoThunder1'
						rightIcon='DuoRight'
						onClick={() => form.handleSubmit()}
						isDisable={isSubmitting}
						isLoading={isSubmitting}>
						{isSubmitting ? 'Creando...' : submitLabel}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};
