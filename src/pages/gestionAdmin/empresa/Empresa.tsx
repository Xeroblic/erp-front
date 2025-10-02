// src/pages/EmpresaDetalle.tsx
import React, { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAppDispatch, useAppSelector } from '@/store'
import {
	fetchMiEmpresa,
	updateMiEmpresa,
	fetchMiEmpresaSubsidiarias
} from '@/store/slices/empresa/empresaSlice'
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper'
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader'
import Container from '@/components/layouts/Container/Container'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Label from '@/components/form/Label'
import Input from '@/components/form/Input'
import Textarea from '@/components/form/Textarea'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/icon/Icon'
import { IEmpresa } from '@/interface/empresas.interface'
import { toast } from 'react-toastify'
import { unwrapResult } from '@reduxjs/toolkit'
import SubsidiariesTable from './SubsidiariesTable'
import Spinner from '@/components/ui/Spinner'

export default function EmpresaDetalle() {
	const dispatch = useAppDispatch()
	// 🔥 NUEVO: Usar estado dinámico
	const { miEmpresa, miEmpresaSubsidiarias, loading, error, updateLoading } = useAppSelector(s => s.empresa)
	const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'subsidiaries'>('general')

	useEffect(() => {
		dispatch(fetchMiEmpresa());
		dispatch(fetchMiEmpresaSubsidiarias());
	}, [dispatch]);

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
				.matches(/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9kK]{1}$/, 'El RUT no tiene un formato válido'),
			company_type: Yup.string()
				.required('El tipo de empresa es requerido'),
			business_activity: Yup.string()
				.required('La actividad comercial es requerida')
				.max(255, 'La actividad comercial no puede superar los 255 caracteres'),
			company_website: Yup.string()
				.url('Debe ser una URL válida')
				.nullable(),
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
		onSubmit: async values => {
			try {
				const action = await dispatch(updateMiEmpresa(values));
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
		}
	})

	const tabs = [
		{ id: 'general', label: 'Información General', icon: 'HeroBuilding' },
		{ id: 'contact', label: 'Contacto', icon: 'HeroPhone' },
		{ id: 'subsidiaries', label: 'Subempresas', icon: 'HeroBuildingStorefront' },
	] as const


	// 4) Render
	return (
		<PageWrapper isProtectedRoute title="Gestión de Empresa" name="Empresa Principal">
			<Subheader>
				<SubheaderLeft>
					<div className="flex items-center gap-3">
						<Icon icon="HeroBuilding" className="text-2xl" />
						<div>
							<h1 className="text-2xl font-bold">{miEmpresa?.company_name || 'Empresa'}</h1>
							<div className="flex items-center gap-2 mt-1">
								<Badge variant="solid">
									{miEmpresa?.company_type}
								</Badge>
								<Badge variant="outline" className={miEmpresa?.is_active ? 'text-green-600' : 'text-red-600'}>
									{miEmpresa?.is_active ? 'Activa' : 'Inactiva'}
								</Badge>
							</div>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant="solid"
						icon="HeroCloudArrowUp"
						onClick={() => formik.handleSubmit()}
						isDisable={formik.isSubmitting || !formik.dirty}
					>
						{formik.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className="pt-4 space-y-6">
				{/* Tabs Navigation */}
				<Card>
					<div className="border-b border-zinc-200 dark:border-zinc-700">
						<nav className="flex space-x-8 px-6">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === tab.id
										? 'border-primary-500 text-primary-600'
										: 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
										}`}
								>
									<Icon icon={tab.icon} />
									{tab.label}
								</button>
							))}
						</nav>
					</div>

					<CardBody>
						{/* Loading/Error/Empty States */}
						{loading && (
							<Spinner nombre="Cargando empresa" />
						)}
						{error && (
							<div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg shadow-inner">
								<span className="inline-flex items-center text-lg text-red-700 font-semibold bg-red-100 border border-red-300 rounded px-8 py-4 shadow-sm">
									<svg className="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
									</svg>
									Error: {error}
								</span>
							</div>
						)}
						{!loading && !error && !miEmpresa && (
							<div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg shadow-inner">
								<span className="inline-flex items-center text-lg text-gray-600 bg-gray-100 border border-gray-300 rounded px-8 py-4 shadow-sm">
									<svg className="w-6 h-6 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z" />
									</svg>
									No existe empresa configurada
								</span>
							</div>
						)}
						{/* Main Form */}
						{!loading && !error && miEmpresa && (
							<form onSubmit={formik.handleSubmit} className="space-y-6 mt-6">
								{/* Información General */}
								{activeTab === 'general' && (
									<div className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											{/* Nombre Comercial */}
											<div>
												<Label htmlFor="company_name">Nombre Comercial *</Label>
												<Input
													id="company_name"
													name="company_name"
													value={formik.values.company_name}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder="Ej: EcoTech SPA"
												/>
												{formik.touched.company_name && formik.errors.company_name && (
													<p className="mt-1 text-red-600 text-sm">{formik.errors.company_name}</p>
												)}
											</div>

											{/* Razón Social */}
											<div>
												<Label htmlFor="legal_name">Razón Social *</Label>
												<Input
													id="legal_name"
													name="legal_name"
													value={formik.values.legal_name}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder="Ej: EcoTech Soluciones Tecnológicas SpA"
												/>
												{formik.touched.legal_name && formik.errors.legal_name && (
													<p className="mt-1 text-red-600 text-sm">{formik.errors.legal_name}</p>
												)}
											</div>

											{/* RUT */}
											<div>
												<Label htmlFor="company_rut">RUT *</Label>
												<Input
													id="company_rut"
													name="company_rut"
													value={formik.values.company_rut}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder="Ej: 76.795.560-9"
												/>
												{formik.touched.company_rut && formik.errors.company_rut && (
													<p className="mt-1 text-red-600 text-sm">{formik.errors.company_rut}</p>
												)}
											</div>

											{/* Tipo de Empresa */}
											<div>
												<Label htmlFor="company_type">Tipo de Empresa *</Label>
												<Input
													id="company_type"
													name="company_type"
													value={formik.values.company_type}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder="Ej: SPA, LTDA, SA"
												/>
												{formik.touched.company_type && formik.errors.company_type && (
													<p className="mt-1 text-red-600 text-sm">{formik.errors.company_type}</p>
												)}
											</div>
										</div>

										{/* Actividad Comercial */}
										<div>
											<Label htmlFor="business_activity">Actividad Comercial *</Label>
											<Textarea
												id="business_activity"
												name="business_activity"
												value={formik.values.business_activity}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder="Describe la actividad principal de la empresa"
												rows={3}
											/>
											{formik.touched.business_activity && formik.errors.business_activity && (
												<p className="mt-1 text-red-600 text-sm">{formik.errors.business_activity}</p>
											)}
										</div>

										{/* Sitio Web */}
										<div>
											<Label htmlFor="company_website">Sitio Web</Label>
											<Input
												id="company_website"
												name="company_website"
												type="url"
												value={formik.values.company_website}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder="https://www.ejemplo.cl"
											/>
											{formik.touched.company_website && formik.errors.company_website && (
												<p className="mt-1 text-red-600 text-sm">{formik.errors.company_website}</p>
											)}
										</div>
									</div>
								)}

								{activeTab === 'contact' && (
									<div className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div>
												<Label htmlFor="company_phone">Teléfono Principal</Label>
												<Input
													id="company_phone"
													name="company_phone"
													type="tel"
													value={formik.values.company_phone}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder="+56 9 1234 5678"
												/>
												{formik.touched.company_phone && formik.errors.company_phone && (
													<p className="mt-1 text-red-600 text-sm">{formik.errors.company_phone}</p>
												)}
											</div>

											<div>
												<Label htmlFor="contact_email">Email de Contacto *</Label>
												<Input
													id="contact_email"
													name="contact_email"
													type="email"
													value={formik.values.contact_email}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													placeholder="contacto@empresa.cl"
												/>
												{formik.touched.contact_email && formik.errors.contact_email && (
													<p className="mt-1 text-red-600 text-sm">{formik.errors.contact_email}</p>
												)}
											</div>
										</div>

										<div>
											<Label htmlFor="company_address">Dirección *</Label>
											<Textarea
												id="company_address"
												name="company_address"
												value={formik.values.company_address}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder="Dirección completa de la empresa"
												rows={2}
											/>
											{formik.touched.company_address && formik.errors.company_address && (
												<p className="mt-1 text-red-600 text-sm">{formik.errors.company_address}</p>
											)}
										</div>

										{/* Representante Legal */}
										<div>
											<Label htmlFor="representative_name">Representante Legal *</Label>
											<Input
												id="representative_name"
												name="representative_name"
												value={formik.values.representative_name}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												placeholder="Nombre completo del representante legal"
											/>
											{formik.touched.representative_name && formik.errors.representative_name && (
												<p className="mt-1 text-red-600 text-sm">{formik.errors.representative_name}</p>
											)}
										</div>
									</div>
								)}

								{/* Subempresas */}
								{activeTab === 'subsidiaries' && (
									<div className="space-y-6">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-medium">Subempresas</h3>
												<p className="text-sm text-zinc-500">
													Gestiona las subempresas asociadas a {miEmpresa?.company_name}
												</p>
											</div>
										</div>

										<SubsidiariesTable
											subsidiaries={miEmpresaSubsidiarias || []}
											loading={loading}
											onRefresh={() => dispatch(fetchMiEmpresaSubsidiarias())}
										/>
									</div>
								)}
							</form>
						)}
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	)
}
