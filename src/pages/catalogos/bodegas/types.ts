import * as Yup from 'yup';

// ==================== Form Schemas (Yup) ====================

export const WarehouseSchema = Yup.object({
	name: Yup.string()
		.min(3, 'El nombre debe tener al menos 3 caracteres')
		.required('El nombre es obligatorio'),
	code: Yup.string()
		.matches(
			/^[A-Z0-9-]+$/,
			'El código solo puede contener letras mayúsculas, números y guiones',
		)
		.required('El código es obligatorio'),
	warehouse_type: Yup.string().required('El tipo de bodega es obligatorio'),
	maximum_capacity: Yup.number()
		.nullable()
		.min(0, 'La capacidad debe ser un número positivo')
		.transform((value, originalValue) => (originalValue === '' ? null : value)),
	manager_id: Yup.number()
		.nullable()
		.transform((value, originalValue) => (originalValue === '' ? null : value)),
	commune_id: Yup.number()
		.nullable()
		.transform((value, originalValue) => (originalValue === '' ? null : value)),
	description: Yup.string().optional(),
	address: Yup.string().optional(),
	schedule: Yup.string().optional(),
	is_active: Yup.boolean().optional(),
	requires_serial_tracking: Yup.boolean().optional(),
});

// ==================== Form Interfaces ====================

export interface ICreateWarehouseForm {
	name: string;
	code: string;
	warehouse_type: string;
	description: string;
	maximum_capacity: number | null;
	manager_id: number | null;
	address: string;
	commune_id: number | null;
	schedule: string;
	is_active: boolean;
	requires_serial_tracking: boolean;
}

export const CREATE_WAREHOUSE_INITIAL_VALUES: ICreateWarehouseForm = {
	name: '',
	code: '',
	warehouse_type: 'Secundaria',
	description: '',
	maximum_capacity: null,
	manager_id: null,
	address: '',
	commune_id: null,
	schedule: '',
	is_active: true,
	requires_serial_tracking: false,
};
