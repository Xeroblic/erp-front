// src/pages/EmpresaDetalle.tsx
import React, { useEffect } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchEmpresaPrincipal, patchEmpresaPrincipal } from '@/store/slices/empresa/empresaSlice'
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper'
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader'
import Container from '@/components/layouts/Container/Container'
import Card, { CardBody } from '@/components/ui/Card'
import Label from '@/components/form/Label'
import Input from '@/components/form/Input'
import Button from '@/components/ui/Button'
import { IEmpresa } from '@/interface/empresas.interface'
import { toast } from 'react-toastify'
import { unwrapResult } from '@reduxjs/toolkit'

export default function EmpresaDetalle() {
	const dispatch = useAppDispatch()
	const { detalleEmpresa, loading, error } = useAppSelector(s => s.empresa)

	// 1) Carga al montar
	useEffect(() => {
		dispatch(fetchEmpresaPrincipal(1));
	}, [dispatch]);

	// 2) Formik
	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			company_name: detalleEmpresa?.company_name || '',
			company_rut: detalleEmpresa?.company_rut || '',
			business_activity: detalleEmpresa?.business_activity || '',
		},
		validationSchema: Yup.object({
			company_name: Yup.string()
				.required('El nombre es requerido')
				.min(3, 'El nombre debe tener al menos 3 caracteres')
				.max(100, 'El nombre no puede superar los 100 caracteres')
				.matches(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]+$/, 'El nombre contiene caracteres inválidos'),
			company_rut: Yup.string()
				.required('El RUT es requerido')
				.matches(/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9kK]{1}$/, 'El RUT no tiene un formato válido'),
			business_activity: Yup.string()
				.nullable()
				.max(255, 'La descripción no puede superar los 255 caracteres'),
		}),
		validate: values => {
			const errors: Record<string, string> = {};
			if (values.company_name && values.company_name.trim().length === 0) {
				errors.company_name = 'El nombre no puede estar vacío';
			}
			if (values.company_rut && !/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9kK]{1}$/.test(values.company_rut)) {
				errors.company_rut = 'El RUT no tiene un formato válido';
			}
			if (Object.keys(errors).length > 0) {
				Object.values(errors).forEach(msg => toast.error(msg));
			}
			return errors;
		},
		onSubmit: async values => {
			if (!detalleEmpresa?.id) {
				toast.error('No se puede actualizar: empresa no cargada');
				return;
			}
			try {
				const action = await dispatch(
					patchEmpresaPrincipal({ id: detalleEmpresa.id, ...values })
				);
				unwrapResult(action);
				toast.success('Empresa actualizada correctamente');
				dispatch(fetchEmpresaPrincipal(detalleEmpresa.id));
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
	// 3) Estados
	if (loading)
		return (
			<div className="flex flex-col items-center justify-center h-64 rounded-lg shadow-inner">
				<span className="animate-spin rounded-full h-10 w-10 border-4 border-blue-400 border-t-transparent mb-4"></span>
				<span className="text-lg text-blue-700 font-medium">Cargando empresa…</span>
			</div>
		)
	if (error)
		return (
			<div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg shadow-inner">
				<span className="inline-flex items-center text-lg text-red-700 font-semibold bg-red-100 border border-red-300 rounded px-8 py-4 shadow-sm">
					<svg className="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
					</svg>
					Error: {error}
				</span>
			</div>
		)
	if (!detalleEmpresa)
		return (
			<div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg shadow-inner">
				<span className="inline-flex items-center text-lg text-gray-600 bg-gray-100 border border-gray-300 rounded px-8 py-4 shadow-sm">
					<svg className="w-6 h-6 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z" />
					</svg>
					No existe empresa configurada
				</span>
			</div>
		)

	// 4) Render
	return (
		<PageWrapper isProtectedRoute title="Detalle de Empresa" name={detalleEmpresa.company_name}>
			<Container className="pt-4 space-y-6">
				{/* ● Formulario de edición */}
				<form onSubmit={formik.handleSubmit} className="space-y-6">
					<Card>
						<div className=" px-6 py-4 flex justify-end">
							<Button variant="solid" onClick={() => formik.handleSubmit()}>
								Guardar cambios
							</Button>
						</div>
						<CardBody className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Nombre */}
								<div>
									<Label htmlFor="nombre">Nombre de la empresa</Label>
									<Input
										id="nombre"
										name="nombre"
										value={formik.values.company_name}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.company_name && formik.errors.company_name && (
										<p className="mt-1 text-red-600 text-sm">{formik.errors.company_name}</p>
									)}
								</div>

								{/* RUT */}
								<div>
									<Label htmlFor="rut">RUT</Label>
									<Input
										id="company_rut"
										name="company_rut"
										value={formik.values.company_rut}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.company_rut && formik.errors.company_rut && (
										<p className="mt-1 text-red-600 text-sm">{formik.errors.company_rut}</p>
									)}
								</div>

								{/* Descripción */}
								<div className="md:col-span-2">
									<Label htmlFor="descripcion">Descripción</Label>
									<Input
										id="business_activity"
										name="business_activity"
										value={formik.values.business_activity}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.business_activity && formik.errors.business_activity && (
										<p className="mt-1 text-red-600 text-sm">{formik.errors.business_activity}</p>
									)}
								</div>
							</div>

							{/* Metadatos */}
							<div className="border-t pt-6">
								<dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-700">
									<div>
										<dt className="font-medium">Creada el</dt>
										<dd className="mt-1">{new Date(detalleEmpresa.created_at).toLocaleString()}</dd>
									</div>
									<div>
										<dt className="font-medium">Última actualización</dt>
										<dd className="mt-1">{new Date(detalleEmpresa.updated_at).toLocaleString()}</dd>
									</div>
									<div>
										<dt className="font-medium">Rol asignado</dt>
										<dd className="mt-1">#{detalleEmpresa.pivot?.rol_id}</dd>
									</div>
								</dl>
							</div>
						</CardBody>
					</Card>
				</form>

				{/* ● Subempresas y sucursales */}
				<Card>
					<CardBody className="space-y-4">
						<h2 className="text-xl font-semibold">Subempresas</h2>
						{detalleEmpresa.subsidiaries?.length ? (
							<ul className="space-y-4">
								{detalleEmpresa.subsidiaries!.map(sub => (
									<li key={sub.id} className=" rounded-lg p-4 ">
										<h3 className="font-medium">{sub.subsidiary_name}</h3>
										{sub.sucursales?.length ? (
											<ul className="mt-2 ml-4 list-disc text-gray-700">
												{sub.sucursales.map(s => (
													<li key={s.id}>{s.nombre}</li>
												))}
											</ul>
										) : (
											<p className="mt-2 text-gray-500">Sin sucursales</p>
										)}
									</li>
								))}
							</ul>
						) : (
							<p className="text-gray-500">No hay subempresas configuradas.</p>
						)}
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>

	)
}
