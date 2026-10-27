/**
 * Estado compartido de los cinco formularios de revisión técnica sobre Formik.
 *
 * Reúne lo que cada orquestador repetía: el reinicio cuando llegan otros valores
 * iniciales, el getter que lee el autoguardado, la validación por sección de `FormShell`
 * y la validación completa de «Finalizar».
 *
 * La validación usa `schema.validate(values, { abortEarly: false })`, igual que el
 * resolver de Yup que había antes: no pasa por `validationSchema` de Formik, que
 * convierte los `''` en `undefined` y cambiaría qué campos fallan. El submit recibe el
 * valor casteado por Yup (defaults y `transform` aplicados), como antes.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
	useFormik,
	yupToFormErrors,
	type FormikErrors,
	type FormikTouched,
	type FormikValues,
} from 'formik';
import { ValidationError, type AnyObjectSchema } from 'yup';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import type {
	FormSectionProps,
	ReviewFieldName,
	SectionErrors,
	SetReviewFieldOptions,
} from './types';

export const DEFAULT_STEP_ERROR = 'Debes completar los campos obligatorios antes de continuar.';

/** Primer mensaje de un error de Formik, que puede venir anidado en arreglos u objetos. */
export const firstErrorMessage = (error: unknown): string | undefined => {
	if (typeof error === 'string') return error;
	if (Array.isArray(error)) {
		return error.reduce<string | undefined>(
			(found, item) => found ?? firstErrorMessage(item),
			undefined,
		);
	}
	if (error && typeof error === 'object') {
		return firstErrorMessage(Object.values(error));
	}
	return undefined;
};

/**
 * Enfoca el campo por su `name`. Los selects (`SelectReact`) sólo exponen con ese `name`
 * un input oculto, que no recibe foco: su input visible lleva el `name` como `id`.
 */
const focusField = (field: string) => {
	const named = Array.from(document.getElementsByName(field)).find(
		(element) => !(element instanceof HTMLInputElement && element.type === 'hidden'),
	);
	(named ?? document.getElementById(field))?.focus();
};

export type ReviewValidationResult<T> =
	| { isValid: true; data: T }
	| { isValid: false; messages: string[]; errors: SectionErrors<T> };

interface UseReviewFormOptions<T extends FormikValues> {
	schema: AnyObjectSchema;
	initialValues: T;
	sectionFields: Record<string, ReviewFieldName<T>[]>;
	readOnly: boolean;
	schemaFields?: ITechnicalReviewSchema;
	registerGetFormValues?: (getter: () => Record<string, unknown>) => void;
	/** Muestra el error de un campo apenas cambia, sin esperar al blur (AIO y monitor). */
	touchOnChange?: boolean;
	/** Ajusta los valores antes de cada reinicio (normalizaciones de carga). */
	prepareReset?: (values: T) => T;
}

/** Copia de `touched` con los campos indicados marcados como tocados. */
const withTouched = <T extends FormikValues>(
	touched: FormikTouched<T>,
	fields: ReviewFieldName<T>[],
): FormikTouched<T> => {
	const next: Record<string, unknown> = { ...touched };
	fields.forEach((field) => {
		next[field] = true;
	});
	return next as FormikTouched<T>;
};

const toErrors = <T extends FormikValues>(error: unknown): FormikErrors<T> => {
	if (error instanceof ValidationError) return yupToFormErrors<T>(error);
	throw error;
};

