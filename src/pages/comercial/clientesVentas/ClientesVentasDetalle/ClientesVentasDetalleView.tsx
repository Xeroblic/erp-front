import React, { useMemo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Card, { CardBody } from '@/components/ui/Card';
import Checkbox from '@/components/form/Checkbox';
import ClientDetailHeader from '../components/parts/ClientDetailHeader';
import DetailSection from '../components/parts/DetailSection';
import EditableField from '../components/parts/EditableField';
import EditableSelect from '../components/parts/EditableSelect';
import CustomerCreditProfileCard from './components/CustomerCreditProfileCard';
import { formatRut } from '../../../../utils/validateRut';
import { TSelectOptions } from '@/components/form/SelectReact';
import { useClientesVentasDetalle } from './hooks/useClientesVentasDetalle';
import { hasMatchingShippingAddress } from './utils';

const DetailSkeleton = () => (
	<Container className='animate-pulse space-y-8 py-8'>
		<div className='flex h-20 items-center justify-between rounded-lg bg-zinc-100 dark:bg-zinc-800' />
		<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
			<div className='h-64 rounded-lg bg-zinc-100 dark:bg-zinc-800' />
			<div className='h-64 rounded-lg bg-zinc-100 dark:bg-zinc-800' />
		</div>
		<div className='h-40 rounded-lg bg-zinc-100 dark:bg-zinc-800' />
	</Container>
);

const CUSTOMER_DETAIL_TEXT_FIELD_NAMES = new Set([
	'document_number',
	'billing_company',
	'contact_name',
	'email',
	'phone',
	'trade_activity',
	'billing_address_1',
	'billing_city',
	'shipping_address_1',
	'shipping_city',
]);

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
						from: 'start',
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
			ease: 'power3.out',
		});
	};

	const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
		gsap.to(e.currentTarget, {
			y: 0,
			scale: 1,
			boxShadow: 'none',
			borderColor: 'rgba(228, 228, 231, 0.5)', // zinc-200/50
			duration: 0.4,
			ease: 'power3.inOut',
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
	const shippingMatchesBilling =
		!isEditable && detalle ? hasMatchingShippingAddress(detalle) : false;

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
	const handleCustomerFormKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (
			!isEditable ||
			event.key !== 'Enter' ||
			event.shiftKey ||
			!(event.target instanceof HTMLInputElement) ||
			!CUSTOMER_DETAIL_TEXT_FIELD_NAMES.has(event.target.name)
		)
			return;
		event.preventDefault();
		formik.submitForm().catch(() => undefined);
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

			<Container
				className='pb-20 pt-8'
				ref={containerRef}
				onKeyDown={handleCustomerFormKeyDown}>
				<div className='space-y-6'>
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
						{/* Identidad y contacto: información primaria para reconocer al cliente. */}
						<div className='space-y-6 lg:col-span-8' ref={addToRefs}>
							<Card className='h-full overflow-hidden border-zinc-200/50 shadow-sm transition-all dark:border-zinc-700/50'>
								<CardBody>
									<DetailSection
										title='Identidad y contacto'
										description='Datos para identificar y contactar al cliente.'
										icon='HeroUser'
										contentClassName='!grid-cols-1 md:!grid-cols-1'
										contenRight={
											isEditable ? (
												<Checkbox
													checked={formik.values.is_active}
													label='Cliente activo'
													onChange={(event) =>
														formik.setFieldValue(
															'is_active',
															event.target.checked,
														)
													}
												/>
											) : null
										}>
										<div className='grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2'>
											<div className='detail-content-item'>
												<EditableField
													formik={formik}
													name='document_number'
													label='RUT'
													isEditable={isEditable}
													placeholder='12.345.678-9'
													onChangeValue={(v) =>
														formik.setFieldValue(
															'document_number',
															formatRut(v),
														)
													}
												/>
											</div>
											<div className='detail-content-item'>
												<EditableField
													formik={formik}
													name='billing_company'
													label='Nombre / Empresa'
													isEditable={isEditable}
													placeholder='Nombre de la empresa'
												/>
											</div>
											<div className='detail-content-item'>
												<EditableField
													formik={formik}
													name='contact_name'
													label='Contacto Principal'
													isEditable={isEditable}
													placeholder='Nombre contacto'
												/>
											</div>
											<div className='detail-content-item'>
												<EditableField
													formik={formik}
													name='email'
													label='Email'
													isEditable={isEditable}
													placeholder='ejemplo@correo.cl'
												/>
											</div>
											<div className='detail-content-item'>
												<EditableField
													formik={formik}
													name='phone'
													label='Teléfono'
													isEditable={isEditable}
													placeholder='+56 9 ...'
												/>
											</div>
											<div className='detail-content-item'>
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

						{/* Preferencias comerciales: configuración para la operación. */}
						<div className='lg:col-span-4' ref={addToRefs}>
							<Card className='h-full overflow-hidden border-zinc-200/50 shadow-sm transition-all dark:border-zinc-700/50'>
								<CardBody>
									<DetailSection
										title='Comercial'
										description='Preferencias de facturación'
										icon='HeroBriefcase'
										contentClassName='grid grid-cols-1 gap-4 md:!grid-cols-1'>
										<div className='detail-content-item'>
											<EditableSelect
												formik={formik}
												name='default_document_type'
												label='Documento preferido'
												isEditable={isEditable}
												options={defaultDocumentOptions}
											/>
										</div>
										<div className='detail-content-item'>
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

						{/* Logística: facturación y despacho se leen como una misma decisión operativa. */}
						<div className='lg:col-span-12' ref={addToRefs}>
							<Card className='overflow-hidden border border-zinc-200 bg-zinc-50 shadow-sm transition-all dark:border-zinc-700 dark:bg-zinc-800/60'>
								<CardBody className='p-5'>
									<DetailSection
										title='Logística'
										description='Direcciones para facturación y despacho.'
										icon='HeroTruck'
										contentClassName='grid grid-cols-1 gap-4 lg:grid-cols-2'>
										<div className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
											<p className='mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
												Facturación
											</p>
											<div className='grid grid-cols-1 gap-4'>
												<div className='detail-content-item'>
													<EditableField
														formik={formik}
														name='billing_address_1'
														label='Dirección'
														isEditable={isEditable}
													/>
												</div>
												<div className='detail-content-item'>
													<EditableField
														formik={formik}
														name='billing_city'
														label='Ciudad'
														isEditable={isEditable}
													/>
												</div>
											</div>
										</div>
										<div className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
											<div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
												<p className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
													Despacho
												</p>
												{shippingMatchesBilling ? (
													<span className='text-xs font-medium text-blue-700 dark:text-blue-300'>
														Misma dirección que facturación
													</span>
												) : null}
											</div>
											{shippingMatchesBilling ? (
												<p className='text-sm text-zinc-500 dark:text-zinc-400'>
													Los pedidos se despachan a la dirección de
													facturación registrada.
												</p>
											) : (
												<div className='grid grid-cols-1 gap-4'>
													<div className='detail-content-item'>
														<EditableField
															formik={formik}
															name='shipping_address_1'
															label='Dirección'
															isEditable={isEditable}
														/>
													</div>
													<div className='detail-content-item'>
														<EditableField
															formik={formik}
															name='shipping_city'
															label='Ciudad'
															isEditable={isEditable}
														/>
													</div>
												</div>
											)}
										</div>
									</DetailSection>
								</CardBody>
							</Card>
						</div>

						<div className='h-full lg:col-span-12' ref={addToRefs}>
							<CustomerCreditProfileCard customerSaleId={detalle.id} />
						</div>

						{/* Notas quedan separadas de las condiciones financieras. */}
						<div className='h-full lg:col-span-12' ref={addToRefs}>
							<Card className='h-full overflow-hidden border border-zinc-200 bg-zinc-50 shadow-sm transition-all dark:border-zinc-700 dark:bg-zinc-800/60'>
								<CardBody className='p-5'>
									<DetailSection
										title='Notas internas'
										description='Observaciones relevantes'
										icon='HeroChatBubbleLeftEllipsis'
										contentClassName='grid grid-cols-1'>
										<div className='detail-content-item'>
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
