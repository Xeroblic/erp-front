import * as Yup from 'yup';
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_COVER_CONDITIONS,
} from '../constants/docking/docking.rules';

export const dockingSchema = Yup.object({
	// Identificación
	brand: Yup.string()
		.required('La marca es requerida')
		.max(50, 'Máximo 50 caracteres'),
	model: Yup.string()
		.required('El modelo es requerido')
		.max(50, 'Máximo 50 caracteres'),
	line: Yup.string().nullable().max(50, 'Máximo 50 caracteres'),

	// Condición
	general_condition: Yup.string()
		.required('Condición general es requerida')
		.oneOf(
			ALLOWED_GENERAL_CONDITIONS,
			'Condición general selecta no válida',
		),

	// Puertos
	vga_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	hdmi_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	displayport_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	usb_c_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	sd_readers: Yup.number().nullable().min(0, 'No puede ser negativo'),
	rj45_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	usb_a_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),

	// Estado funcionales de puertos
	all_ports_functional: Yup.boolean().required(
		'Debes especificar si todos los puertos funcionan',
	),
	defective_ports_count: Yup.number()
		.nullable()
		.min(0, 'No puede ser negativo')
		.when('all_ports_functional', {
			is: false,
			then: (schema: Yup.NumberSchema) =>
				schema
					.required('Debes indicar cuántos puertos defectuosos hay')
					.min(1, 'Debe haber al menos 1 puerto defectuoso'),
			otherwise: (schema: Yup.NumberSchema) =>
				schema.transform(() => 0).default(0),
		}),

	// Extras
	has_wifi: Yup.boolean().default(false),
	includes_power_adapter: Yup.boolean().default(false),
	cover_condition: Yup.string()
		.required('La condición de carcasa es requerida')
		.oneOf(
			ALLOWED_COVER_CONDITIONS,
			'Condición de carcasa selecta no válida',
		),

	// Notas
	observations: Yup.string().nullable().max(255, 'Máximo 255 caracteres'),

	// Otros Atributos Extendibles
	extra_attributes: Yup.object().nullable().default({}),
});

export type DockingFormData = Yup.InferType<typeof dockingSchema>;
