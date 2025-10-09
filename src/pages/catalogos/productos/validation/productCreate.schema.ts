import * as Yup from 'yup';
import { PRODUCT_TYPE_LABELS } from '../constants/products.constant';
import type { ProductCreateForm } from '../types/products.types';

const REQUIRED_MESSAGE = 'Campo obligatorio';

export const productCreateSchema = Yup.object({
	sku: Yup.string()
		.trim()
		.required(REQUIRED_MESSAGE)
		.max(255, 'Maximo 255 caracteres'),
	name: Yup.string()
		.trim()
		.required(REQUIRED_MESSAGE)
		.max(255, 'Maximo 255 caracteres'),
	brand_id: Yup.number()
		.typeError('Selecciona una marca')
		.required(REQUIRED_MESSAGE),
	price: Yup.number()
		.typeError('Ingresa un precio valido')
		.min(0, 'El precio debe ser mayor o igual a 0')
		.required(REQUIRED_MESSAGE),
	category_ids: Yup.array()
		.of(Yup.number().typeError('Selecciona una categoria valida'))
		.min(1, 'Selecciona al menos una categoria'),
}) as Yup.ObjectSchema<ProductCreateForm>;

export const productTypeOptionsFromLabels = Object.entries(PRODUCT_TYPE_LABELS).map(
	([value, label]) => ({ value, label }),
);
