// src/pages/EmpresaDetalle.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchMiEmpresa,
	updateMiEmpresa,
	fetchMiEmpresaSubsidiarias,
} from '@/store/slices/empresa/empresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { IEmpresa } from '@/interface/empresas.interface';
import { toast } from 'react-toastify';
import { unwrapResult } from '@reduxjs/toolkit';
import SubsidiariesTable from './SubsidiariesTable';
import Spinner from '@/components/ui/Spinner';
import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { useGeoSelector } from '@/hooks/useGeoSelector';

export default function EmpresaDetalle() {
	const dispatch = useAppDispatch();
	const user = useAppSelector((s) => s.auth.user);
	const { miEmpresa, miEmpresaSubsidiarias, loading, error, updateLoading } = useAppSelector(
		(s) => s.empresa,
	);
	const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'subsidiaries'>('general');
	const hasLoadedData = useRef(false);

	useEffect(() => {
		if (!user) return;

		if (hasLoadedData.current) return;

		const loadData = async () => {
			hasLoadedData.current = true;

			try {
				await dispatch(fetchMiEmpresa()).unwrap();
			} catch (err) {
				console.error('Error al cargar empresa:', err);
			}

			try {
				await dispatch(fetchMiEmpresaSubsidiarias());
			} catch (err) {
				console.error('Error al cargar subsidiarias:', err);
			}
		};

		loadData();
	}, [dispatch, user]);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			company_name: miEmpresa?.company_name || '',
			legal_name: miEmpresa?.legal_name || '',
			company_rut: miEmpresa?.company_rut || '',
			company_type: miEmpresa?.company_type || '',
			business_activity: miEmpresa?.business_activity || '',
			company_website: miEmpresa?.company_website || '',
			company_phone: miEmpresa?.company_phone || '',
			company_address: miEmpresa?.company_address || '',
			representative_name: miEmpresa?.representative_name || '',
			contact_email: miEmpresa?.contact_email || '',
			region: '',
			provincia: '',
			comuna: (miEmpresa as any)?.commune_id
				? String((miEmpresa as any).commune_id)
				: (miEmpresa as any)?.commune?.id
					? String((miEmpresa as any).commune.id)
					: '',
		},
		validationSchema: Yup.object({
			company_name: Yup.string()
				.required('El nombre es requerido')
				.min(3, 'El nombre debe tener al menos 3 caracteres')
				.max(100, 'El nombre no puede superar los 100 caracteres'),
			legal_name: Yup.string()
				.required('La razón social es requerida')
				.min(3, 'La razón social debe tener al menos 3 caracteres')
				.max(150, 'La razón social no puede superar los 150 caracteres'),
			company_rut: Yup.string()
				.required('El RUT es requerido')
				.matches(
					/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9kK]{1}$/,
					'El RUT no tiene un formato válido',
				),
			company_type: Yup.string().required('El tipo de empresa es requerido'),
			business_activity: Yup.string()
				.required('La actividad comercial es requerida')
				.max(255, 'La actividad comercial no puede superar los 255 caracteres'),
			company_website: Yup.string().url('Debe ser una URL válida').nullable(),
			company_phone: Yup.string()
				.matches(/^\+?[0-9\s\-\(\)]{8,20}$/, 'El teléfono no tiene un formato válido')
				.nullable(),
			company_address: Yup.string()
				.required('La dirección es requerida')
				.max(255, 'La dirección no puede superar los 255 caracteres'),
			representative_name: Yup.string()
				.required('El nombre del representante es requerido')
				.max(100, 'El nombre del representante no puede superar los 100 caracteres'),
			contact_email: Yup.string()
				.email('Debe ser un email válido')
				.required('El email de contacto es requerido'),
		}),
		onSubmit: async (values) => {
			try {
				const action = await dispatch(
					updateMiEmpresa({
						...values,
						commune_id: values.comuna ? Number(values.comuna) : undefined,
					} as any),
				);
				unwrapResult(action);
				toast.success('Empresa actualizada correctamente');
				dispatch(fetchMiEmpresa());
			} catch (e: any) {
				if (e?.response?.data?.errors) {
					Object.values(e.response.data.errors).forEach((msg: any) => toast.error(msg));
				} else {
					toast.error('Error al actualizar la empresa: ' + (e.message || e));
				}
				console.error('Error al actualizar la empresa:', e);
			}
		},
	});

	useEffect(() => {
		dispatch(listaRegionesThunk());
		dispatch(listaProvinciasThunk());
		dispatch(listaComunasThunk());
	}, [dispatch]);

	const { listaRegiones, listaProvincias, listaComunas } = useAppSelector((s) => s.core);
	const { optionsRegion, optionsProvincia, optionsComuna } = useGeoSelector(
		formik as any,
		{
			regiones: listaRegiones as any,
			provincias: listaProvincias as any,
			comunas: listaComunas as any,
		},
		{ fieldRegion: 'region', fieldProvincia: 'provincia', fieldComuna: 'comuna' },
	);

	const selectedComunaValue = formik.values.comuna ? String(formik.values.comuna) : '';
	const selectedComunaOption: TSelectOption | null =
		optionsComuna.find((o) => o.value === selectedComunaValue) ||
		(selectedComunaValue
			? listaComunas?.find((c: any) => String(c.codigo) === selectedComunaValue)
				? {
						value: selectedComunaValue,
						label: listaComunas.find(
							(c: any) => String(c.codigo) === selectedComunaValue,
						)!.nombre,
					}
				: { value: selectedComunaValue, label: 'Cargando…' }
			: null);

	const effectiveOptionsComuna: TSelectOption[] = React.useMemo(() => {
		if (!selectedComunaOption) return optionsComuna;
		const exists = optionsComuna.some((o) => o.value === selectedComunaOption.value);
		return exists ? optionsComuna : [selectedComunaOption, ...optionsComuna];
	}, [optionsComuna, selectedComunaOption]);

	useEffect(() => {
		try {
			// debug logs removed
			// console.log('DBG comuna state:', {
			// 	miCompanyCommuneId:
			// 		(miEmpresa as any)?.commune_id ?? (miEmpresa as any)?.commune?.id,
			// 	formikComuna: formik.values.comuna,
			// 	selectedComunaOption,
			// 	optionsComunaLen: optionsComuna.length,
			// 	listaComunasLen: listaComunas?.length,
			// });
			if (listaComunas?.length) {
				const targetId =
					(miEmpresa as any)?.commune_id ??
					(miEmpresa as any)?.commune?.id ??
					formik.values.comuna;
				if (targetId) {
					const found = listaComunas.find(
						(c: any) => String(c.codigo) === String(targetId),
					);
					if (found && String(formik.values.comuna) !== String(found.codigo)) {
						// debug log removed
						// console.log('DBG syncing comuna from listaComunas ->', found);
						formik.setFieldValue('comuna', String(found.codigo), false);
					}
				}
			}
		} catch (e) {
			console.warn('Error syncing comuna field:', e);
		}
	}, [listaComunas, optionsComuna, miEmpresa, formik.values.comuna]);

	useEffect(() => {
		if (!miEmpresa) return;
		const communeId = (miEmpresa as any)?.commune_id ?? (miEmpresa as any)?.commune?.id;
		if (!communeId) return;
		if (!listaComunas?.length || !listaProvincias?.length) return;

		const comunaObj = listaComunas.find((c: any) => String(c.codigo) === String(communeId));
		if (!comunaObj) return;
		const provinciaCode = comunaObj.codigo_padre;
		const provinciaObj = listaProvincias.find(
			(p: any) => String(p.codigo) === String(provinciaCode),
		);
		const regionCode = provinciaObj ? provinciaObj.codigo_padre : '';

		if (regionCode && String(formik.values.region) !== String(regionCode)) {
			formik.setFieldValue('region', String(regionCode), false);
		}
		if (provinciaCode && String(formik.values.provincia) !== String(provinciaCode)) {
			formik.setFieldValue('provincia', String(provinciaCode), false);
		}
		if (String(formik.values.comuna) !== String(comunaObj.codigo)) {
			formik.setFieldValue('comuna', String(comunaObj.codigo), false);
		}
	}, [miEmpresa, listaComunas, listaProvincias]);

	const tabs = [
		{ id: 'general', label: 'Información General', icon: 'HeroBuilding' },
		{ id: 'contact', label: 'Contacto', icon: 'HeroPhone' },
		{ id: 'subsidiaries', label: 'Subempresas', icon: 'HeroBuildingStorefront' },
	] as const;

	return (
		<PageWrapper isProtectedRoute title='Gestión de Empresa' name='Empresa Principal'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<Icon icon='HeroBuilding' className='text-2xl' />
						<div>
							<h1 className='text-2xl font-bold'>
								{miEmpresa?.company_name || 'Empresa'}
							</h1>
							<div className='mt-1 flex items-center gap-2'>
								<Badge variant='solid'>{miEmpresa?.company_type}</Badge>
								<Badge
									variant='outline'
									className={
										miEmpresa?.is_active ? 'text-green-600' : 'text-red-600'
									}>
									{miEmpresa?.is_active ? 'Activa' : 'Inactiva'}
								</Badge>
							</div>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='solid'
						icon='HeroCloudArrowUp'
						onClick={() => formik.handleSubmit()}
						isDisable={formik.isSubmitting || !formik.dirty}>
						{formik.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='space-y-6 pt-4'>
				{/* Tabs Navigation */}
				<Card>
					<div className='border-b border-zinc-200 dark:border-zinc-700'>
						<nav className='flex space-x-8 px-6'>
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
										activeTab === tab.id
											? 'border-primary-500 text-primary-600'
											: 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
									}`}>
									<Icon icon={tab.icon} />
									{tab.label}
								</button>
							))}
						</nav>
					</div>

					<CardBody>
						{/* Loading/Error/Empty States */}
						{loading && <Spinner nombre='Cargando empresa' />}
						{error && (
							<div className='flex h-64 flex-col items-center justify-center rounded-lg bg-red-50 shadow-inner'>
								<span className='inline-flex items-center rounded border border-red-300 bg-red-100 px-8 py-4 text-lg font-semibold text-red-700 shadow-sm'>
									<svg
										className='mr-2 h-6 w-6 text-red-500'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											d='M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z'
										/>
									</svg>
									Error: {error}
								</span>
							</div>
						)}
						{!loading && !error && !miEmpresa && (
							<div className='flex h-64 flex-col items-center justify-center rounded-lg bg-gray-50 shadow-inner'>
								<span className='inline-flex items-center rounded border border-gray-300 bg-gray-100 px-8 py-4 text-lg text-gray-600 shadow-sm'>
									<svg
										className='mr-2 h-6 w-6 text-gray-400'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											d='M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z'
										/>
									</svg>
									No existe empresa configurada
								</span>
							</div>
						)}
						{/* Main Form */}
						{!loading && !error && miEmpresa && (
							<form onSubmit={formik.handleSubmit} className='mt-6 space-y-6'>
								{/* Información General */}
								{activeTab === 'general' && (
									<div className='space-y-6'>
										<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
											{/* Nombre Comercial */}
											<div>
												<Label htmlFor='company_name'>
													Nombre Comercial *
												</Label>
												<Input
													id='company_name'
													name='company_name'
													value={formik.values.company_name}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder='Ej: EcoTech SPA'
												/>
												{formik.touched.company_name &&
													formik.errors.company_name && (
														<p className='mt-1 text-sm text-red-600'>
															{formik.errors.company_name}
														</p>
													)}
											</div>

											{/* Razón Social */}
											<div>
												<Label htmlFor='legal_name'>Razón Social *</Label>
												<Input
													id='legal_name'
													name='legal_name'
													value={formik.values.legal_name}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder='Ej: EcoTech Soluciones Tecnológicas SpA'
												/>
												{formik.touched.legal_name &&
													formik.errors.legal_name && (
														<p className='mt-1 text-sm text-red-600'>
															{formik.errors.legal_name}
														</p>
													)}
											</div>

											{/* RUT */}
											<div>
												<Label htmlFor='company_rut'>RUT *</Label>
												<Input
													id='company_rut'
													name='company_rut'
													value={formik.values.company_rut}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder='Ej: 76.795.560-9'
												/>
												{formik.touched.company_rut &&
													formik.errors.company_rut && (
														<p className='mt-1 text-sm text-red-600'>
															{formik.errors.company_rut}
														</p>
													)}
											</div>

											{/* Tipo de Empresa */}
											<div>
												<Label htmlFor='company_type'>
													Tipo de Empresa *
												</Label>
												<Input
													id='company_type'
													name='company_type'
													value={formik.values.company_type}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder='Ej: SPA, LTDA, SA'
												/>
												{formik.touched.company_type &&
													formik.errors.company_type && (
														<p className='mt-1 text-sm text-red-600'>
															{formik.errors.company_type}
														</p>
													)}
											</div>
										</div>

										{/* Actividad Comercial */}
										<div>
											<Label htmlFor='business_activity'>
												Actividad Comercial *
											</Label>
											<Textarea
												id='business_activity'
												name='business_activity'
												value={formik.values.business_activity}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder='Describe la actividad principal de la empresa'
												rows={3}
											/>
											{formik.touched.business_activity &&
												formik.errors.business_activity && (
													<p className='mt-1 text-sm text-red-600'>
														{formik.errors.business_activity}
													</p>
												)}
										</div>

										{/* Sitio Web */}
										<div>
											<Label htmlFor='company_website'>Sitio Web</Label>
											<Input
												id='company_website'
												name='company_website'
												type='url'
												value={formik.values.company_website}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder='https://www.ejemplo.cl'
											/>
											{formik.touched.company_website &&
												formik.errors.company_website && (
													<p className='mt-1 text-sm text-red-600'>
														{formik.errors.company_website}
													</p>
												)}
										</div>
									</div>
								)}

								{activeTab === 'contact' && (
									<div className='space-y-6'>
										<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
											<div>
												<Label htmlFor='company_phone'>
													Teléfono Principal
												</Label>
												<Input
													id='company_phone'
													name='company_phone'
													type='tel'
													value={formik.values.company_phone}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder='+56 9 1234 5678'
												/>
												{formik.touched.company_phone &&
													formik.errors.company_phone && (
														<p className='mt-1 text-sm text-red-600'>
															{formik.errors.company_phone}
														</p>
													)}
											</div>

											<div>
												<Label htmlFor='contact_email'>
													Email de Contacto *
												</Label>
												<Input
													id='contact_email'
													name='contact_email'
													type='email'
													value={formik.values.contact_email}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder='contacto@empresa.cl'
												/>
												{formik.touched.contact_email &&
													formik.errors.contact_email && (
														<p className='mt-1 text-sm text-red-600'>
															{formik.errors.contact_email}
														</p>
													)}
											</div>
										</div>

										<div>
											<Label htmlFor='company_address'>Dirección *</Label>
											<Textarea
												id='company_address'
												name='company_address'
												value={formik.values.company_address}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder='Dirección completa de la empresa'
												rows={2}
											/>
											{formik.touched.company_address &&
												formik.errors.company_address && (
													<p className='mt-1 text-sm text-red-600'>
														{formik.errors.company_address}
													</p>
												)}
										</div>

										{/* Región / Provincia / Comuna */}
										<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
											<div>
												<Label htmlFor='region'>Región</Label>
												<SelectReact
													name='region'
													placeholder='Seleccione región'
													value={
														optionsRegion.find(
															(o) =>
																o.value ===
																String(formik.values.region),
														) || null
													}
													onChange={(opt) =>
														formik.setFieldValue(
															'region',
															(opt as TSelectOption | null)?.value ||
																'',
														)
													}
													options={optionsRegion}
												/>
											</div>

											<div>
												<Label htmlFor='provincia'>Provincia</Label>
												<SelectReact
													name='provincia'
													placeholder='Seleccione provincia'
													value={
														optionsProvincia.find(
															(o) =>
																o.value ===
																String(formik.values.provincia),
														) || null
													}
													onChange={(opt) =>
														formik.setFieldValue(
															'provincia',
															(opt as TSelectOption | null)?.value ||
																'',
														)
													}
													options={optionsProvincia}
												/>
											</div>

											<div>
												<Label htmlFor='comuna'>Comuna</Label>
												<SelectReact
													name='comuna'
													placeholder='Seleccione comuna'
													value={selectedComunaOption}
													onChange={(opt) =>
														formik.setFieldValue(
															'comuna',
															(opt as TSelectOption | null)?.value ||
																'',
														)
													}
													options={effectiveOptionsComuna}
												/>
											</div>
										</div>

										{/* Representante Legal */}
										<div>
											<Label htmlFor='representative_name'>
												Representante Legal *
											</Label>
											<Input
												id='representative_name'
												name='representative_name'
												value={formik.values.representative_name}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder='Nombre completo del representante legal'
											/>
											{formik.touched.representative_name &&
												formik.errors.representative_name && (
													<p className='mt-1 text-sm text-red-600'>
														{formik.errors.representative_name}
													</p>
												)}
										</div>
									</div>
								)}

								{/* Subempresas */}
								{activeTab === 'subsidiaries' && (
									<div className='space-y-6'>
										<div className='flex items-center justify-between'>
											<div>
												<h3 className='text-lg font-medium'>Subempresas</h3>
												<p className='text-sm text-zinc-500'>
													Gestiona las subempresas asociadas a{' '}
													{miEmpresa?.company_name}
												</p>
											</div>
										</div>

										<SubsidiariesTable
											subsidiaries={miEmpresaSubsidiarias || []}
											loading={loading}
											onRefresh={() =>
												dispatch(
													fetchMiEmpresaSubsidiarias({ force: true }),
												)
											}
										/>
									</div>
								)}
							</form>
						)}
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
}
