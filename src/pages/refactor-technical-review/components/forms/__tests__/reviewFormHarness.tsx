/**
 * Arnés de pruebas para las secciones de revisión técnica.
 *
 * Monta la sección con el mismo estado que usan los formularios reales (`useReviewForm`
 * sobre Formik), así las pruebas recorren el camino de producción: valores, errores
 * visibles, `setFieldValue` y la validación de «Finalizar».
 */
import React from 'react';
import * as Yup from 'yup';
import type { FormikValues } from 'formik';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import type { FormSectionProps, ReviewFieldName, SectionErrors } from '../shared/types';
import { useReviewForm, type ReviewValidationResult } from '../shared/useReviewForm';

const EMPTY_SCHEMA = Yup.object({});

export interface ReviewFormHandle<T> {
	getValues: () => T;
	/** Lo mismo que hace «Finalizar Revisión» antes de llamar al submit. */
	finish: () => Promise<ReviewValidationResult<T>>;
	/** Lo mismo que hace «Siguiente» con los campos de la sección. */
	validate: (fields: ReviewFieldName<T>[]) => Promise<{ isValid: boolean }>;
}

interface ReviewFormHarnessProps<T extends FormikValues> {
	section: React.ComponentType<FormSectionProps<T>>;
	initialValues?: Partial<T>;
	schema?: Yup.AnyObjectSchema;
	readOnly?: boolean;
	schemaFields?: ITechnicalReviewSchema;
	onDirectSubmit?: (payload: Partial<T>) => void;
	/** Errores que reemplazan a los del formulario, para probar sólo cómo se pintan. */
	errors?: SectionErrors<T>;
	handle?: { current?: ReviewFormHandle<T> };
	/** Contenido extra que lee los valores en vivo (salidas de depuración de la prueba). */
	children?: (values: T) => React.ReactNode;
}

export const ReviewFormHarness = <T extends FormikValues>({
	section: Section,
	initialValues,
	schema = EMPTY_SCHEMA,
	readOnly = false,
	schemaFields,
	onDirectSubmit,
	errors,
	handle,
	children,
}: ReviewFormHarnessProps<T>) => {
	const { sectionProps, getValues, validateAll, validateFields, values } = useReviewForm<T>({
		schema,
		initialValues: (initialValues ?? {}) as T,
		sectionFields: {},
		readOnly,
		schemaFields,
	});

	if (handle) {
		handle.current = { getValues, finish: validateAll, validate: validateFields };
	}

	return (
		<>
			<Section
				values={sectionProps.values}
				errors={errors ?? sectionProps.errors}
				readOnly={sectionProps.readOnly}
				setFieldValue={sectionProps.setFieldValue}
				onFieldBlur={sectionProps.onFieldBlur}
				onDirectSubmit={onDirectSubmit}
				schemaFields={sectionProps.schemaFields}
			/>
			{children?.(values)}
		</>
	);
};
