import type {
	ITechnicalReviewSchema,
	ITechnicalReviewSchemaField,
} from '@/interface/technicalReviews.interface';

/**
 * ZF-102. `powers_on` se exige para cerrar en notebook y desktop (`COMPLETION_REQUIREMENTS`
 * del backend), pero sólo se había implementado en desktop: sin él en esta lista el campo
 * no llegaba al formulario y ningún notebook podía finalizarse.
 */
export const ZF48_NOTEBOOK_FIELDS = [
	'keyboard_condition',
	'non_functional_keys_count',
	'touchpad_condition',
	'hinge_condition',
	'speakers_condition',
	'powers_on',
] as const;

export const ZF48_DESKTOP_FIELDS = ['powers_on'] as const;

/**
 * ZF-98. Los tres campos de puertos existen en los cinco tipos de equipo; la cubierta del
 * teclado y el valor `keyboard_marks` de `screen_condition`, sólo en notebook.
 */
export const ZF98_PORT_FIELDS = [
	'loose_ports_count',
	'loose_port_types',
	'defective_port_types',
] as const;

export const ZF98_NOTEBOOK_FIELDS = ['keyboard_cover_condition', 'screen_condition'] as const;

/**
 * Campos que cada tipo de equipo espera del schema remoto.
 *
 * Se separan de `REQUIRED_SCHEMA_FIELDS_BY_TYPE` a propósito: los de ZF-98 degradan a
 * respaldo local sin romper nada, así que su ausencia no debe pintar el error de contrato
 * contra un backend que todavía no desplegó la fase F3.
 */
export const EXPECTED_SCHEMA_FIELDS_BY_TYPE: Record<string, readonly string[]> = {
	notebook: [...ZF48_NOTEBOOK_FIELDS, ...ZF98_PORT_FIELDS, ...ZF98_NOTEBOOK_FIELDS],
	desktop: [...ZF48_DESKTOP_FIELDS, ...ZF98_PORT_FIELDS],
	aio: ZF98_PORT_FIELDS,
	docking: ZF98_PORT_FIELDS,
	monitor: ZF98_PORT_FIELDS,
};

/** Campos sin respaldo local: si el backend no los publica, el formulario está incompleto. */
export const REQUIRED_SCHEMA_FIELDS_BY_TYPE: Record<string, readonly string[]> = {
	notebook: ZF48_NOTEBOOK_FIELDS,
	desktop: ZF48_DESKTOP_FIELDS,
};

const AIO_ALIAS = 'all-in-one';

/** Normaliza el alias `all-in-one` que acepta el router de formularios. */
export const normalizeEquipmentType = (equipmentType: string): string => {
	const normalized = equipmentType.toLowerCase();
	return normalized === AIO_ALIAS ? 'aio' : normalized;
};

export const selectTechnicalReviewSchemaFields = (
	schema: ITechnicalReviewSchema,
	fieldNames: readonly string[],
): ITechnicalReviewSchema =>
	Object.fromEntries(
		fieldNames.flatMap((fieldName) => {
			const field = schema[fieldName];
			return field ? [[fieldName, field] as const] : [];
		}),
	);

export const getSchemaFieldOptions = (
	field: ITechnicalReviewSchemaField | undefined,
): Array<{ value: string; label: string }> =>
	// El contrato declara `string | number`: una opción numérica se convierte, no se
	// descarta, para que no desaparezca de la UI sin dejar traza.
	(field?.options ?? []).map((option) => ({
		value: String(option.value),
		label: option.label,
	}));

/**
 * Metadata efectiva de un campo: lo que publica el backend, con respaldo local.
 *
 * ZF-48 pasó teclado, touchpad y bisagras a opciones dinámicas. Sin este respaldo,
 * cuando el schema remoto no está disponible —primer render, fetch fallido, backend
 * sin publicar los campos, o usuario sin sucursal ni subsidiaría— esos campos quedan
 * sin opciones y sin título, y la revisión no se puede completar. En `develop`
 * funcionan con las constantes locales: perderlas es una regresión.
 */
export interface SchemaFieldFallback {
	label: string;
	options: Array<{ value: string; label: string }>;
	/** Obligatoriedad conocida localmente, usada cuando el backend no publica `required`. */
	required?: boolean;
}

export interface ResolvedSchemaField {
	label: string;
	options: Array<{ value: string; label: string }>;
	hint?: string;
	warning?: string;
	/** Obligatoriedad efectiva: manda el `required` publicado por el backend. */
	required: boolean;
	/** `true` cuando la metadata proviene del respaldo local y no del backend. */
	isFallback: boolean;
}

export const resolveSchemaField = (
	field: ITechnicalReviewSchemaField | undefined,
	fallback: SchemaFieldFallback,
): ResolvedSchemaField => {
	const remoteOptions = getSchemaFieldOptions(field);
	const hasRemoteOptions = remoteOptions.length > 0;

	return {
		label: field?.label ?? fallback.label,
		options: hasRemoteOptions ? remoteOptions : fallback.options,
		hint: field?.hint,
		warning: field?.warning,
		required: field?.required ?? fallback.required ?? false,
		isFallback: !hasRemoteOptions,
	};
};
