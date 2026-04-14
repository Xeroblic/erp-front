import * as Yup from 'yup';
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_STAND_CONDITIONS,
	ALLOWED_FRAME_CONDITIONS,
} from '../constants/monitor/monitor.rules';

export const monitorSchema = Yup.object({
	// Identificación
	brand: Yup.string()
		.required('La marca es requerida')
		.max(50, 'Máximo 50 caracteres'),
	model: Yup.string()
		.required('El modelo es requerido')
		.max(50, 'Máximo 50 caracteres'),

	// Condición
	general_condition: Yup.string()
		.required('Condición general es requerida')
		.oneOf(
			ALLOWED_GENERAL_CONDITIONS,
			'Condición general selecta no válida',
		),

	// Pantalla & Físico
	line: Yup.string().required('La línea es requerida').max(50, 'Máximo 50 caracteres'),
	screen_inches: Yup.string().required('Las pulgadas son requeridas').max(20, 'Máximo 20 caracteres'),
	screen_resolution: Yup.string().required('La resolución es requerida').max(50, 'Máximo 50 caracteres'),
	is_touchscreen: Yup.boolean().required('Debes indicar si es touch').default(false),
	screen_condition: Yup.string()
		.required('Condición de pantalla es requerida')
		.oneOf(ALLOWED_SCREEN_CONDITIONS, 'Condición selecta no válida'),
	stand_condition: Yup.string()
		.required('Condición de base es requerida')
		.oneOf(ALLOWED_STAND_CONDITIONS, 'Condición selecta no válida'),
	frame_condition: Yup.string()
		.required('Condición de marco es requerida')
		.oneOf(ALLOWED_FRAME_CONDITIONS, 'Condición selecta no válida'),

	// Puertos
	has_usb_hub: Yup.boolean().required('Debes indicar si tiene hub USB').default(false),
	vga_ports: Yup.number().required('Indica cantidad de puertos VGA').min(0, 'No puede ser negativo'),
	hdmi_ports: Yup.number().required('Indica cantidad de puertos HDMI').min(0, 'No puede ser negativo'),
	displayport_ports: Yup.number().required('Indica cantidad de puertos DisplayPort').min(0, 'No puede ser negativo'),
	dvi_ports: Yup.number().required('Indica cantidad de puertos DVI').min(0, 'No puede ser negativo'),
	usb_hub_ports: Yup.number().required('Indica cantidad de puertos del hub USB').min(0, 'No puede ser negativo'),

	// Estado funcionales de puertos
	all_ports_functional: Yup.boolean().required(
		'Debes especificar si todos los puertos funcionan',
	),
	defective_ports_count: Yup.number()
		.nullable()
		.min(0, 'No puede ser negativo')
		.when('all_ports_functional', {
			is: (val: any) => val === false,
			then: (schema) =>
				schema
					.required('Debes indicar cuántos puertos defectuosos hay')
					.min(1, 'Debe haber al menos 1 puerto defectuoso'),
			otherwise: (schema) =>
				schema.transform(() => 0).default(0),
		}),
	defective_ports_critical_count: Yup.number()
		.nullable()
		.min(0, 'No puede ser negativo')
		.when('all_ports_functional', {
			is: (val: any) => val === false,
			then: (schema) =>
				schema.required('Debes indicar cuántos puertos críticos defectuosos hay'),
			otherwise: (schema) =>
				schema.transform(() => 0).default(0),
		}),

	// Accesorios
	includes_power_cable: Yup.boolean().required('Debes indicar si incluye cable de poder').default(false),
	includes_video_cable: Yup.boolean().required('Debes indicar si incluye cable de video').default(false),
	includes_stand: Yup.boolean().required('Debes indicar si incluye base').default(false),

	// Notas
	observations: Yup.string().nullable().max(255, 'Máximo 255 caracteres'),

	// Otros Atributos Extendibles
	extra_attributes: Yup.object().nullable().default({}),
});

export type MonitorFormData = Yup.InferType<typeof monitorSchema>;
