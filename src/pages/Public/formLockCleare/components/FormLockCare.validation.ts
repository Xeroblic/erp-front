import * as Yup from 'yup';

export const formLockCareValidationSchema = Yup.object({
	name: Yup.string()
		.trim()
		.required('El nombre es obligatorio')
		.max(120, 'Maximo 120 caracteres'),
	email: Yup.string()
		.trim()
		.email('Ingresa un correo valido')
		.required('El correo es obligatorio'),
	phone: Yup.string()
		.trim()
		.required('El telefono es obligatorio')
		.max(30, 'Maximo 30 caracteres'),
	termsAccepted: Yup.boolean().oneOf(
		[true],
		'Debes aceptar los terminos y condiciones para enviar el formulario',
	),
	requiresInvoice: Yup.string()
		.oneOf(['si', 'no'])
		.required('Debes indicar si necesitas factura'),
	invoiceRut: Yup.string().when('requiresInvoice', {
		is: 'si',
		then: (schema) =>
			schema
				.trim()
				.required('El RUT es obligatorio para facturacion')
				.max(20, 'Maximo 20 caracteres'),
		otherwise: (schema) => schema.notRequired(),
	}),
	invoiceBusinessName: Yup.string().when('requiresInvoice', {
		is: 'si',
		then: (schema) =>
			schema
				.trim()
				.required('El giro es obligatorio para facturacion')
				.max(160, 'Maximo 160 caracteres'),
		otherwise: (schema) => schema.notRequired(),
	}),
	invoiceAddress: Yup.string().when('requiresInvoice', {
		is: 'si',
		then: (schema) =>
			schema
				.trim()
				.required('La direccion de facturacion es obligatoria')
				.max(200, 'Maximo 200 caracteres'),
		otherwise: (schema) => schema.notRequired(),
	}),
	serviceType: Yup.string()
		.oneOf(['reparacion', 'upgrade', ''], 'Tipo de servicio inválido')
		.required('Debes seleccionar un tipo de servicio'),

	// Validación para Reparación
	repairBrand: Yup.string().when('serviceType', {
		is: 'reparacion',
		then: (schema) =>
			schema
				.trim()
				.required('La marca es obligatoria para reparación')
				.max(100, 'Maximo 100 caracteres'),
		otherwise: (schema) => schema.notRequired(),
	}),
	repairModel: Yup.string().when('serviceType', {
		is: 'reparacion',
		then: (schema) =>
			schema
				.trim()
				.required('El modelo es obligatorio para reparación')
				.max(100, 'Maximo 100 caracteres'),
		otherwise: (schema) => schema.notRequired(),
	}),
	repairSerialNumber: Yup.string().trim().max(100, 'Maximo 100 caracteres'),
	repairIncludesCharger: Yup.string().when('serviceType', {
		is: 'reparacion',
		then: (schema) => schema.oneOf(['si', 'no']).required('Debes indicar si incluye cargador'),
		otherwise: (schema) => schema.notRequired(),
	}),

	// Validación para Upgrade
	upgradeType: Yup.string().when('serviceType', {
		is: 'upgrade',
		then: (schema) =>
			schema.oneOf(['ram', 'ssd', 'ambas']).required('Debes seleccionar el tipo de upgrade'),
		otherwise: (schema) => schema.notRequired(),
	}),
	upgradeBrand: Yup.string().when('serviceType', {
		is: 'upgrade',
		then: (schema) =>
			schema
				.trim()
				.required('La marca es obligatoria para upgrade')
				.max(100, 'Maximo 100 caracteres'),
		otherwise: (schema) => schema.notRequired(),
	}),
	upgradeModel: Yup.string().when('serviceType', {
		is: 'upgrade',
		then: (schema) =>
			schema
				.trim()
				.required('El modelo es obligatorio para upgrade')
				.max(100, 'Maximo 100 caracteres'),
		otherwise: (schema) => schema.notRequired(),
	}),
	upgradeSerialNumber: Yup.string().trim().max(100, 'Maximo 100 caracteres'),

	notes: Yup.string().trim().max(500, 'Maximo 500 caracteres'),
	message: Yup.string()
		.trim()
		.required('El mensaje es obligatorio')
		.max(1000, 'Maximo 1000 caracteres'),
	attachments: Yup.array(),
});
