import React, { useMemo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/form/Checkbox';
import ClientDetailHeader from '../components/parts/ClientDetailHeader';
import DetailSection from '../components/parts/DetailSection';
import EditableField from '../components/parts/EditableField';
import EditableSelect from '../components/parts/EditableSelect';
import CustomerCreditProfileCard from './components/CustomerCreditProfileCard';
import { formatRut } from '../../../../utils/validateRut';
import { TSelectOptions } from '@/components/form/SelectReact';
import { useClientesVentasDetalle } from './hooks/useClientesVentasDetalle';

const DetailSkeleton = () => (
	<Container className='animate-pulse space-y-8 py-8'>
		<div className='flex justify-between items-center h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg' />
		<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
			<div className='h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg' />
			<div className='h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg' />
		</div>
		<div className='h-40 bg-zinc-100 dark:bg-zinc-800 rounded-lg' />
	</Container>
);

const ClientesVentasDetalleView = () => {
	const {
		formik,
		detalle,
		loading,
		isEditable,
		setIsEditable,
		handleCancelEdit,
		handleBack,
		contacto,
	} = useClientesVentasDetalle();

	const containerRef = useRef<HTMLDivElement>(null);
	const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		if (!loading && detalle && containerRef.current) {
			const ctx = gsap.context(() => {
				// Entrance animation for cards
				gsap.from(cardsRef.current, {
					y: 60,
					opacity: 0,
					duration: 1,
					stagger: {
						each: 0.2,
						from: 'start'
					},
					ease: 'expo.out',
				});

				// Content within cards subtle animation
				gsap.from('.detail-content-item', {
					opacity: 0,
					y: 10,
					duration: 0.6,
					stagger: 0.03,
					delay: 0.5,
					ease: 'power2.out',
				});
			}, containerRef);
			return () => ctx.revert();
		}
	}, [loading, detalle]);

	const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
		gsap.to(e.currentTarget, {
			y: -8,
			scale: 1.01,
			boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
			borderColor: 'var(--color-primary-300)',
			duration: 0.4,
			ease: 'power3.out'
		});
	};

	const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
		gsap.to(e.currentTarget, {
			y: 0,
			scale: 1,
			boxShadow: 'none',
			borderColor: 'rgba(228, 228, 231, 0.5)', // zinc-200/50
			duration: 0.4,
			ease: 'power3.inOut'
		});
	};

	const defaultDocumentOptions: TSelectOptions = useMemo(
		() => [
			{ value: 'factura', label: 'Factura' },
			{ value: 'boleta', label: 'Boleta' },
		],
		[],
	);

	const paymentMethodOptions: TSelectOptions = useMemo(
		() => [
			{ value: 'efectivo', label: 'Efectivo' },
			{ value: 'tarjeta', label: 'Tarjeta' },
			{ value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
			{ value: 'tarjeta_debito', label: 'Tarjeta Débito' },
			{ value: 'transferencia', label: 'Transferencia' },
			{ value: 'cheque', label: 'Cheque' },
			{ value: 'credito', label: 'Crédito' },
		],
		[],
	);

	if (loading && !detalle) {
		return (
			<PageWrapper title='Cargando cliente...'>
				<DetailSkeleton />
			</PageWrapper>
		);
	}

	if (!detalle) {
		return (
			<PageWrapper title='Error'>
				<Container className='py-20 text-center'>
					<p className='text-zinc-500'>No se encontró la información del cliente.</p>
				</Container>
			</PageWrapper>
		);
	}

	const addToRefs = (el: HTMLDivElement | null) => {
		if (el && !cardsRef.current.includes(el)) {
			cardsRef.current.push(el);
		}
	};

	return (
		<PageWrapper title='Detalle cliente' name='Detalle cliente'>
			<ClientDetailHeader
				client={detalle}
				contactName={contacto.name || ''}
				onBack={handleBack}
				onEditToggle={() => setIsEditable(true)}
				onCancelEdit={handleCancelEdit}
				onSave={() => formik.submitForm()}
				isEditable={isEditable}
				isSubmitting={formik.isSubmitting}
			/>

			<Container className='pb-20 pt-8' ref={containerRef}>
				<div className='space-y-6'>
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
						{/* Columna Principal - Info General */}
						<div className='lg:col-span-8 space-y-6' ref={addToRefs} >
							<Card className='h-full border-zinc-200/50 dark:border-zinc-700/50 shadow-sm transition-all overflow-hidden'>
								<CardBody>
									<DetailSection
										title='Información General'
										description='Datos base y estado operacional'
										contenRight={
											<div className='flex items-center gap-3 detail-content-item'>
												{isEditable ? (
													<Checkbox
														checked={formik.values.is_active}
														label='Activo'
														onChange={(e) =>
															formik.setFieldValue(
																'is_active',
																e.target.checked,
															)
														}
													/>
												) : (
													<div className='flex items-center gap-2'>
														<span className='text-xs text-zinc-400 font-medium uppercase'>Estado</span>
														<Badge
															variant='solid'
															className='px-3'
															color={detalle.is_active ? 'green' : 'red'}>
															{detalle.is_active ? 'Activo' : 'Inactivo'}
														</Badge>
													</div>
												)}
											</div>
										}>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
											<div className="detail-content-item">
												<EditableField
													formik={formik}
													name='document_number'
													label='RUT'
													isEditable={isEditable}
													placeholder='12.345.678-9'
													onChangeValue={(v) =>
														formik.setFieldValue('document_number', formatRut(v))
													}
												/>
											</div>
											<div className="detail-content-item">
												<EditableField
													formik={formik}
													name='billing_company'
													label='Nombre / Empresa'
													isEditable={isEditable}
													placeholder='Nombre de la empresa'
												/>
											</div>
											<div className="detail-content-item">
												<EditableField
													formik={formik}
													name='contact_name'
													label='Contacto Principal'
													isEditable={isEditable}
													placeholder='Nombre contacto'
												/>
											</div>
											<div className="detail-content-item">
												<EditableField
													formik={formik}
													name='email'
													label='Email'
													isEditable={isEditable}
													placeholder='ejemplo@correo.cl'
												/>
											</div>
											<div className="detail-content-item">
												<EditableField
													formik={formik}
													name='phone'
													label='Teléfono'
													isEditable={isEditable}
													placeholder='+56 9 ...'
												/>
											</div>
											<div className="detail-content-item">
												<EditableField
													formik={formik}
													name='trade_activity'
													label='Actividad Comercial'
													isEditable={isEditable}
												/>
											</div>
										</div>
									</DetailSection>
								</CardBody>
							</Card>
						</div>

						{/* Columna Lateral - Comercial */}
						<div className='lg:col-span-4' ref={addToRefs} >
							<Card className='h-full border-zinc-200/50 dark:border-zinc-700/50 shadow-sm transition-all overflow-hidden'>
								<CardBody>
									<DetailSection
										title='Comercial'
										description='Preferencias de facturación'
										contentClassName='grid grid-cols-1 gap-4'>
										<div className="detail-content-item">
											<EditableSelect
												formik={formik}
												name='default_document_type'
												label='Documento preferido'
												isEditable={isEditable}
												options={defaultDocumentOptions}
											/>
										</div>
										<div className="detail-content-item">
											<EditableSelect
												formik={formik}
												name='preferred_payment_method'
												label='Método de pago'
												isEditable={isEditable}
												options={paymentMethodOptions}
											/>
										</div>
									</DetailSection>
								</CardBody>
							</Card>
						</div>

						<div className='lg:col-span-4' ref={addToRefs}>
							<CustomerCreditProfileCard customerSaleId={detalle.id} />
						</div>

						{/* Direcciones */}
						<div className='lg:col-span-6' ref={addToRefs} >
							<Card className='border-zinc-200/50 dark:border-zinc-700/50 shadow-sm transition-all overflow-hidden'>
								<CardBody>
									<DetailSection
										title='Dirección de Facturación'
										contentClassName='grid grid-cols-1 gap-4'>
										<div className="detail-content-item">
											<EditableField
												formik={formik}
												name='billing_address_1'
												label='Dirección'
												isEditable={isEditable}
											/>
										</div>
										<div className='grid grid-cols-2 gap-4'>
											<div className="detail-content-item">
												<EditableField
													formik={formik}
													name='billing_city'
													label='Ciudad'
													isEditable={isEditable}
												/>
											</div>
											<div className="detail-content-item">
												<EditableField
													formik={formik}
													name='billing_postcode'
													label='Código Postal'
													isEditable={isEditable}
												/>
											</div>
										</div>
									</DetailSection>
								</CardBody>
							</Card>
						</div>

						<div className='lg:col-span-6' ref={addToRefs} >
							<Card className='border-zinc-200/50 dark:border-zinc-700/50 shadow-sm transition-all overflow-hidden'>
								<CardBody>
									<DetailSection
										title='Dirección de Despacho'
										contentClassName='grid grid-cols-1 gap-4'>
										<div className="detail-content-item">
											<EditableField
												formik={formik}
												name='shipping_address_1'
												label='Dirección'
												isEditable={isEditable}
											/>
										</div>
										<div className="detail-content-item">
											<EditableField
												formik={formik}
												name='shipping_city'
												label='Ciudad'
												isEditable={isEditable}
											/>
										</div>
									</DetailSection>
								</CardBody>
							</Card>
						</div>

						{/* Notas */}
						<div className='lg:col-span-12' ref={addToRefs} >
							<Card className='border-zinc-200/50 dark:border-zinc-700/50 shadow-sm transition-all overflow-hidden'>
								<CardBody>
									<DetailSection
										title='Notas internas'
										description='Observaciones relevantes'
										contentClassName='grid grid-cols-1'>
										<div className="detail-content-item">
											<EditableField
												formik={formik}
												name='notes'
												label='Notas'
												isEditable={isEditable}
												textarea
												placeholder='Agregar comentarios...'
											/>
										</div>
									</DetailSection>
								</CardBody>
							</Card>
						</div>
					</div>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default ClientesVentasDetalleView;