export const useReviewForm = <T extends FormikValues>({
	schema,
	initialValues,
	sectionFields,
	readOnly,
	schemaFields,
	registerGetFormValues,
	touchOnChange = false,
	prepareReset,
}: UseReviewFormOptions<T>) => {
	const validate = useCallback(
		async (values: T): Promise<FormikErrors<T>> => {
			try {
				await schema.validate(values, { abortEarly: false });
				return {};
			} catch (error) {
				return toErrors<T>(error);
			}
		},
		[schema],
	);

	const formik = useFormik<T>({
		initialValues,
		validate,
		onSubmit: () => undefined,
	});

	const {
		values,
		errors,
		touched,
		resetForm,
		setFieldValue: setFormikValue,
		setFieldTouched,
		setTouched,
		setErrors,
		validateForm,
	} = formik;

	// El autoguardado pide los valores fuera del ciclo de render.
	const valuesRef = useRef(values);
	useEffect(() => {
		valuesRef.current = values;
	}, [values]);

	const getValues = useCallback(() => valuesRef.current, []);

	useEffect(() => {
		registerGetFormValues?.(() => valuesRef.current as Record<string, unknown>);
	}, [registerGetFormValues]);

	// Reinicia el formulario cuando cambian de verdad los valores iniciales.
	const prevInitialValues = useRef<string | null>(null);
	useEffect(() => {
		const stringified = JSON.stringify(initialValues);
		if (stringified === prevInitialValues.current) return;
		prevInitialValues.current = stringified;
		const nextValues = prepareReset ? prepareReset(initialValues) : initialValues;
		valuesRef.current = nextValues;
		resetForm({ values: nextValues });
	}, [initialValues, prepareReset, resetForm]);

	const visibleErrors = useMemo<SectionErrors<T>>(() => {
		const result: SectionErrors<T> = {};
		(Object.keys(errors) as ReviewFieldName<T>[]).forEach((field) => {
			if (!touched[field]) return;
			const message = firstErrorMessage(errors[field]);
			if (message) result[field] = message;
		});
		return result;
	}, [errors, touched]);

	const setFieldValue = useCallback(
		<K extends ReviewFieldName<T>>(field: K, value: T[K], options?: SetReviewFieldOptions) => {
			valuesRef.current = { ...valuesRef.current, [field]: value };
			void setFormikValue(field, value);
			if (options?.touch || touchOnChange) void setFieldTouched(field, true, false);
		},
		[setFormikValue, setFieldTouched, touchOnChange],
	);

	const onFieldBlur = useCallback(
		(field: ReviewFieldName<T>) => {
			void setFieldTouched(field, true);
		},
		[setFieldTouched],
	);

	/** Marca los campos como tocados, valida y devuelve el primer error en su orden. */
	const validateFields = useCallback(
		async (fields: ReviewFieldName<T>[]) => {
			await setTouched(withTouched(touched, fields), false);
			const nextErrors = await validateForm(valuesRef.current);
			const firstInvalid = fields.find((field) => firstErrorMessage(nextErrors[field]));
			if (!firstInvalid) return { isValid: true as const };
			focusField(firstInvalid);
			return {
				isValid: false as const,
				message: firstErrorMessage(nextErrors[firstInvalid]) ?? DEFAULT_STEP_ERROR,
			};
		},
		[setTouched, touched, validateForm],
	);

	const validateStep = useCallback(
		(sectionKey: string) => validateFields(sectionFields[sectionKey] ?? []),
		[sectionFields, validateFields],
	);

	/** Validación de «Finalizar»: devuelve los datos casteados o los mensajes de error. */
	const validateAll = useCallback(async (): Promise<ReviewValidationResult<T>> => {
		try {
			const data = (await schema.validate(valuesRef.current, { abortEarly: false })) as T;
			return { isValid: true, data };
		} catch (error) {
			const nextErrors = toErrors<T>(error);
			const fields = Object.keys(nextErrors) as ReviewFieldName<T>[];
			setErrors(nextErrors);
			await setTouched(withTouched(touched, fields), false);
			const messageByField: SectionErrors<T> = {};
			fields.forEach((field) => {
				const message = firstErrorMessage(nextErrors[field]);
				if (message) messageByField[field] = message;
			});
			return {
				isValid: false,
				messages: Object.values(messageByField).filter(
					(message): message is string => typeof message === 'string',
				),
				errors: messageByField,
			};
		}
	}, [schema, setErrors, setTouched, touched]);

	const sectionProps = useMemo<FormSectionProps<T>>(
		() => ({
			values,
			errors: visibleErrors,
			readOnly,
			setFieldValue,
			onFieldBlur,
			schemaFields,
		}),
		[values, visibleErrors, readOnly, setFieldValue, onFieldBlur, schemaFields],
	);

	return {
		formik,
		values,
		getValues,
		setFieldValue,
		sectionProps,
		validateFields,
		validateStep,
		validateAll,
	};
};

/** Toast con los primeros errores de «Finalizar», como lo mostraban los cinco formularios. */
export const formatFinishErrors = (messages: string[]): string =>
	messages.length > 0
		? `Corrige los errores antes de continuar:\n${messages.slice(0, 5).join('\n')}`
		: 'Hay campos con errores. Revisa el formulario.';
