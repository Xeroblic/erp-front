/**
 * desktop.schema.ts
 * Esquema de validación Yup para el formulario de revisión de Desktop.
 * Refleja exactamente las reglas del backend con mensajes de error en español.
 */
import * as Yup from 'yup';
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_STORAGE_TECHNOLOGIES,
	ALLOWED_CHARGER_STATUSES,
	ALLOWED_COVER_CONDITIONS,
} from './constants/desktop.rules';

// ─── Schema Principal ─────────────────────────────────────────────────────────

export const desktopSchema = Yup.object({
	// ─── Identificación ──────────────────────────────────────────────────────
	brand: Yup.string()
		.trim()
		.required('La marca es obligatoria')
		.max(100, 'Máximo 100 caracteres'),

	model: Yup.string()
		.trim()
		.required('El modelo es obligatorio')
		.max(150, 'Máximo 150 caracteres'),

	line: Yup.string()
		.trim()
		.max(100, 'Máximo 100 caracteres')
		.nullable(),

	// ─── Condición General ───────────────────────────────────────────────────
	general_condition: Yup.string()
		.oneOf([...ALLOWED_GENERAL_CONDITIONS], 'Condición general no válida')
		.required('La condición general es obligatoria'),

	// ─── Hardware ────────────────────────────────────────────────────────────
	processor: Yup.string()
		.trim()
		.required('El procesador es obligatorio')
		.max(200, 'Máximo 200 caracteres'),

	ram_size: Yup.string()
		.trim()
		.required('La RAM es obligatoria')
		.max(50, 'Máximo 50 caracteres'),

	ram_slots: Yup.string().trim().max(20, 'Máximo 20 caracteres').nullable(),

	ram_type: Yup.string().trim().max(20, 'Máximo 20 caracteres').nullable(),

	storage_size: Yup.string()
		.trim()
		.required('El almacenamiento es obligatorio')
		.max(50, 'Máximo 50 caracteres'),

	storage_technology: Yup.string()
		.oneOf([...ALLOWED_STORAGE_TECHNOLOGIES], 'Tecnología de disco no válida')
		.required('La tecnología de disco es obligatoria'),

	// ─── Carcasa ─────────────────────────────────────────────────────────────
	cover_condition: Yup.string()
		.oneOf([...ALLOWED_COVER_CONDITIONS], 'Condición de carcasa no válida')
		.required('La condición de la carcasa es obligatoria'),

	// ─── Puertos ─────────────────────────────────────────────────────────────
	vga_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	hdmi_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	displayport_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	usb_c_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	usb_a_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	sd_readers: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	rj45_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),

	all_ports_functional: Yup.boolean()
		.nullable()
		// Regla: no puede ser true si hay puertos defectuosos
		.when('defective_ports_count', {
			is: (val: number | null | undefined) => val != null && val > 0,
			then: (schema) =>
				schema.test(
					'ports-conflict',
					'No puede marcar todos los puertos como funcionales si hay puertos defectuosos',
					(value) => value !== true,
				),
		}),

	defective_ports_count: Yup.number()
		.typeError('Debe ser un número')
		.integer('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.nullable(),

	// ─── Accesorios ──────────────────────────────────────────────────────────
	includes_charger: Yup.boolean().nullable(),

	charger_status: Yup.string()
		.oneOf([...ALLOWED_CHARGER_STATUSES], 'Estado de cargador no válido')
		.nullable()
		// Regla: si incluye cargador, el estado es recomendado (o requerido si quisieras forzarlo)
		.when('includes_charger', {
			is: true,
			then: (schema) => schema.required('Si incluye cargador, indica su estado'),
		}),

	// ─── Software ────────────────────────────────────────────────────────────
	operating_system: Yup.string().trim().max(100, 'Máximo 100 caracteres').nullable(),

	// ─── Otros ───────────────────────────────────────────────────────────────
	has_wifi: Yup.boolean().nullable(),
	has_bluetooth: Yup.boolean().nullable(),
	has_cd_drive: Yup.boolean().nullable(),

	// ─── Notas ───────────────────────────────────────────────────────────────
	observations: Yup.string()
		.trim()
		.max(1000, 'Máximo 1000 caracteres para observaciones')
		.nullable(),

	// ─── Extras ──────────────────────────────────────────────────────────────
	extra_attributes: Yup.mixed().nullable(),
});

// ─── Tipos derivados ──────────────────────────────────────────────────────────

export type DesktopFormData = Yup.InferType<typeof desktopSchema>;

/**
 * Schema parcial para validación de campos individuales.
 */
export const desktopPartialSchema = desktopSchema.clone().shape({
	brand: Yup.string().trim().max(100).nullable(),
	model: Yup.string().trim().max(150).nullable(),
	general_condition: Yup.string()
		.oneOf([...ALLOWED_GENERAL_CONDITIONS, ''])
		.nullable(),
	processor: Yup.string().trim().max(200).nullable(),
	ram_size: Yup.string().trim().max(50).nullable(),
	storage_size: Yup.string().trim().max(50).nullable(),
	storage_technology: Yup.string()
		.oneOf([...ALLOWED_STORAGE_TECHNOLOGIES, ''])
		.nullable(),
	cover_condition: Yup.string()
		.oneOf([...ALLOWED_COVER_CONDITIONS, ''])
		.nullable(),
});

export type DesktopPartialFormData = Yup.InferType<typeof desktopPartialSchema>;

/**
 * Valida un formulario de desktop y retorna errores formateados.
 */
export const validateDesktopForm = async (
	data: unknown,
): Promise<
	{ success: true; data: DesktopFormData } | { success: false; errors: Record<string, string> }
> => {
	try {
		const validated = await desktopSchema.validate(data, { abortEarly: false });
		return { success: true, data: validated };
	} catch (err) {
		if (err instanceof Yup.ValidationError) {
			const errors: Record<string, string> = {};
			for (const inner of err.inner) {
				if (inner.path && !errors[inner.path]) {
					errors[inner.path] = inner.message;
				}
			}
			return { success: false, errors };
		}
		throw err;
	}
};
