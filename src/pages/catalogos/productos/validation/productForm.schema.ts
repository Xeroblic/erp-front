import * as Yup from 'yup';

const optionSchema = Yup.object({
	value: Yup.string().required(),
	label: Yup.string().required(),
});

export const productFormSchema = Yup.object({
	sku: Yup.string().trim().required('El SKU es obligatorio'),
	name: Yup.string().trim().required('El nombre es obligatorio'),
	brand_id: Yup.string().required('La marca es obligatoria'),
	price: Yup.number().typeError('Ingrese un monto valido').min(0, 'Debe ser mayor o igual a 0').required('El precio es obligatorio'),
	cost: Yup.number().typeError('Ingrese un monto valido').min(0, 'Debe ser mayor o igual a 0').nullable(),
	offer_price: Yup.number().typeError('Ingrese un monto valido').min(0, 'Debe ser mayor o igual a 0').nullable(),
	product_type: Yup.string().nullable(),
	condition_policy: Yup.string().nullable(),
	uom: Yup.string().nullable(),
	warranty_months: Yup.number().typeError('Ingrese un valor valido').min(0, 'Debe ser mayor o igual a 0').nullable(),
	serial_tracking: Yup.boolean().required(),
	is_active: Yup.boolean().required(),
	categories: Yup.array().of(optionSchema).min(1, 'Selecciona al menos una categoria'),
});

