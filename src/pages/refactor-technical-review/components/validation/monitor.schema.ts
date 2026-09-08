import * as Yup from 'yup';
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_STAND_CONDITIONS,
	ALLOWED_FRAME_CONDITIONS,
} from '../constants/monitor/monitor.rules';
import type { PortTypeCounts } from './constants/ports.rules';

export const monitorSchema = Yup.object({
	// Identificación
	brand: Yup.string().required('La marca es requerida').max(50, 'Máximo 50 caracteres'),
	model: Yup.string().required('El modelo es requerido').max(50, 'Máximo 50 caracteres'),

	// Condición
	general_condition: Yup.string()
		.required('Condición general es requerida')
		.oneOf(ALLOWED_GENERAL_CONDITIONS, 'Condición general selecta no válida'),

	// Pantalla & Físico
	line: Yup.string().required('La línea es requerida').max(50, 'Máximo 50 caracteres'),
	screen_inches: Yup.string()
		.required('Las pulgadas son requeridas')
		.max(20, 'Máximo 20 caracteres'),
	screen_resolution: Yup.string()
		.required('La resolución es requerida')
		.max(50, 'Máximo 50 caracteres'),
	is_touchscreen: Yup.boolean().required('Debes indicar si es touch').default(false),
	screen_condition: Yup.string()
		.required('Condición de pantalla es requerida')
		.oneOf(ALLOWED_SCREEN_CONDITIONS, 'Condición selecta no válida'),
	spots_count: Yup.number()
		.integer('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.nullable()
		.when('screen_condition', {
			is: 'spots',
			then: (schema) =>
				schema
					.required('Indica la cantidad de manchas')
					.min(1, 'Debe ser al menos 1')
					.typeError('Debes ingresar un número'),
			otherwise: (schema) => schema.nullable().transform(() => 0),
		}),
	dead_pixels_count: Yup.number()
		.integer('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.nullable()
		.when('screen_condition', {
			is: 'dead_pixels',
			then: (schema) =>
				schema
					.required('Indica la cantidad de píxeles muertos')
					.min(1, 'Debe ser al menos 1')
					.typeError('Debes ingresar un número'),
			otherwise: (schema) => schema.nullable().transform(() => 0),
		}),
	stand_condition: Yup.string()
		.required('Condición de base es requerida')
		.oneOf(ALLOWED_STAND_CONDITIONS, 'Condición selecta no válida'),
	frame_condition: Yup.string()
		.required('Condición de marco es requerida')
		.oneOf(ALLOWED_FRAME_CONDITIONS, 'Condición selecta no válida'),

	// Puertos
	has_usb_hub: Yup.boolean().required('Debes indicar si tiene hub USB').default(false),
	// Los nueve contadores del catálogo, con el mismo nombre en los cinco tipos de equipo.
	// `usb_hub_ports` y `type_c_ports` pasaron a llamarse `usb_a_ports` y `usb_c_ports`:
	// el backend ignora los nombres viejos en silencio —responde 200 y guarda cero—, así
	// que mandarlos sería registrar puertos que no quedan en ninguna parte.
	vga_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	hdmi_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	displayport_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	dvi_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	usb_a_ports: Yup.number().integer().nullable().min(0, 'No puede ser negativo'),
	usb_c_ports: Yup.number().integer().nullable().min(0, 'No puede ser negativo'),
	sd_readers: Yup.number().integer().nullable().min(0, 'No puede ser negativo'),
	rj45_ports: Yup.number().integer().nullable().min(0, 'No puede ser negativo'),
	charging_ports: Yup.number().integer().nullable().min(0, 'No puede ser negativo'),

	// Estado funcionales de puertos
	all_ports_functional: Yup.boolean().nullable(),

	// ─── Puertos sueltos y detalle de puertos (ZF-98) ────────────────────────
	// El backend los declara nullable y no los exige al cerrar la revisión
	// (`COMPLETION_REQUIREMENTS` no los incluye), así que acá tampoco son obligatorios:
	// exigirlos bloquearía revisiones que el backend sí acepta.
	// Total derivado del desglose: el servidor lo calcula y el formulario sólo lo
	// muestra, así que no lleva reglas propias.
	loose_ports_count: Yup.number().nullable(),

	// Desglose `{tipo: cantidad}`. El catálogo y los límites por tipo los publica el
	// schema del backend; repetirlos acá crearía una segunda fuente de verdad que
	// rechazaría cualquier tipo nuevo. El formulario ya no puede producir un valor
	// fuera de rango: cada contador está acotado por la metadata del schema.
	loose_port_types: Yup.mixed<PortTypeCounts>().nullable(),

	defective_port_types: Yup.mixed<PortTypeCounts>().nullable(),
	defective_ports_count: Yup.number()
		.nullable()
		.min(0, 'No puede ser negativo')
		.when('all_ports_functional', {
			is: (val: any) => val === false,
			then: (schema) =>
				schema
					.required('Debes indicar cuántos puertos defectuosos hay')
					.min(1, 'Debe haber al menos 1 puerto defectuoso'),
			otherwise: (schema) => schema.transform(() => 0).default(0),
		}),
	defective_ports_critical_count: Yup.number()
		.nullable()
		.min(0, 'No puede ser negativo')
		.when('all_ports_functional', {
			is: (val: any) => val === false,
			then: (schema) =>
				schema.required('Debes indicar cuántos puertos críticos defectuosos hay'),
			otherwise: (schema) => schema.transform(() => 0).default(0),
		}),

	// Accesorios
	includes_power_cable: Yup.boolean()
		.required('Debes indicar si incluye cable de poder')
		.default(false),
	includes_video_cable: Yup.boolean()
		.required('Debes indicar si incluye cable de video')
		.default(false),
	includes_stand: Yup.boolean().required('Debes indicar si incluye base').default(false),

	// Notas
	observations: Yup.string()
		.transform((v, o) => (o === '' ? null : v))
		.nullable()
		.max(255, 'Máximo 255 caracteres'),

	// Otros Atributos Extendibles
	extra_attributes: Yup.object().nullable().default({}),
});

export type MonitorFormData = Yup.InferType<typeof monitorSchema>;
