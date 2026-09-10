import React from 'react';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Button from '@/components/ui/Button';
import { SelectComune } from '@/components/utils/selects/SelectComune';
import type { IProcurementSupplier } from '@/interface/procurement.interface';
import useProveedorForm from '../../hooks/useProveedorForm';
import SupplierCompletenessNotice from '../parts/SupplierCompletenessNotice';
import SupplierRutConflictNotice from '../parts/SupplierRutConflictNotice';

/**
 * Alta y edición de proveedor (sección 5 del contrato). Mismo formulario para
 * las dos: el listado la abre para «Nuevo proveedor» o «Editar», y la ficha
 * la abre para «Editar» desde `AllowedActionsToolbar`.
 */

/** Tarjeta de primer nivel dentro del cuerpo del modal (mismo estándar que el modal de cotización). */
const PROVEEDOR_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';
const PROVEEDOR_SUBTITLE_CLASSNAME = 'text-sm font-normal text-zinc-600 dark:text-zinc-400';

interface IProveedorFormModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	branchId?: number | null;
	subsidiaryId: number | null;
	/** `null`: alta. Con proveedor: edición de ese registro. */
	supplier?: IProcurementSupplier | null;
	onSuccess?: (supplier: IProcurementSupplier) => void;
	/** Navega a la ficha del proveedor en conflicto, sin cerrar este flujo por el usuario. */
	onViewSupplier: (id: number) => void;
}

