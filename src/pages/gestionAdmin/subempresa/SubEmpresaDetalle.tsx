import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	updateSubsidiaria,
	fetchSubsidiariaDetail,
} from '@/store/slices/subempresa/subEmpresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import {
	ISubempresa,
	ISubempresaFormValues,
	ISubempresaViewData,
	ISubempresaCommercialView,
} from '@/interface/empresas.interface';
import ApiService from '@/services/ApiService';
import { validateFile } from '@/utils/apiHelpers';
import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { useGeoSelector } from '@/hooks/useGeoSelector';
import { DeleteSubempresaModal } from './components';
import ButtonGroup from '@/components/ui/ButtonGroup';
import BasicParts from './components/parts/BasicParts';
import ComercialParts from './components/parts/Comercial';

export default function SubEmpresaDetalle() {
	const getStringValue = (...values: Array<string | null | undefined>) =>
		values.find((val) => typeof val === 'string' && val.trim() !== '') || '';

	const { id } = useParams<{ id: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const loading = useAppSelector((s) => s.subEmpresa.loading);
	const detalle = useAppSelector((s) => s.subEmpresa.detalle);
	const [subempresa, setSubempresa] = useState<ISubempresa | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [activeTab, setActiveTab] = useState<'basic' | 'commercial'>('basic');
	const [openDelete, setOpenDelete] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (id) {
			dispatch(fetchSubsidiariaDetail(Number(id)))
				.unwrap()
				.then((data) => setSubempresa(data))
				.catch(() => {
					toast.error('Subempresa no encontrada');
					navigate('/gestion/subempresa');
				});
		}
	}, [dispatch, id, navigate]);

	useEffect(() => {
		if (detalle && id && Number(detalle.id) === Number(id)) {
			setSubempresa(detalle);
		}
	}, [detalle, id]);

	const allowedPaymentOptions = useMemo(
		() => [
			{ value: 'efectivo', label: 'Efectivo' },
			{ value: 'transferencia', label: 'Transferencia' },
			{ value: 'debito', label: 'Débito' },
			{ value: 'credito', label: 'Crédito' },
			{ value: 'a plazo', label: 'A plazo' },
			{ value: 'cheque', label: 'Cheque' },
		],
		[],
	);

	const initialValues: ISubempresaFormValues = useMemo(
		() => ({
			nombre: getStringValue(subempresa?.name, subempresa?.subsidiary_name),
			rut: getStringValue(subempresa?.rut, subempresa?.subsidiary_rut),
			telefono: getStringValue(
				subempresa?.phone,
				subempresa?.subsidiary_phone,
				subempresa?.manager?.phone_number as string,
				subempresa?.manager?.phone as string,
			),
			email: getStringValue(
				subempresa?.email,
				subempresa?.subsidiary_email,
				subempresa?.manager?.email as string,
			),
			direccion: getStringValue(subempresa?.address, subempresa?.subsidiary_address),
			region: '',
			provincia: '',
			comuna: (subempresa as any)?.commune_id
				? String((subempresa as any).commune_id)
				: (subempresa as any)?.commune?.id
					? String((subempresa as any).commune.id)
					: subempresa?.commune_id
						? String(subempresa.commune_id)
						: '',
			commune_id: subempresa?.commune_id ?? undefined,
			documentsEmail: getStringValue(
				subempresa?.subsidiary_documents_email,
				(subempresa as any)?.documents_email,
			),
			salesEmail: getStringValue(
				subempresa?.subsidiary_sales_email,
				(subempresa as any)?.sales_email,
			),
			deliveryTerm: getStringValue(
				subempresa?.subsidiary_delivery_term,
				(subempresa as any)?.delivery_term,
			),
			bankDetails: getStringValue(
				subempresa?.subsidiary_bank_details,
				(subempresa as any)?.bank_details,
			),
			allowedPaymentMethods:
				subempresa?.subsidiary_allowed_payment_methods ||
				(subempresa as any)?.allowed_payment_methods ||
				[],
			quoteValidityText: getStringValue(
				subempresa?.subsidiary_quote_validity_text,
				(subempresa as any)?.quote_validity_text,
			),
			quoteValidityDays:
				subempresa?.subsidiary_quote_validity_days ??
				(subempresa as any)?.quote_validity_days ??
				null,
			giro: getStringValue(subempresa?.subsidiary_giro, (subempresa as any)?.giro),
			commercialTerms: getStringValue(
				subempresa?.subsidiary_commercial_terms,
				(subempresa as any)?.commercial_terms,
			),
			defaultPaymentMethod: getStringValue(
				subempresa?.subsidiary_default_payment_method,
				(subempresa as any)?.default_payment_method,
			),
		}),
		[subempresa],
	);

	const viewData: ISubempresaViewData = useMemo(
		() => ({
			name: getStringValue(subempresa?.name, subempresa?.subsidiary_name, '—'),
			rut: getStringValue(subempresa?.rut, subempresa?.subsidiary_rut),
			phone: getStringValue(
				subempresa?.phone,
				subempresa?.subsidiary_phone,
				subempresa?.manager?.phone_number as string,
				subempresa?.manager?.phone as string,
			),
			email: getStringValue(
				subempresa?.email,
				subempresa?.subsidiary_email,
				subempresa?.manager?.email as string,
			),
			address: getStringValue(subempresa?.address, subempresa?.subsidiary_address),
			commune: getStringValue(subempresa?.commune?.name, (subempresa as any)?.commune_name),
			province: '',
			region: '',
		}),
		[subempresa],
	);

	const commercialView: ISubempresaCommercialView = useMemo(
		() => ({
			documentsEmail: initialValues.documentsEmail,
			salesEmail: initialValues.salesEmail,
			deliveryTerm: initialValues.deliveryTerm,
			giro: initialValues.giro,
			quoteValidityText: initialValues.quoteValidityText,
			quoteValidityDays: initialValues.quoteValidityDays,
			commercialTerms: initialValues.commercialTerms,
			bankDetails: initialValues.bankDetails,
			allowedPaymentMethods: initialValues.allowedPaymentMethods,
			defaultPaymentMethod: initialValues.defaultPaymentMethod,
		}),
		[initialValues],
	);

	const formik = useFormik<ISubempresaFormValues>({
		enableReinitialize: true,
		initialValues,
		validationSchema: Yup.object({
			nombre: Yup.string().required('El nombre es obligatorio'),
			rut: Yup.string(),
			telefono: Yup.string(),
			email: Yup.string().email('Email inválido'),
			direccion: Yup.string(),
			documentsEmail: Yup.string().email('Email inválido').nullable(),
			salesEmail: Yup.string().email('Email inválido').nullable(),
			allowedPaymentMethods: Yup.array()
				.of(Yup.string().oneOf(allowedPaymentOptions.map((o) => o.value)))
				.default([])
				.optional(),
			defaultPaymentMethod: Yup.string()
				.oneOf([...allowedPaymentOptions.map((o) => o.value), ''])
				.optional()
				.test(
					'default-in-allowed',
					'El método por defecto debe estar en la lista permitida',
					(value, ctx) => {
						if (!value) return true;
						return (ctx.parent.allowedPaymentMethods || []).includes(value);
					},
				),
		}),
		onSubmit: async (values) => {
			if (!subempresa?.id) return;
			const allowedPaymentMethods = (values.allowedPaymentMethods || []).filter(Boolean);
			let defaultPaymentMethod = values.defaultPaymentMethod || '';
			if (defaultPaymentMethod && !allowedPaymentMethods.includes(defaultPaymentMethod)) {
				defaultPaymentMethod = allowedPaymentMethods[0] || '';
			}
			const parsedValidity = Number(values.quoteValidityDays);
			const quoteValidityDays =
				values.quoteValidityDays === '' || Number.isNaN(parsedValidity)
					? undefined
					: parsedValidity;

			try {
				const data = {
					name: values.nombre,
					rut: values.rut || undefined,
					phone: values.telefono || undefined,
					email: values.email || undefined,
					address: values.direccion || undefined,
					subsidiary_documents_email: values.documentsEmail || undefined,
					subsidiary_sales_email: values.salesEmail || undefined,
					subsidiary_delivery_term: values.deliveryTerm || undefined,
					subsidiary_bank_details: values.bankDetails || undefined,
					subsidiary_allowed_payment_methods: allowedPaymentMethods,
					subsidiary_quote_validity_text: values.quoteValidityText || undefined,
					subsidiary_quote_validity_days: quoteValidityDays,
					subsidiary_giro: values.giro || undefined,
					subsidiary_commercial_terms: values.commercialTerms || undefined,
					subsidiary_default_payment_method: defaultPaymentMethod || undefined,
					commune_id: values.comuna ? Number(values.comuna) : undefined,
				};

				await dispatch(
					updateSubsidiaria({
						id: subempresa.id,
						company_id: subempresa.company_id,
						data: data as any,
					}),
				).unwrap();

				toast.success(`${values.nombre} ha sido actualizada correctamente`);
				setIsEditing(false);
				dispatch(fetchSubsidiariaDetail(subempresa.id));
			} catch (err: any) {
				toast.error('Error al actualizar la subempresa');
			}
		},
	});

	const handleValidateAndSubmit = async () => {
		const errors = await formik.validateForm();
		if (Object.keys(errors).length) {
			formik.setTouched(
				Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {
					...formik.touched,
				}),
				false,
			);
			const messages = Array.from(
				new Set(
					Object.values(errors)
						.map((message) =>
							typeof message === 'string' ? message : 'Campo inválido',
						)
						.filter(Boolean),
				),
			);
			toast.error(`Falta completar: ${messages.join(' · ')}`);
			return;
		}
		formik.handleSubmit();
	};

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		formik.resetForm();
		setIsEditing(false);
	};

	useEffect(() => {
		if (isEditing) {
			dispatch(listaRegionesThunk());
			dispatch(listaProvinciasThunk());
			dispatch(listaComunasThunk());
		}
	}, [isEditing, dispatch]);

	const handleLogoUpload = async (file?: File | null) => {
		if (!subempresa || !file) return;
		const validation = validateFile(file, {
			maxKB: 8192,
			allowedMimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
		});
		if (!validation.ok) {
			toast.error('Logo no válido. Usa JPG, PNG, WEBP o SVG (máx 8 MB).');
			return;
		}

		const formData = new FormData();
		formData.append('logo', file);
		setUploadingLogo(true);
		try {
			const resp = await ApiService.fetchData<{ data?: any }, FormData>({
				url: `/subsidiaries/${subempresa.id}/logo`,
				method: 'post',
				data: formData,
			});

			const payload = (resp.data as any)?.data ?? resp.data;
			const updatedLogo =
				payload?.logo_url ||
				payload?.logo ||
				payload?.data?.logo_url ||
				payload?.data?.logo;

			if (updatedLogo) {
				setSubempresa((prev) =>
					prev ? { ...prev, logo_url: updatedLogo, logo: updatedLogo } : prev,
				);
			}
			dispatch(fetchSubsidiariaDetail(subempresa.id));
			toast.success('Logo actualizado');
		} catch (err) {
			toast.error('No se pudo subir el logo');
		} finally {
			setUploadingLogo(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const { listaRegiones, listaProvincias, listaComunas } = useAppSelector((s) => s.core);
	const { optionsRegion, optionsProvincia, optionsComuna } = useGeoSelector(
		{
			values: formik.values as unknown as Record<string, unknown>,
			setFieldValue: formik.setFieldValue,
		},
		{
			regiones: listaRegiones as unknown as {
				codigo: string;
				nombre: string;
				codigo_padre?: string;
			}[],
			provincias: listaProvincias as unknown as {
				codigo: string;
				nombre: string;
				codigo_padre?: string;
			}[],
			comunas: listaComunas as unknown as {
				codigo: string;
				nombre: string;
				codigo_padre?: string;
			}[],
		},
		{ fieldRegion: 'region', fieldProvincia: 'provincia', fieldComuna: 'comuna' },
	);

	if (loading) {
		return (
			<PageWrapper isProtectedRoute title='Cargando...' name='Subempresa'>
				<Container className='pt-4'>
					<div className='flex items-center justify-center py-12'>
						<div className='flex items-center gap-3'>
							<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent' />
							<span className='text-zinc-600'>Cargando subempresa...</span>
						</div>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	if (!subempresa) {
		return (
			<PageWrapper isProtectedRoute title='Subempresa no encontrada' name='Subempresa'>
				<Container className='pt-4'>
					<div className='flex flex-col items-center justify-center py-12 text-center'>
						<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-800/20'>
							<Icon
								icon='HeroExclamationTriangle'
								className='text-2xl text-red-600'
							/>
						</div>
						<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
							Subempresa no encontrada
						</h3>
						<p className='mb-4 max-w-sm text-sm text-zinc-500'>
							La subempresa que buscas no existe o no tienes permisos para verla.
						</p>
						<Button
							variant='solid'
							onClick={() => navigate('/gestion/subempresa')}
							size='sm'>
							Volver a Subempresas
						</Button>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper
			isProtectedRoute
			title={`Subempresa: ${subempresa.name}`}
			name='Detalle Subempresa'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<Button
							variant='outline'
							size='sm'
							icon='HeroArrowLeft'
							onClick={() => navigate('/gestion/subempresa')}>
							Volver
						</Button>
						<div className='flex items-center gap-2'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-100'>
								<Icon
									icon='HeroBuildingStorefront'
									className='text-lg text-primary-600'
								/>
							</div>
							<div>
								<h1 className='text-lg font-semibold'>{subempresa.name}</h1>
								<p className='text-sm text-zinc-500'>ID: {subempresa.id}</p>
							</div>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight className='flex items-center gap-2'>
					<div className='flex items-center gap-2'>
						<input
							ref={fileInputRef}
							type='file'
							accept='image/*'
							className='hidden'
							onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
						/>
						<Button
							variant='outline'
							size='sm'
							icon='HeroPhoto'
							isLoading={uploadingLogo}
							isDisable={uploadingLogo}
							onClick={() => fileInputRef.current?.click()}>
							{uploadingLogo ? 'Subiendo...' : 'Subir logo'}
						</Button>
					</div>
					{isEditing ? (
						<>
							<Button
								variant='outline'
								onClick={handleCancelEdit}
								isDisable={formik.isSubmitting}>
								Cancelar
							</Button>
							<Button
								variant='solid'
								icon='HeroCheck'
								onClick={handleValidateAndSubmit}
								isLoading={formik.isSubmitting}
								isDisable={formik.isSubmitting}>
								Guardar
							</Button>

							<Button
								variant='solid'
								onClick={() => setOpenDelete(true)}
								icon='HeroTrash'
								color='red'>
								Eliminar
							</Button>
						</>
					) : (
						<>
							<Button variant='outline' icon='HeroPencil' onClick={handleEdit}>
								Editar
							</Button>
							<Button
								variant='solid'
								onClick={() => setOpenDelete(true)}
								icon='HeroTrash'
								color='red'>
								Eliminar
							</Button>
						</>
					)}
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<Card className='mb-4'>
					<ButtonGroup>
						<Button
							variant='outline'
							onClick={() => setActiveTab('basic')}
							icon='DuoInfoCircle'
							className={`px-3 py-2 text-sm font-medium ${activeTab == 'basic' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-zinc-400'}`}>
							Información básica
						</Button>
						<Button
							variant='outline'
							onClick={() => setActiveTab('commercial')}
							icon='DuoInfoCircle'
							className={`px-3 py-2 text-sm font-medium ${activeTab == 'commercial' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-zinc-400'}`}>
							Datos comerciales
						</Button>
					</ButtonGroup>
				</Card>

				{activeTab === 'basic' && (
					<BasicParts
						subempresa={subempresa}
						isEditing={isEditing}
						formik={formik}
						viewData={viewData}
						optionsRegion={optionsRegion}
						optionsProvincia={optionsProvincia}
						optionsComuna={optionsComuna}
					/>
				)}

				{activeTab === 'commercial' && (
					<ComercialParts
						isEditing={isEditing}
						formik={formik}
						commercialView={commercialView}
						allowedPaymentOptions={allowedPaymentOptions}
					/>
				)}
			</Container>

			<DeleteSubempresaModal
				isOpen={openDelete}
				onClose={() => setOpenDelete(false)}
				subempresaId={subempresa.id}
				subsiName={subempresa.name || subempresa.subsidiary_name || ''}
				isNavigate
			/>
		</PageWrapper>
	);
}
