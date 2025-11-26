import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Validation from '@/components/form/Validation';
import Textarea from '@/components/form/Textarea';
import { useAppDispatch, useAppSelector } from '@/store';
import WarrantyStatusBadge from './components/WarrantyStatusBadge';
import DeleteWarrantyModal from './components/DeleteWarrantyModal';
import { useWarrantyDetails } from './hooks/useWarrantyDetails';
import { useWarrantyLookups } from './hooks/useWarrantyLookups';
import { useWarrantyForm } from './hooks/useWarrantyForm';
import { toast } from '@/utils/toast.utils';
import { getUserSubsidiaryId } from './utils/subsidiary.utils';
import { deleteWarranty } from '@/store/slices/garantias/thunks';
import { formatProductDisplay } from './utils/warranty.utils';
import { motion } from 'framer-motion';
import { warrantyStatusOptions } from './hooks/useWarranties';

const ensureSelectOption = (
	options: TSelectOption[],
	value?: number | null,
	fallbackLabel?: string,
): TSelectOption | null => {
	if (!value) return null;
	const existing = options.find((option) => Number(option.value) === Number(value));
	if (existing) return existing;
	if (fallbackLabel) {
		return {
			value: String(value),
			label: fallbackLabel,
		};
	}
	return null;
};

const GarantiaDetailsPage: React.FC = () => {
	const { warrantyId } = useParams<{ warrantyId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);
	const subsidiaryId = getUserSubsidiaryId(user);
	const branchId = user?.branch?.id ?? null;
	const parsedWarrantyId = Number(warrantyId);

	const { detail, loading, reload } = useWarrantyDetails(subsidiaryId, parsedWarrantyId);
	const { productOptions, customerOptions, saleOptions, searchSales, loadProducts } =
		useWarrantyLookups(subsidiaryId, branchId);

	const [isEditable, setIsEditable] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const { formik, handleSubmit } = useWarrantyForm({
		subsidiaryId,
		mode: 'edit',
		warranty: detail ?? undefined,
		onSuccess: () => {
			reload();
			setIsEditable(false);
		},
	});

	const infoBlocks = useMemo(() => {
		if (!detail) return [];
		return [
			{
				id: 'product',
				label: 'Producto',
				value: formatProductDisplay(detail.product),
				helper: detail.warrantyTypeLabel ?? detail.product?.sku ?? undefined,
			},
			{
				id: 'period',
				label: 'Período',
				value: detail.periodLabel ?? 'Sin fechas',
				helper:
					detail.start_date && detail.end_date
						? `${detail.start_date} → ${detail.end_date}`
						: undefined,
			},
			{
				id: 'customer',
				label: 'Cliente',
				value: detail.customer?.name ?? 'Sin cliente',
				helper: detail.customer?.rut ?? detail.customer?.email ?? undefined,
			},
			{
				id: 'sale',
				label: 'Venta',
				value: detail.sale?.sale_number ?? 'Sin venta',
				helper: detail.sale_id ? `ID #${detail.sale_id}` : undefined,
			},
		];
	}, [detail]);

	const metaBadges = useMemo(() => {
		if (!detail) return [];
		const badges = [
			{
				id: 'serial',
				label: detail.serial_number ? `Serie ${detail.serial_number}` : 'Sin serie registrada',
			},
		];
		if (detail.created_at) {
			badges.push({
				id: 'created',
				label: `Creada ${new Date(detail.created_at).toLocaleDateString()}`,
			});
		}
		return badges;
	}, [detail]);

	const handleDelete = async () => {
		if (!subsidiaryId || !detail) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteWarranty({ subsidiaryId, warrantyId: detail.id })).unwrap();
			toast.success('Garantía eliminada');
			navigate('/garantias');
		} catch (error: unknown) {
			const message =
				(error as { response?: { data?: { message?: string } } })?.response?.data
					?.message || 'No se pudo eliminar la garantía';
			toast.error(message);
		} finally {
			setDeleteLoading(false);
		}
	};

	useEffect(() => {
		if (isEditable) {
			void loadProducts();
			void searchSales();
		}
	}, [isEditable, loadProducts, searchSales]);

	const handleEnterEdit = () => {
		if (!detail) return;
		formik.resetForm();
		setIsEditable(true);
	};

	const handleCancelEdit = () => {
		formik.resetForm();
		setIsEditable(false);
	};

	const productValue = useMemo(
		() =>
			ensureSelectOption(
				productOptions,
				formik.values.product_id,
				detail?.product ? formatProductDisplay(detail.product) : undefined,
			),
		[detail?.product, formik.values.product_id, productOptions],
	);

	const customerValue = useMemo(
		() =>
			ensureSelectOption(
				customerOptions,
				formik.values.customer_id,
				detail?.customer?.name
					? `${detail.customer.name}${
							detail.customer.rut ? ` (${detail.customer.rut})` : ''
						}`
					: undefined,
			),
		[customerOptions, detail?.customer, formik.values.customer_id],
	);

	const saleValue = useMemo(
		() =>
			ensureSelectOption(
				saleOptions,
				formik.values.sale_id,
				detail?.sale?.sale_number ? `Venta ${detail.sale.sale_number}` : undefined,
			),
		[detail?.sale?.sale_number, formik.values.sale_id, saleOptions],
	);

	const statusValue = useMemo(() => {
		if (!formik.values.status) return null;
		return (
			warrantyStatusOptions.find((option) => option.value === formik.values.status) ?? null
		);
	}, [formik.values.status]);

	const detailCard = !loading && detail && (
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35 }}>
				<Card className='mb-6 border border-zinc-200/60 shadow-xl dark:border-zinc-800/60'>
					<CardHeader className='pb-2'>
						<div className='space-y-2'>
							<CardTitle className='flex items-center gap-2 text-xl text-zinc-900 dark:text-zinc-100'>
								<Icon icon='DuoShieldCheck' size='text-5xl'/>
								<span>{`Garantía #${detail.id}`}</span>
							</CardTitle>
							<div className='flex flex-wrap gap-2'>
								{metaBadges.map((badge) => (
									<Badge
										key={badge.id}
										variant='outline'
										color='zinc'
										colorIntensity='500'
										className='px-2 py-0.5 text-xs font-semibold uppercase tracking-wide dark:border-zinc-700'>
										{badge.label}
									</Badge>
								))}
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<div className='text-right'>
								<p className='text-xs uppercase text-zinc-400'>Días restantes</p>
								<motion.p
									key={detail.daysRemaining?.label ?? 'none'}
									initial={{ opacity: 0, y: 6 }}
									animate={{ opacity: 1, y: 0 }}
									className={`text-base font-semibold ${
										detail.daysRemaining?.isExpired ? 'text-red-600' : 'text-emerald-600'
									}`}>
									{detail.daysRemaining?.label ?? '—'}
								</motion.p>
							</div>
							<WarrantyStatusBadge status={detail.status} />
						</div>
					</CardHeader>
					<CardBody className='space-y-6'>
						{!isEditable && (
							<>
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.05 }}>
									<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
										{infoBlocks.map((block, index) => (
											<motion.div
												key={block.id}
												initial={{ opacity: 0, y: 12 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.08 * index }}>
												<p className='text-xs uppercase tracking-wide text-zinc-400'>
													{block.label}
												</p>
												<p className='text-base font-semibold text-zinc-900 dark:text-white'>
													{block.value}
												</p>
												{block.helper && (
													<p className='text-sm text-zinc-500'>{block.helper}</p>
												)}
											</motion.div>
										))}
									</div>
								</motion.div>
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.15 }}>
									<p className='text-xs uppercase tracking-wide text-zinc-400'>Notas</p>
									<p className='text-sm text-zinc-600 dark:text-zinc-300'>
										{detail.notes?.trim() ? detail.notes : 'Sin notas registradas.'}
									</p>
								</motion.div>
							</>
						)}

						{isEditable && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className='space-y-4'>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='serial_number'>Número de serie (opcional)</Label>
										<Input
											id='serial_number'
											name='serial_number'
											value={formik.values.serial_number}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder='SN001234'
										/>
										<p className='mt-1 text-xs text-zinc-400'>
											Si proporcionas un número de serie, se autocompletarán los datos.
										</p>
									</div>
									<div>
										<Label htmlFor='status'>Estado (opcional)</Label>
										<SelectReact
											name='status'
											id='status'
											isClearable
											value={statusValue}
											options={warrantyStatusOptions}
											onChange={(option) => {
												const value = option ? (option as TSelectOption).value : '';
												void formik.setFieldValue('status', value);
											}}
											onBlur={() => formik.setFieldTouched('status', true)}
										/>
									</div>
								</div>

								<div>
									<Label htmlFor='product_id'>Producto</Label>
									<Validation
										isValid={!formik.errors.product_id}
										isTouched={formik.touched.product_id}
										invalidFeedback={formik.errors.product_id}>
										<SelectReact
											name='product_id'
											id='product_id'
											isClearable
											value={productValue}
											options={productOptions}
											placeholder='Selecciona un producto'
											onFocus={() => {
												void loadProducts();
											}}
											onChange={(option) =>
												formik.setFieldValue(
													'product_id',
													option ? Number((option as TSelectOption).value) : null,
												)
											}
											onBlur={() => formik.setFieldTouched('product_id', true)}
										/>
									</Validation>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='start_date'>Fecha de inicio</Label>
										<Validation
											isValid={!formik.errors.start_date}
											isTouched={formik.touched.start_date}
											invalidFeedback={formik.errors.start_date}>
											<Input
												type='date'
												id='start_date'
												name='start_date'
												value={formik.values.start_date}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
										</Validation>
									</div>
									<div>
										<Label htmlFor='end_date'>Fecha de término</Label>
										<Validation
											isValid={!formik.errors.end_date}
											isTouched={formik.touched.end_date}
											invalidFeedback={formik.errors.end_date}>
											<Input
												type='date'
												id='end_date'
												name='end_date'
												value={formik.values.end_date}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
										</Validation>
									</div>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='sale_id'>Venta asociada</Label>
										<SelectReact
											name='sale_id'
											id='sale_id'
											isClearable
											placeholder='Buscar venta'
											value={saleValue}
											options={saleOptions}
											onFocus={() => {
												if (!saleOptions.length) {
													void searchSales();
												}
											}}
											onChange={(option) =>
												formik.setFieldValue(
													'sale_id',
													option ? Number((option as TSelectOption).value) : null,
												)
											}
											onInputChange={(term, meta) => {
												if (meta?.action === 'input-change') {
													void searchSales(term || '');
												}
											}}
										/>
									</div>
									<div>
										<Label htmlFor='customer_id'>Cliente</Label>
										<SelectReact
											name='customer_id'
											id='customer_id'
											isClearable
											value={customerValue}
											options={customerOptions}
											placeholder='Buscar cliente'
											onChange={(option) =>
												formik.setFieldValue(
													'customer_id',
													option ? Number((option as TSelectOption).value) : null,
												)
											}
										/>
									</div>
								</div>

								<div>
									<Label htmlFor='notes'>Notas</Label>
									<Textarea
										id='notes'
										name='notes'
										rows={3}
										placeholder='Comentarios adicionales sobre la garantía'
										value={formik.values.notes}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
								</div>

								<div className='flex justify-end gap-3 pt-2'>
									<Button variant='outline' onClick={handleCancelEdit} type='button'>
										Cancelar
									</Button>
									<Button type='submit' color='emerald' isLoading={formik.isSubmitting}>
										Guardar cambios
									</Button>
								</div>
							</motion.div>
						)}
					</CardBody>
				</Card>
			</motion.div>
	);

	return (
		<PageWrapper name='garantia-detail'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<h1 className='text-2xl font-semibold text-zinc-900'>
							Detalle de garantía
						</h1>
						<p className='text-sm text-zinc-500'>
							Consulta la información completa de la garantía.
						</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex flex-wrap gap-2'>
						<Button
							variant='outline'
							icon='HeroArrowLeft'
							onClick={() => navigate('/garantias')}>
							Volver
						</Button>
						<Button
							variant='outline'
							icon='HeroPencil'
							onClick={() => (isEditable ? handleCancelEdit() : handleEnterEdit())}
							isDisable={!detail || loading}>
							{isEditable ? 'Cancelar edición' : 'Editar'}
						</Button>
						<Button
							color='red'
							icon='HeroTrash'
							onClick={() => setDeleteOpen(true)}
							isDisable={!detail}>
							Eliminar
						</Button>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container>
				{!subsidiaryId && (
					<Alert color='blue' variant='outline' className='mb-4'>
						Selecciona una empresa para acceder al detalle de la garantía.
					</Alert>
				)}

				{loading && (
					<Card>
						<CardBody className='flex items-center justify-center space-x-2 py-10 text-sm text-zinc-500'>
							<Icon
								icon='DuoLoading'
								className='h-5 w-5 animate-spin text-emerald-500'
							/>
							<span>Cargando información...</span>
						</CardBody>
					</Card>
				)}

					{detailCard &&
						(isEditable ? (
							<form onSubmit={handleSubmit}>{detailCard}</form>
						) : (
							detailCard
						))}

					{!loading && !detail && (
						<Alert color='amber' variant='outline'>
							No se encontró la información de la garantía solicitada.
						</Alert>
					)}
				</Container>

			{detail && (
				<DeleteWarrantyModal
					isOpen={deleteOpen}
					onClose={() => setDeleteOpen(false)}
					onConfirm={handleDelete}
					loading={deleteLoading}
					warranty={detail}
				/>
			)}
		</PageWrapper>
	);
};

export default GarantiaDetailsPage;
