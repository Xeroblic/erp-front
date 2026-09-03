/**
 * notebook.schema.ts
 * Esquema de validación Yup para el formulario de revisión de Notebook.
 * Refleja exactamente las reglas del backend con mensajes de error en español.
 */
import * as Yup from 'yup';
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_STORAGE_TECHNOLOGIES,
	ALLOWED_CHARGER_STATUSES,
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_COVER_CONDITIONS,
	ALLOWED_KEYBOARD_CONDITIONS,
	ALLOWED_KEYBOARD_LAYOUTS,
	ALLOWED_BATTERY_STATUSES,
	ALLOWED_BOTTOM_CONDITIONS,
	BATTERY_PERCENTAGE_MIN,
	BATTERY_PERCENTAGE_MAX,
} from './constants/notebook.rules';
import type { PortTypeCounts } from './constants/ports.rules';

const isDellBrand = (brand: unknown): boolean =>
	typeof brand === 'string' && brand.toLowerCase().includes('dell');

// ─── Schema Principal ─────────────────────────────────────────────────────────

export const notebookSchema = Yup.object({
	// ─── Identificación ──────────────────────────────────────────────────────
	brand: Yup.string()
		.trim()
		.required('La marca es obligatoria')
		.max(100, 'Máximo 100 caracteres'),

	model: Yup.string()
		.trim()
		.required('El modelo es obligatorio')
		.max(150, 'Máximo 150 caracteres'),

	line: Yup.string().trim().max(150, 'Máximo 150 caracteres').required('La línea es obligatoria'),

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

	// ─── Pantalla ────────────────────────────────────────────────────────────
	// ZF-98 pasó las opciones de pantalla al schema remoto (ahí nace `keyboard_marks`).
	// Mantener acá el `oneOf` local dejaría dos fuentes de verdad y rechazaría un valor
	// que el backend sí publica; el filtro por catálogo lo hace `sanitizeByAllowedValues`.
	screen_condition: Yup.string().required('La condición de pantalla es obligatoria'),

	screen_defects_count: Yup.number().nullable().strip(), // Deprecated/Internal only if needed, but we should use specific fields now
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
			otherwise: (schema) => schema.nullable().transform(() => 0), // Default to 0 if not active
		}),

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
			otherwise: (schema) => schema.nullable().transform(() => 0), // Default to 0 if not active
		}),

	screen_inches: Yup.string()
		.trim()
		.max(20, 'Máximo 20 caracteres')
		.required('Las pulgadas de pantalla son obligatorias'),

	is_touchscreen: Yup.boolean().required('Debes indicar si es touch'),

	// ─── Carcasa ─────────────────────────────────────────────────────────────
	cover_condition: Yup.string()
		.oneOf([...ALLOWED_COVER_CONDITIONS], 'Condición de tapa no válida')
		.required('La condición de la tapa es obligatoria'),

	keyboard_condition: Yup.string().required('La condición del teclado es obligatoria'),

	non_functional_keys_count: Yup.number()
		.integer('Debe ser un número entero')
		.min(0, 'No puede ser negativo')
		.nullable(),

	speakers_condition: Yup.string().nullable(),

	keyboard_layout: Yup.string()
		.oneOf([...ALLOWED_KEYBOARD_LAYOUTS], 'Distribución de teclado no válida')
		.required('La distribución del teclado es obligatoria'),

	hinge_condition: Yup.string().required('La condición de bisagras es obligatoria'),

	// ZF-98. La cubierta del teclado (palmrest) es nullable en el backend y no figura en
	// `COMPLETION_REQUIREMENTS`: no se exige para cerrar la revisión.
	keyboard_cover_condition: Yup.string().nullable(),

	touchpad_condition: Yup.string().required('La condición del touchpad es obligatoria'),

	bottom_condition: Yup.string()
		.oneOf([...ALLOWED_BOTTOM_CONDITIONS], 'Condición de tapa inferior no válida')
		.required('La condición de la tapa inferior es obligatoria'),

	has_numeric_keypad: Yup.boolean().required('Debes indicar si tiene teclado numérico'),
	has_backlit_keyboard: Yup.boolean().required('Debes indicar si tiene teclado retroiluminado'),

	// ─── Batería ─────────────────────────────────────────────────────────────
	battery_health: Yup.string().trim().max(100, 'Máximo 100 caracteres').nullable(),

	battery_status: Yup.string()
		.oneOf([...ALLOWED_BATTERY_STATUSES], 'Estado de batería no válido')
		.nullable()
		.when('brand', {
			is: isDellBrand,
			then: (schema) => schema.required('El estado de la batería es obligatorio'),
			otherwise: (schema) => schema.nullable(),
		}),

	battery_percentage: Yup.number()
		.typeError('El porcentaje debe ser un número')
		.integer('Debe ser un número entero')
		.min(BATTERY_PERCENTAGE_MIN, `El porcentaje mínimo es ${BATTERY_PERCENTAGE_MIN}`)
		.max(BATTERY_PERCENTAGE_MAX, `El porcentaje máximo es ${BATTERY_PERCENTAGE_MAX}`)
		.nullable()
		.when('brand', {
			is: (brand: unknown) => !isDellBrand(brand),
			then: (schema) => schema.required('El porcentaje de batería es obligatorio'),
			otherwise: (schema) => schema.nullable(),
		})
		// Regla: si battery_status es no_battery, el porcentaje debe ser 0
		.when('battery_status', {
			is: 'no_battery',
			then: (schema) => schema.max(0, 'Si no hay batería, el porcentaje debe ser 0'),
		}),

	// ─── Segunda Batería (ZB-100) ────────────────────────────────────────────
	// Algunos equipos traen más de una batería. Cuando has_second_battery es true
	// los campos second_battery_* comparten las mismas opciones que la principal.
	has_second_battery: Yup.boolean().default(false),

	second_battery_status: Yup.string()
		.oneOf([...ALLOWED_BATTERY_STATUSES], 'Estado de segunda batería no válido')
		.nullable()
		.when(['has_second_battery', 'brand'], {
			is: (hasSecond: unknown, brand: unknown) => hasSecond === true && isDellBrand(brand),
			then: (schema) => schema.required('El estado de la segunda batería es obligatorio'),
			otherwise: (schema) => schema.nullable(),
		}),

	second_battery_percentage: Yup.number()
		.typeError('El porcentaje debe ser un número')
		.integer('Debe ser un número entero')
		.min(BATTERY_PERCENTAGE_MIN, `El porcentaje mínimo es ${BATTERY_PERCENTAGE_MIN}`)
		.max(BATTERY_PERCENTAGE_MAX, `El porcentaje máximo es ${BATTERY_PERCENTAGE_MAX}`)
		.nullable()
		.when(['has_second_battery', 'brand'], {
			is: (hasSecond: unknown, brand: unknown) => hasSecond === true && !isDellBrand(brand),
			then: (schema) => schema.required('El porcentaje de la segunda batería es obligatorio'),
			otherwise: (schema) => schema.nullable(),
		})
		// Regla: si second_battery_status es no_battery, el porcentaje debe ser 0
		.when('second_battery_status', {
			is: 'no_battery',
			then: (schema) => schema.max(0, 'Si no hay batería, el porcentaje debe ser 0'),
		}),

	second_battery_condition: Yup.string().trim().max(100, 'Máximo 100 caracteres').nullable(),

	// ─── Puertos ─────────────────────────────────────────────────────────────
	vga_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	hdmi_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	displayport_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	dvi_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	usb_c_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	usb_a_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	sd_readers: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	rj45_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),
	charging_ports: Yup.number().integer().min(0, 'No puede ser negativo').nullable(),

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
	includes_charger: Yup.boolean().required('Debes indicar si incluye cargador'),

	charger_watts: Yup.string()
		.trim()
		.max(20, 'Máximo 20 caracteres')
		.when('includes_charger', {
			is: true,
			then: (schema) => schema.required('Si incluye cargador, indica los watts'),
			otherwise: (schema) => schema.nullable(),
		}),

	charger_status: Yup.string()
		.oneOf([...ALLOWED_CHARGER_STATUSES], 'Estado de cargador no válido')
		.nullable()
		// Regla: si incluye cargador, el estado es recomendado
		.when('includes_charger', {
			is: true,
			then: (schema) => schema.required('Si incluye cargador, indica su estado'),
		}),

	// ─── Software ────────────────────────────────────────────────────────────
	operating_system: Yup.string()
		.trim()
		.max(100, 'Máximo 100 caracteres')
		.required('El sistema operativo es obligatorio'),

	// ─── Otros ───────────────────────────────────────────────────────────────
	has_biometric: Yup.boolean().required('Debes indicar si tiene biometría'),
	has_wifi: Yup.boolean().required('Debes indicar si tiene Wi-Fi'),
	has_bluetooth: Yup.boolean().required('Debes indicar si tiene Bluetooth'),

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

export type NotebookFormData = Yup.InferType<typeof notebookSchema>;

/**
 * Schema parcial para validación de campos individuales (útil para validación en tiempo real).
 * Todos los campos se vuelven opcionales manteniendo sus reglas de formato.
 */
export const notebookPartialSchema = notebookSchema.clone().shape({
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
	screen_condition: Yup.string()
		.oneOf([...ALLOWED_SCREEN_CONDITIONS, ''])
		.nullable(),
	cover_condition: Yup.string()
		.oneOf([...ALLOWED_COVER_CONDITIONS, ''])
		.nullable(),
	keyboard_condition: Yup.string()
		.oneOf([...ALLOWED_KEYBOARD_CONDITIONS, ''])
		.nullable(),
});

export type NotebookPartialFormData = Yup.InferType<typeof notebookPartialSchema>;

/**
 * Valida un formulario de notebook y retorna errores formateados por campo.
 * Compatible con react-hook-form y manejo manual de errores.
 */
export const validateNotebookForm = async (
	data: unknown,
): Promise<
	{ success: true; data: NotebookFormData } | { success: false; errors: Record<string, string> }
> => {
	try {
		const validated = await notebookSchema.validate(data, { abortEarly: false });
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
