import type {
	ITechnicalReviewSchema,
	ITechnicalReviewSchemaField,
} from '@/interface/technicalReviews.interface';

export const ZF48_NOTEBOOK_FIELDS = [
	'keyboard_condition',
	'non_functional_keys_count',
	'touchpad_condition',
	'hinge_condition',
	'speakers_condition',
] as const;

export const ZF48_DESKTOP_FIELDS = ['powers_on'] as const;

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
}

export interface ResolvedSchemaField {
	label: string;
	options: Array<{ value: string; label: string }>;
	hint?: string;
	warning?: string;
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
		isFallback: !hasRemoteOptions,
	};
};
