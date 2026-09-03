import * as Yup from 'yup';
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_COVER_CONDITIONS,
} from '../constants/docking/docking.rules';
import type { PortTypeCounts } from './constants/ports.rules';

export const dockingSchema = Yup.object({
	// Identificación
	brand: Yup.string().required('La marca es requerida').max(50, 'Máximo 50 caracteres'),
	model: Yup.string().required('El modelo es requerido').max(50, 'Máximo 50 caracteres'),

	// Condición
	general_condition: Yup.string()
		.required('Condición general es requerida')
		.oneOf(ALLOWED_GENERAL_CONDITIONS, 'Condición general selecta no válida'),

	// Puertos
	line: Yup.string().required('La línea es requerida').max(50, 'Máximo 50 caracteres'),
	vga_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	hdmi_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	displayport_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	dvi_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	usb_c_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	sd_readers: Yup.number().nullable().min(0, 'No puede ser negativo'),
	rj45_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	usb_a_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),
	charging_ports: Yup.number().nullable().min(0, 'No puede ser negativo'),

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

	// Extras
	has_wifi: Yup.boolean().required('Debes indicar si tiene Wi-Fi').default(false),
	includes_power_adapter: Yup.boolean()
		.required('Debes indicar si incluye adaptador de poder')
		.default(false),
	cover_condition: Yup.string()
		.required('La condición de carcasa es requerida')
		.oneOf(ALLOWED_COVER_CONDITIONS, 'Condición de carcasa selecta no válida'),

	// Notas
	observations: Yup.string()
		.transform((v, o) => (o === '' ? null : v))
		.nullable()
		.max(255, 'Máximo 255 caracteres'),

	// Otros Atributos Extendibles
	extra_attributes: Yup.object().nullable().default({}),
});

export type DockingFormData = Yup.InferType<typeof dockingSchema>;
