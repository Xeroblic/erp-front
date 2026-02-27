// src/pages/EmpresaDetalle.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { unwrapResult } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMiEmpresa, updateMiEmpresa } from '@/store/slices/empresa/empresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Spinner from '@/components/ui/Spinner';
import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { companyValidationSchema } from './helpers/companyValidation';
import { CompanyGeneralFields, CompanyContactFields } from './components';

export default function EmpresaDetalle() {
	const dispatch = useAppDispatch();
	const user = useAppSelector((s) => s.auth.user);
	const { miEmpresa, loading, error } = useAppSelector((s) => s.empresa);
	const [activeTab, setActiveTab] = useState<'general' | 'contact'>('general');
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
		validationSchema: companyValidationSchema,
		onSubmit: async (values) => {
			console.log('Submitting Empresa:', values);
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
				console.log('Error submitting Empresa:', e);
				if (e?.response?.data?.errors) {
					Object.values(e.response.data.errors).forEach((msg: any) => toast.error(msg));
				} else {
					toast.error(`Error al actualizar la empresa: ${e.message || e}`);
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

	useEffect(() => {
		try {
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
						formik.setFieldValue('comuna', String(found.codigo), false);
					}
				}
			}
		} catch (e) {
			console.warn('Error syncing comuna field:', e);
		}
	}, [listaComunas, miEmpresa, formik.values.comuna]);

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
	] as const;

	return (
		<PageWrapper isProtectedRoute title='Gestión de Empresa' name='Empresa Principal'>
			<Subheader className='items-center justify-center'>
				<SubheaderLeft>
					<div>
						<div className='flex items-center gap-2'>
							<Icon icon='DuoBuilding' className='text-3xl' />
							<Badge className='mb-1 text-2xl font-bold'>
								{miEmpresa?.company_name || 'Empresa'}
							</Badge>
							<Badge
								variant='solid'
								className={`ml-4 gap-3 px-2 ${miEmpresa?.is_active ? 'text-green-600' : 'text-red-600'}`}>
								{miEmpresa?.company_type}
								<span className='font-bold text-white'>
									{miEmpresa?.is_active ? 'Activa' : 'Inactiva'}
								</span>
							</Badge>
						</div>
						<div className='flex flex-col gap-2'>
							<p className='mt-1 text-sm text-zinc-500'>
								Este módulo permite gestionar la información principal y de contacto
								de la empresa.
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight className='space-x-2'>
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
									<CompanyGeneralFields formik={formik} />
								)}

								{activeTab === 'contact' && (
									<CompanyContactFields formik={formik} />
								)}
							</form>
						)}
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
}