const ProveedorFormModal: React.FC<IProveedorFormModalProps> = ({
	isOpen,
	setIsOpen,
	branchId = null,
	subsidiaryId,
	supplier = null,
	onSuccess,
	onViewSupplier,
}) => {
	const {
		formik,
		isEdit,
		isSubmitting,
		conflict,
		isRestoring,
		restoreConflicting,
		handleRutChange,
		reset,
	} = useProveedorForm({
		subsidiaryId,
		supplier,
		onSuccess: (savedSupplier) => {
			setIsOpen(false);
			onSuccess?.(savedSupplier);
		},
	});

	const closeIfIdle = () => {
		if (isSubmitting) return;
		setIsOpen(false);
		reset();
	};

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
						{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
					</h2>
					<p className='text-sm font-normal text-zinc-600 dark:text-zinc-400'>
						Completa los datos de contacto y facturación del proveedor.
					</p>
				</div>
			</ModalHeader>
			<ModalBody className='min-h-0 flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950'>
				<form onSubmit={formik.handleSubmit} className='space-y-4'>
					{conflict && (
						<SupplierRutConflictNotice
							conflict={conflict}
							isRestoring={isRestoring}
							onRestore={restoreConflicting}
							onViewSupplier={onViewSupplier}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
						/>
					)}

					<Card className={PROVEEDOR_CARD_CLASSNAME}>
						<CardHeader className='pb-2'>
							<div>
								<CardTitle className='text-lg'>Datos del proveedor</CardTitle>
								<p className={PROVEEDOR_SUBTITLE_CLASSNAME}>
									Identificación, razón social y contacto.
								</p>
							</div>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div className='space-y-1'>
								<Label htmlFor='proveedor-rut'>RUT</Label>
								<Input
									id='proveedor-rut'
									name='rut'
									placeholder='76123456-0'
									value={formik.values.rut}
									onChange={(event) => handleRutChange(event.target.value)}
									onBlur={formik.handleBlur}
									isTouched={!!formik.touched.rut}
									isValid={!formik.errors.rut}
									invalidFeedback={
										formik.touched.rut ? formik.errors.rut : undefined
									}
								/>
							</div>

							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div className='space-y-1'>
									<Label htmlFor='proveedor-company'>Razón social</Label>
									<Input
										id='proveedor-company'
										name='company_name'
										placeholder='PCExpress SpA'
										value={formik.values.company_name}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isTouched={!!formik.touched.company_name}
										isValid={!formik.errors.company_name}
										invalidFeedback={
											formik.touched.company_name
												? formik.errors.company_name
												: undefined
										}
									/>
								</div>
								<div className='space-y-1'>
									<Label htmlFor='proveedor-contact'>Nombre de contacto</Label>
									<Input
										id='proveedor-contact'
										name='contact_name'
										placeholder='Ana Soto'
										value={formik.values.contact_name}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isTouched={!!formik.touched.contact_name}
										isValid={!formik.errors.contact_name}
										invalidFeedback={
											formik.touched.contact_name
												? formik.errors.contact_name
												: undefined
										}
									/>
								</div>
							</div>

							<div className='space-y-1'>
								<Label htmlFor='proveedor-activity'>Giro</Label>
								<Input
									id='proveedor-activity'
									name='business_activity'
									placeholder='Venta de insumos informáticos'
									value={formik.values.business_activity}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									isTouched={!!formik.touched.business_activity}
									isValid={!formik.errors.business_activity}
									invalidFeedback={
										formik.touched.business_activity
											? formik.errors.business_activity
											: undefined
									}
								/>
							</div>

							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div className='space-y-1'>
									<Label htmlFor='proveedor-phone'>Teléfono</Label>
									<Input
										id='proveedor-phone'
										name='phone'
										placeholder='+56912345678'
										value={formik.values.phone}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isTouched={!!formik.touched.phone}
										isValid={!formik.errors.phone}
										invalidFeedback={
											formik.touched.phone ? formik.errors.phone : undefined
										}
									/>
								</div>
								<div className='space-y-1'>
									<Label htmlFor='proveedor-email'>Email</Label>
									<Input
										id='proveedor-email'
										name='email'
										placeholder='ventas@example.test'
										value={formik.values.email}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isTouched={!!formik.touched.email}
										isValid={!formik.errors.email}
										invalidFeedback={
											formik.touched.email ? formik.errors.email : undefined
										}
									/>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card className={PROVEEDOR_CARD_CLASSNAME}>
						<CardHeader className='pb-2'>
							<div>
								<CardTitle className='text-lg'>Direcciones</CardTitle>
								<p className={PROVEEDOR_SUBTITLE_CLASSNAME}>
									Facturación y despacho, con su comuna.
								</p>
							</div>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div className='space-y-1'>
									<Label htmlFor='proveedor-billing-address'>
										Dirección de facturación
									</Label>
									<Input
										id='proveedor-billing-address'
										name='billing_address'
										placeholder='Av. Central 1200'
										value={formik.values.billing_address}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isTouched={!!formik.touched.billing_address}
										isValid={!formik.errors.billing_address}
										invalidFeedback={
											formik.touched.billing_address
												? formik.errors.billing_address
												: undefined
										}
									/>
								</div>
								{/* Mismo `<div className='space-y-1'><Label/>...</div>` que el campo de
								    dirección: `hideLabel` saca el rótulo propio de `SelectComune`
								    (distinto y más bajo que `Label`) para que ambos queden alineados. */}
								<div className='space-y-1'>
									<Label htmlFor='proveedor-billing-commune'>
										Comuna de facturación
									</Label>
									<SelectComune
										hideLabel
										inputId='proveedor-billing-commune'
										value={formik.values.billing_commune_id}
										onChange={(value) =>
											formik
												.setFieldValue(
													'billing_commune_id',
													value ? Number(value) : null,
												)
												.catch(() => undefined)
										}
									/>
								</div>
							</div>

							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div className='space-y-1'>
									<Label htmlFor='proveedor-shipping-address'>
										Dirección de despacho
									</Label>
									<Input
										id='proveedor-shipping-address'
										name='shipping_address'
										placeholder='Camino Industrial 80'
										value={formik.values.shipping_address}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isTouched={!!formik.touched.shipping_address}
										isValid={!formik.errors.shipping_address}
										invalidFeedback={
											formik.touched.shipping_address
												? formik.errors.shipping_address
												: undefined
										}
									/>
								</div>
								<div className='space-y-1'>
									<Label htmlFor='proveedor-shipping-commune'>
										Comuna de despacho
									</Label>
									<SelectComune
										hideLabel
										inputId='proveedor-shipping-commune'
										value={formik.values.shipping_commune_id}
										onChange={(value) =>
											formik
												.setFieldValue(
													'shipping_commune_id',
													value ? Number(value) : null,
												)
												.catch(() => undefined)
										}
									/>
								</div>
							</div>
						</CardBody>
					</Card>

					<SupplierCompletenessNotice values={formik.values} />
				</form>
			</ModalBody>
			<ModalFooter className='shrink-0 border-t border-zinc-200 bg-white pt-4 dark:border-zinc-700 dark:bg-zinc-950'>
				<ModalFooterChild>
					<Button variant='outline' onClick={closeIfIdle} isDisable={isSubmitting}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color='blue'
						icon='HeroCheck'
						onClick={() => formik.handleSubmit()}
						isLoading={isSubmitting}
						disabled={isSubmitting}>
						{isEdit ? 'Guardar cambios' : 'Crear proveedor'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ProveedorFormModal;
