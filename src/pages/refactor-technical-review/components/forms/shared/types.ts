/**
 * Shared types for the modular form system.
 * Each equipment type form uses these interfaces to define its sections.
 */
import type { FormikValues } from 'formik';
import type { TIcons } from '@/types/icons.type';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';

/** Nombre de un campo de primer nivel del formulario. */
export type ReviewFieldName<T> = Extract<keyof T, string>;

/** Mensajes de error visibles, uno por campo: sólo los de campos ya tocados o validados. */
export type SectionErrors<T> = Partial<Record<ReviewFieldName<T>, string>>;

export interface SetReviewFieldOptions {
	/** Marca el campo como tocado para que su error se vea sin esperar al blur. */
	touch?: boolean;
}

/** Props passed to every section component */
export interface FormSectionProps<T extends FormikValues = FormikValues> {
	values: T;
	errors: SectionErrors<T>;
	readOnly: boolean;
	setFieldValue: <K extends ReviewFieldName<T>>(
		field: K,
		value: T[K],
		options?: SetReviewFieldOptions,
	) => void;
	onFieldBlur: (field: ReviewFieldName<T>) => void;
	onDirectSubmit?: (payload: Partial<T>) => void;
	schemaFields?: ITechnicalReviewSchema;
}

/** Configuration for a single form section/step */
export interface SectionConfig<T extends FormikValues = FormikValues> {
	key: string;
	label: string;
	icon: TIcons;
	component: React.ComponentType<FormSectionProps<T>>;
}
