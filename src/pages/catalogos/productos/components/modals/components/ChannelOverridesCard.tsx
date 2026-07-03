import React, { useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import {
	useChannelNameMutation,
	useChannelPriceMutation,
	useChannelVisibilityMutation,
} from '@/services/hooks/useProductChannelOverrides';
import type { ChannelVisibility, ProductChannelPrice } from '@/interface/product.interface';

interface ChannelOverridesCardProps {
	subsidiaryId: number | null;
	productId: number;
	integrationId: string | null;
	integrationName?: string;
	channelPrice: ProductChannelPrice | null;
	basePrice: number | null;
	baseOfferPrice: number | null;
	onProductRefresh?: () => void;
}

const parseNullableNumber = (value: string): number | null => {
	const trimmed = value.trim();
	if (trimmed === '') return null;
	const n = Number(trimmed);
	return Number.isFinite(n) ? n : null;
};

const formatMoney = (value: string | null): string => {
	if (value === null || value === '') return '—';
	const n = Number(value);
	if (!Number.isFinite(n)) return value;
	return n.toLocaleString('es-CL', {
		style: 'currency',
		currency: 'CLP',
		maximumFractionDigits: 0,
	});
};

const ChannelOverridesCard: React.FC<ChannelOverridesCardProps> = ({
	subsidiaryId,
	productId,
	integrationId,
	integrationName,
	channelPrice,
	basePrice,
	baseOfferPrice,
	onProductRefresh,
}) => {
	const canAct = subsidiaryId !== null && integrationId !== null;

	const effectivePrice = channelPrice?.effective_price ?? (basePrice !== null ? String(basePrice) : null);
	const effectiveOfferPrice =
		channelPrice?.effective_offer_price ?? (baseOfferPrice !== null ? String(baseOfferPrice) : null);
	const basePricePlaceholder =
		basePrice !== null ? `Base: ${formatMoney(String(basePrice))}` : 'Precio base del producto';
	const baseOfferPlaceholder =
		baseOfferPrice !== null ? `Base: ${formatMoney(String(baseOfferPrice))}` : 'Sin oferta';

	const priceMutation = useChannelPriceMutation(subsidiaryId, productId);
	const nameMutation = useChannelNameMutation(subsidiaryId, productId);
	const visibilityMutation = useChannelVisibilityMutation(subsidiaryId, productId);

	const priceSchema = useMemo(
		() =>
			Yup.object({
				price_override: Yup.number()
					.transform((value: number, original: unknown) =>
						String(original).trim() === '' ? null : value,
					)
					.nullable()
					.typeError('El precio debe ser un número')
					.min(0, 'El precio no puede ser negativo'),
				offer_price_override: Yup.number()
					.transform((value: number, original: unknown) =>
						String(original).trim() === '' ? null : value,
					)
					.nullable()
					.typeError('El precio oferta debe ser un número')
					.min(0, 'El precio oferta no puede ser negativo')
					.test(
						'offer-not-above-price',
						'La oferta no puede superar el precio normal',
						(value, context) => {
							if (value === null || value === undefined) return true;
							const parent = context.parent as {
								price_override?: string | number | null;
							};
							const override = parseNullableNumber(
								String(parent.price_override ?? ''),
							);
							const base = override ?? basePrice;
							if (base === null) return true;
							return value <= base;
						},
					),
			}),
		[basePrice],
	);

	const priceForm = useFormik({
		enableReinitialize: true,
		initialValues: {
			price_override: channelPrice?.price_override ?? '',
			offer_price_override: channelPrice?.offer_price_override ?? '',
		},
		validationSchema: priceSchema,
		onSubmit: async (values) => {
			if (!canAct || !integrationId) return;
			try {
				await priceMutation.mutateAsync({
					integration_id: integrationId,
					price_override: parseNullableNumber(String(values.price_override)),
					offer_price_override: parseNullableNumber(String(values.offer_price_override)),
				});
				onProductRefresh?.();
			} catch {
				/* el hook muestra el toast de error */
			}
		},
	});

	const nameForm = useFormik({
		enableReinitialize: true,
		initialValues: {
			name_override: channelPrice?.name_override ?? '',
		},
		validationSchema: Yup.object({
			name_override: Yup.string().trim().max(255, 'Máximo 255 caracteres'),
		}),
		onSubmit: async (values) => {
			if (!canAct || !integrationId) return;
			const trimmed = values.name_override.trim();
			try {
				await nameMutation.mutateAsync({
					integration_id: integrationId,
					name_override: trimmed === '' ? null : trimmed,
				});
				onProductRefresh?.();
			} catch {
				/* el hook muestra el toast de error */
			}
		},
	});

	const handleRestorePrice = async () => {
		if (!canAct || !integrationId) return;
		try {
			await priceMutation.mutateAsync({
				integration_id: integrationId,
				price_override: null,
				offer_price_override: null,
			});
			onProductRefresh?.();
		} catch {
			/* el hook muestra el toast de error */
		}
	};

	const handleUseBaseName = async () => {
		if (!canAct || !integrationId) return;
		try {
			await nameMutation.mutateAsync({ integration_id: integrationId, name_override: null });
			onProductRefresh?.();
		} catch {
			/* el hook muestra el toast de error */
		}
	};

	const isPublic = channelPrice?.visibility !== 'private';

	const handleToggleVisibility = async () => {
		if (!canAct || !integrationId) return;
		const next: ChannelVisibility = isPublic ? 'private' : 'publish';
		try {
			await visibilityMutation.mutateAsync({
				integration_id: integrationId,
				visibility: next,
			});
			onProductRefresh?.();
		} catch {
			/* el hook muestra el toast de error */
		}
	};

	return (
		<Card className='overflow-hidden border border-emerald-200/60 shadow-sm dark:border-emerald-500/20'>
			<CardHeader className='border-b border-emerald-100 bg-emerald-50 pb-3 dark:border-emerald-500/10 dark:bg-emerald-950/30'>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/25 dark:bg-emerald-500/20 dark:ring-emerald-400/30'>
						<Icon
							icon='HeroAdjustmentsHorizontal'
							className='h-5 w-5 text-emerald-600 dark:text-emerald-400'
						/>
					</div>
					<div className='flex-1'>
						<CardTitle className='text-base font-bold text-neutral-900 dark:text-neutral-50'>
							Configuración del canal
						</CardTitle>
						<p className='mt-0.5 text-xs text-emerald-700/70 dark:text-emerald-300/70'>
							Precio, nombre y visibilidad personalizados{' '}
							{integrationName
								? `para ${integrationName}`
								: 'para el canal seleccionado'}
							.
						</p>
					</div>
					<Badge
						color={isPublic ? 'emerald' : 'zinc'}
						variant={isPublic ? 'solid' : 'outline'}>
						{isPublic ? 'Público' : 'Privado'}
					</Badge>
				</div>
			</CardHeader>
			<CardBody className='space-y-6'>
				{!canAct && (
					<div className='rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm font-medium text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-200'>
						<Icon icon='HeroExclamationTriangle' className='mr-1.5 inline h-4 w-4' />
						Selecciona una tienda para configurar sus overrides.
					</div>
				)}

				{/* ── PRECIO ── */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Icon
							icon='HeroCurrencyDollar'
							className='h-4 w-4 text-emerald-600 dark:text-emerald-400'
						/>
						<h4 className='text-sm font-semibold text-neutral-800 dark:text-neutral-100'>
							Precio del canal
						</h4>
					</div>
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
						<div className='space-y-1.5'>
							<Label htmlFor='channel_price_override'>Precio normal</Label>
							<Input
								id='channel_price_override'
								name='price_override'
								type='number'
								min={0}
								placeholder={basePricePlaceholder}
								value={priceForm.values.price_override}
								onChange={priceForm.handleChange}
								onBlur={priceForm.handleBlur}
								disabled={!canAct || priceMutation.isPending}
							/>
							{priceForm.errors.price_override &&
								priceForm.touched.price_override && (
									<div className='text-sm text-red-500'>
										{priceForm.errors.price_override}
									</div>
								)}
						</div>
						<div className='space-y-1.5'>
							<Label htmlFor='channel_offer_price_override'>Precio oferta</Label>
							<Input
								id='channel_offer_price_override'
								name='offer_price_override'
								type='number'
								min={0}
								placeholder={baseOfferPlaceholder}
								value={priceForm.values.offer_price_override}
								onChange={priceForm.handleChange}
								onBlur={priceForm.handleBlur}
								disabled={!canAct || priceMutation.isPending}
							/>
							{priceForm.errors.offer_price_override &&
								priceForm.touched.offer_price_override && (
									<div className='text-sm text-red-500'>
										{priceForm.errors.offer_price_override}
									</div>
								)}
						</div>
					</div>
					<div className='flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400'>
						<span>
							Precio efectivo:{' '}
							<strong className='text-neutral-700 dark:text-neutral-200'>
								{formatMoney(effectivePrice)}
							</strong>
						</span>
						<span>
							Oferta efectiva:{' '}
							<strong className='text-neutral-700 dark:text-neutral-200'>
								{formatMoney(effectiveOfferPrice)}
							</strong>
						</span>
					</div>
					<div className='flex flex-wrap gap-2'>
						<Button
							type='button'
							variant='solid'
							color='emerald'
							size='sm'
							icon='HeroCheck'
							onClick={() => void priceForm.submitForm()}
							isDisable={!canAct || priceMutation.isPending}
							isLoading={priceMutation.isPending}>
							Guardar precio
						</Button>
						<Button
							type='button'
							variant='outline'
							color='zinc'
							size='sm'
							icon='HeroArrowUturnLeft'
							onClick={() => void handleRestorePrice()}
							isDisable={!canAct || priceMutation.isPending}>
							Restaurar precio base
						</Button>
					</div>
				</div>

				<hr className='border-neutral-100 dark:border-neutral-800' />

				{/* ── NOMBRE ── */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Icon
							icon='HeroTag'
							className='h-4 w-4 text-emerald-600 dark:text-emerald-400'
						/>
						<h4 className='text-sm font-semibold text-neutral-800 dark:text-neutral-100'>
							Nombre del canal
						</h4>
					</div>
					<div className='space-y-1.5'>
						<Label htmlFor='channel_name_override'>Nombre personalizado</Label>
						<Input
							id='channel_name_override'
							name='name_override'
							placeholder='Nombre original del producto'
							value={nameForm.values.name_override}
							onChange={nameForm.handleChange}
							onBlur={nameForm.handleBlur}
							disabled={!canAct || nameMutation.isPending}
						/>
						{nameForm.errors.name_override && nameForm.touched.name_override && (
							<div className='text-sm text-red-500'>
								{nameForm.errors.name_override}
							</div>
						)}
					</div>
					<div className='flex flex-wrap gap-2'>
						<Button
							type='button'
							variant='solid'
							color='emerald'
							size='sm'
							icon='HeroCheck'
							onClick={() => void nameForm.submitForm()}
							isDisable={!canAct || nameMutation.isPending}
							isLoading={nameMutation.isPending}>
							Guardar nombre
						</Button>
						<Button
							type='button'
							variant='outline'
							color='zinc'
							size='sm'
							icon='HeroArrowUturnLeft'
							onClick={() => void handleUseBaseName()}
							isDisable={!canAct || nameMutation.isPending}>
							Usar nombre del producto
						</Button>
					</div>
				</div>

				<hr className='border-neutral-100 dark:border-neutral-800' />

				{/* ── VISIBILIDAD ── */}
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<Icon
							icon='HeroEye'
							className='h-4 w-4 text-emerald-600 dark:text-emerald-400'
						/>
						<h4 className='text-sm font-semibold text-neutral-800 dark:text-neutral-100'>
							Visibilidad del canal
						</h4>
					</div>
					<div className='flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3.5 dark:border-neutral-700 dark:bg-neutral-800/50'>
						<div className='flex flex-col'>
							<span className='text-sm font-medium text-neutral-800 dark:text-neutral-100'>
								Producto público en el canal
							</span>
							<span className='text-xs text-neutral-500 dark:text-neutral-400'>
								{isPublic
									? 'Visible para los clientes en el canal.'
									: 'Oculto: el producto no se muestra públicamente.'}
							</span>
						</div>
						<Checkbox
							id='channel_visibility'
							name='channel_visibility'
							variant='switch'
							checked={isPublic}
							onChange={() => void handleToggleVisibility()}
							disabled={!canAct || visibilityMutation.isPending}
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default ChannelOverridesCard;
