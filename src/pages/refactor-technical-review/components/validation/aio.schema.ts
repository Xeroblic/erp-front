/**
 * aio.schema.ts
 * Esquema de validación Yup para el formulario de revisión de AIO.
 * Refleja exactamente las reglas del backend con mensajes de error en español.
 */
import * as Yup from 'yup';
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_STORAGE_TECHNOLOGIES,
	ALLOWED_CHARGER_STATUSES,
	ALLOWED_COVER_CONDITIONS,
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_STAND_CONDITIONS,
} from '../constants/aio/aio.rules';

// ─── Schema Principal ─────────────────────────────────────────────────────────

export const aioSchema = Yup.object({
	// ─── Identificación ──────────────────────────────────────────────────────
	brand: Yup.string()
		.trim()
		.required('La marca es obligatoria')
		.max(100, 'Máximo 100 caracteres'),

	model: Yup.string()
		.trim()
		.required('El modelo es obligatorio')
		.max(150, 'Máximo 150 caracteres'),

	// ─── Condición General ───────────────────────────────────────────────────
	general_condition: Yup.string()
		.oneOf([...ALLOWED_GENERAL_CONDITIONS], 'Condición general no válida')
		.required('La condición general es obligatoria'),

	// ─── Hardware ────────────────────────────────────────────────────────────
	processor: Yup.string()
		.trim()
		.required('El procesador es obligatorio')
		.max(200, 'Máximo 200 caracteres'),

	has_no_ram: Yup.boolean().default(false),
	has_no_storage: Yup.boolean().default(false),

	ram_size: Yup.string()
		.trim()
		.max(50, 'Máximo 50 caracteres')
		.when('has_no_ram', {
			is: true,
			then: (schema) => schema.notRequired(),
			otherwise: (schema) => schema.required('La RAM es obligatoria'),
		}),

	ram_slots: Yup.string()
		.trim()
		.max(20, 'Máximo 20 caracteres')
		.when('has_no_ram', {
			is: true,
			then: (schema) => schema.notRequired(),
			otherwise: (schema) => schema.required('Los slots de RAM son obligatorios'),
		}),

	ram_type: Yup.string()
		.trim()
		.max(20, 'Máximo 20 caracteres')
		.when('has_no_ram', {
			is: true,
			then: (schema) => schema.notRequired(),
			otherwise: (schema) => schema.required('El tipo de RAM es obligatorio'),
		}),

	storage_size: Yup.string()
		.trim()
		.max(50, 'Máximo 50 caracteres')
		.when('has_no_storage', {
			is: true,
			then: (schema) => schema.notRequired(),
			otherwise: (schema) => schema.required('El almacenamiento es obligatorio'),
		}),

	storage_technology: Yup.string()
		.oneOf([...ALLOWED_STORAGE_TECHNOLOGIES], 'Tecnología de disco no válida')
		.when('has_no_storage', {
			is: true,
			then: (schema) => schema.notRequired(),
			otherwise: (schema) => schema.required('La tecnología de disco es obligatoria'),
		}),

	// ─── Pantalla y Base (Específico AIO) ────────────────────────────────────
	screen_inches: Yup.string()
		.trim()
		.max(50, 'Máximo 50 caracteres')
		.required('Las pulgadas de pantalla son obligatorias'),

	is_touchscreen: Yup.boolean().required('Debes indicar si es touch'),

	screen_condition: Yup.string()
		.oneOf([...ALLOWED_SCREEN_CONDITIONS], 'Condición de pantalla no válida')
		.required('La condición de pantalla es obligatoria'),

	stand_condition: Yup.string()
		.oneOf([...ALLOWED_STAND_CONDITIONS], 'Condición de base no válida')
		.required('La condición de la base (stand) es obligatoria'),

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

	all_ports_functional: Yup.boolean().nullable(),

	defective_ports_count: Yup.number()
		.typeError('Debe ser un número')
		.integer('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.when('all_ports_functional', {
			is: false,
			then: (schema) =>
				schema
					.required('Debes indicar cuántos puertos defectuosos hay')
					.min(1, 'Debe haber al menos 1 puerto defectuoso'),
			otherwise: (schema) => schema.transform(() => 0).default(0),
		})
		.test(
			'ports-conflict',
			'No puede marcar todos los puertos como funcionales si hay puertos defectuosos',
			function (value): boolean {
				const parent = this.parent as { all_ports_functional?: boolean | null };
				return !(parent.all_ports_functional === true && Number(value) > 0);
			},
		),

	// ─── Accesorios ──────────────────────────────────────────────────────────
	includes_power_adapter: Yup.boolean().required('Debes indicar si incluye adaptador de poder'),

	charger_status: Yup.string()
		.oneOf([...ALLOWED_CHARGER_STATUSES], 'Estado de cargador no válido')
		.nullable()
		// Regla: si incluye cargador, el estado es requerido
		.when('includes_power_adapter', {
			is: true,
			then: (schema) => schema.required('Si incluye adaptador de poder, indica su estado'),
		}),

	// ─── Software ────────────────────────────────────────────────────────────
	operating_system: Yup.string()
		.trim()
		.max(100, 'Máximo 100 caracteres')
		.required('El sistema operativo es obligatorio'),

	// ─── Otros ───────────────────────────────────────────────────────────────
	has_wifi: Yup.boolean().required('Debes indicar si tiene Wi-Fi'),
	has_bluetooth: Yup.boolean().required('Debes indicar si tiene Bluetooth'),
	has_cd_drive: Yup.boolean().required('Debes indicar si tiene unidad CD/DVD'),

	// ─── Notas ───────────────────────────────────────────────────────────────
	observations: Yup.string()
		.trim()
		.transform((value, originalValue) => (originalValue === '' ? null : value))
		.max(1000, 'Máximo 1000 caracteres para observaciones')
		.nullable(),

	// ─── Extras ──────────────────────────────────────────────────────────────
	extra_attributes: Yup.mixed().nullable(),
});

// ─── Tipos derivados ──────────────────────────────────────────────────────────

export type AioFormData = Yup.InferType<typeof aioSchema>;

/**
 * Valida un formulario de AIO y retorna errores formateados.
 */
export const validateAioForm = async (
	data: unknown,
): Promise<
	{ success: true; data: AioFormData } | { success: false; errors: Record<string, string> }
> => {
	try {
		const validated = await aioSchema.validate(data, { abortEarly: false });
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
