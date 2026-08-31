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
	(field?.options ?? []).flatMap((option) =>
		typeof option.value === 'string' ? [{ value: option.value, label: option.label }] : [],
	);
