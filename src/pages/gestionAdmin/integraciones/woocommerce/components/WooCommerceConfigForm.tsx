import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { toast } from 'react-toastify';
import { WooCommerceConfig } from '../types/woocommerce.types';

const MODOS_OPERACION_OPTIONS = [
	{ value: 'lectura', label: 'Lectura' },
	{ value: 'lectura-escritura', label: 'Lectura/Escritura' },
];
const ESTADOS_INTEGRACION_OPTIONS = [
	{ value: 'on', label: 'ON (Activa)' },
	{ value: 'off', label: 'OFF (Inactiva)' },
];

const validationSchema = Yup.object({
	url: Yup.string()
		.required('La URL de la tienda es obligatoria')
		.url('Debe ser una URL válida')
		.matches(/^https:\/\//, 'La URL debe usar HTTPS'),
	consumerKey: Yup.string()
		.required('El Consumer Key es obligatorio')
		.min(10, 'Consumer Key debe tener al menos 10 caracteres'),
	consumerSecret: Yup.string()
		.required('El Consumer Secret es obligatorio')
		.min(10, 'Consumer Secret debe tener al menos 10 caracteres'),
	modo: Yup.string()
		.required('El modo de operación es obligatorio')
		.oneOf(['lectura', 'lectura-escritura'], 'Modo de operación inválido'),
	estado: Yup.boolean().required('El estado es obligatorio'),
});

const WooCommerceConfigForm: React.FC = () => {
	const [probandoConexion, setProbandoConexion] = useState(false);

	const formik = useFormik({
		initialValues: {
			url: '',
			consumerKey: '',
			consumerSecret: '',
			modo: 'lectura' as 'lectura' | 'lectura-escritura',
			estado: false,
		},
		validationSchema,
		onSubmit: async (values) => {
			setProbandoConexion(true);
			await new Promise((r) => setTimeout(r, 1200));
			// Simulación de prueba de conexión
			if (values.url.startsWith('https://') && values.consumerKey && values.consumerSecret) {
				toast.success('Conexión exitosa con WooCommerce');
			} else {
				toast.error('Error en la conexión con WooCommerce');
			}
			setProbandoConexion(false);
		},
	});

	return (
		<form onSubmit={formik.handleSubmit} className='space-y-6'>
			<Card>
				<CardHeader>
					<h4 className='text-lg font-semibold'>Configuración WooCommerce</h4>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='estado'>Estado *</Label>
							<SelectReact
								name='estado'
								options={ESTADOS_INTEGRACION_OPTIONS}
								value={ESTADOS_INTEGRACION_OPTIONS.find(
									(e) => e.value === (formik.values.estado ? 'on' : 'off'),
								)}
								onChange={(option: any) =>
									formik.setFieldValue('estado', option?.value === 'on')
								}
								placeholder='Seleccionar estado...'
							/>
							{formik.touched.estado && formik.errors.estado && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.estado}</p>
							)}
						</div>
						<div>
							<Label htmlFor='modo'>Modo de Operación *</Label>
							<SelectReact
								name='modo'
								options={MODOS_OPERACION_OPTIONS}
								value={MODOS_OPERACION_OPTIONS.find(
									(m) => m.value === formik.values.modo,
								)}
								onChange={(option: any) =>
									formik.setFieldValue('modo', option?.value)
								}
								placeholder='Seleccionar modo...'
							/>
							{formik.touched.modo && formik.errors.modo && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.modo}</p>
							)}
						</div>
					</div>
					<div className='mt-4'>
						<Label htmlFor='url'>URL de la Tienda WooCommerce *</Label>
						<Input
							id='url'
							name='url'
							type='url'
							value={formik.values.url}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							placeholder='https://mi-tienda.com'
							className='font-mono'
						/>
						{formik.touched.url && formik.errors.url && (
							<p className='mt-1 text-sm text-red-600'>{formik.errors.url}</p>
						)}
						<p className='mt-1 text-xs text-gray-500'>
							La URL debe usar HTTPS para garantizar la seguridad
						</p>
					</div>
					<div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='consumerKey'>Consumer Key *</Label>
							<Input
								id='consumerKey'
								name='consumerKey'
								type='text'
								value={formik.values.consumerKey}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								placeholder='ck_xxxxxxxxxxxxxxxxxx'
								className='font-mono'
							/>
							{formik.touched.consumerKey && formik.errors.consumerKey && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.consumerKey}
								</p>
							)}
						</div>
						<div>
							<Label htmlFor='consumerSecret'>Consumer Secret *</Label>
							<Input
								id='consumerSecret'
								name='consumerSecret'
								type='password'
								value={formik.values.consumerSecret}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								placeholder='cs_xxxxxxxxxxxxxxxxxx'
								className='font-mono'
							/>
							{formik.touched.consumerSecret && formik.errors.consumerSecret && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.consumerSecret}
								</p>
							)}
						</div>
					</div>
					<div className='mt-6 flex gap-4'>
						<Button
							variant='outline'
							color='blue'
							onClick={formik.handleSubmit as any}
							isLoading={probandoConexion}
							icon='HeroSignal'>
							Probar Conexión
						</Button>
						<Button
							variant='solid'
							color='blue'
							onClick={formik.handleSubmit as any}
							isLoading={probandoConexion}>
							Guardar Configuración
						</Button>
					</div>
				</CardBody>
			</Card>
		</form>
	);
};

export default WooCommerceConfigForm;
