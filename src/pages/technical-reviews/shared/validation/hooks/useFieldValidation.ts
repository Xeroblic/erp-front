/**
 * Hook useFieldValidation
 * Validación en tiempo real de campos usando el backend con utilidades listas para inputs
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import { useAppDispatch } from '@/store';
import { validateField } from '@/store/slices/technicalReviews/thunks/validationThunks';
import type { EquipmentType } from '@/interface/technicalReviews.interface';
import { extractFieldValue } from '../constants/field-helpers.constant';

type SupportedElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type FieldChangeEvent = ChangeEvent<SupportedElement>;
type FieldFocusEvent = FocusEvent<SupportedElement>;

export interface UseFieldValidationProps {
	branchId: number;
	equipmentType: EquipmentType;
	fieldName: string;
	debounceMs?: number;
}

export interface ValidationResult {
	isValid: boolean;
	error: string | null;
	warning: string | null;
	suggestion: string | null;
	helpText: string | null;
}

export type ValidationStatus = 'idle' | 'valid' | 'invalid' | 'warning';

interface ValidateFieldOptions {
	immediate?: boolean;
	allowEmpty?: boolean;
	skipIfUnchanged?: boolean;
}

interface FieldPropsOptions extends ValidateFieldOptions {
	trigger?: 'change' | 'blur' | 'both';
}

const INITIAL_RESULT: ValidationResult = {
	isValid: true,
	error: null,
	warning: null,
	suggestion: null,
	helpText: null,
};

const normalizeValue = (valueOrEvent: unknown) => {
	if (
		valueOrEvent &&
		typeof valueOrEvent === 'object' &&
		'target' in (valueOrEvent as Record<string, unknown>)
	) {
		const event = valueOrEvent as { target: { value: unknown } };
		return extractFieldValue(event.target?.value);
	}

	return extractFieldValue(valueOrEvent);
};

const defaultOptions: Required<Pick<ValidateFieldOptions, 'allowEmpty' | 'skipIfUnchanged'>> = {
	allowEmpty: false,
	skipIfUnchanged: true,
};

export interface UseFieldValidationReturn extends ValidationResult {
	status: ValidationStatus;
	hasFeedback: boolean;
	isValidating: boolean;
	lastValue: unknown;
	validate: (value: unknown, options?: ValidateFieldOptions) => Promise<boolean>;
	validateNow: (value: unknown, options?: Omit<ValidateFieldOptions, 'immediate'>) => Promise<boolean>;
	validateOnChange: (
		valueOrEvent: unknown,
		options?: Omit<ValidateFieldOptions, 'immediate'>,
	) => Promise<boolean>;
	getFieldValidationProps: (options?: FieldPropsOptions) => {
		onChange?: (event: FieldChangeEvent) => void;
		onBlur?: (event: FieldFocusEvent) => void;
	};
	reset: () => void;
}

export const useFieldValidation = ({
	branchId,
	equipmentType,
	fieldName,
	debounceMs = 500,
}: UseFieldValidationProps): UseFieldValidationReturn => {
	const dispatch = useAppDispatch();
	const [validationResult, setValidationResult] = useState<ValidationResult>(INITIAL_RESULT);
	const [isValidating, setIsValidating] = useState(false);
	const [lastValue, setLastValue] = useState<unknown>(null);

	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastNormalizedValueRef = useRef<unknown>(null);

	const clearPendingTimeout = useCallback(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}
	}, []);

	const reset = useCallback(() => {
		clearPendingTimeout();
		lastNormalizedValueRef.current = null;
		setLastValue(null);
		setValidationResult(INITIAL_RESULT);
		setIsValidating(false);
	}, [clearPendingTimeout]);

	const runValidation = useCallback(
		async (normalizedValue: unknown): Promise<ValidationResult> => {
			setIsValidating(true);
			lastNormalizedValueRef.current = normalizedValue;
			setLastValue(normalizedValue);

			try {
				const result = await dispatch(
					validateField({
						branchId,
						data: {
							equipment_type: equipmentType,
							field_name: fieldName,
							field_value: normalizedValue,
						},
					}),
				).unwrap();

				const parsedResult: ValidationResult = {
					isValid: result.valid,
					error: result.errors?.[0] || null,
					warning: result.warnings?.[0] || null,
					suggestion: result.suggestion || null,
					helpText: result.help_text || null,
				};

				setValidationResult(parsedResult);
				return parsedResult;
			} catch (error) {
				const fallbackResult: ValidationResult = {
					isValid: true,
					error: null,
					warning: 'No se pudo validar el campo',
					suggestion: null,
					helpText: null,
				};
				setValidationResult(fallbackResult);
				return fallbackResult;
			} finally {
				setIsValidating(false);
			}
		},
		[dispatch, branchId, equipmentType, fieldName],
	);

	const scheduleValidation = useCallback(
		(valueOrEvent: unknown, options: ValidateFieldOptions = {}): Promise<boolean> => {
			const mergedOptions = { ...defaultOptions, ...options };
			const normalizedValue = normalizeValue(valueOrEvent);

			if (!mergedOptions.allowEmpty && (normalizedValue === null || normalizedValue === '')) {
				reset();
				return Promise.resolve(true);
			}

			if (
				mergedOptions.skipIfUnchanged &&
				lastNormalizedValueRef.current === normalizedValue &&
				validationResult.isValid
			) {
				return Promise.resolve(validationResult.isValid);
			}

			clearPendingTimeout();

			if (mergedOptions.immediate) {
				return runValidation(normalizedValue).then((res) => res.isValid);
			}

			return new Promise((resolve) => {
				debounceTimerRef.current = setTimeout(() => {
					runValidation(normalizedValue).then((res) => resolve(res.isValid));
				}, debounceMs);
			});
		},
		[debounceMs, runValidation, reset, validationResult.isValid, clearPendingTimeout],
	);

	const validateNow = useCallback(
		(value: unknown, options?: Omit<ValidateFieldOptions, 'immediate'>) =>
			scheduleValidation(value, { ...options, immediate: true }),
		[scheduleValidation],
	);

	const validateOnChange = useCallback(
		(value: unknown, options?: Omit<ValidateFieldOptions, 'immediate'>) =>
			scheduleValidation(value, { ...options, immediate: false }),
		[scheduleValidation],
	);

	const getFieldValidationProps = useCallback(
		(options: FieldPropsOptions = {}) => {
			const handlers: {
				onChange?: (event: FieldChangeEvent) => void;
				onBlur?: (event: FieldFocusEvent) => void;
			} = {};

			const { trigger = 'blur', ...rest } = options;

			if (trigger === 'change' || trigger === 'both') {
				handlers.onChange = (event) => {
					validateOnChange(event, rest);
				};
			}

			if (trigger === 'blur' || trigger === 'both') {
				handlers.onBlur = (event) => {
					validateNow(event, rest);
				};
			}

			return handlers;
		},
		[validateNow, validateOnChange],
	);

	const status: ValidationStatus = useMemo(() => {
		if (lastValue == null || lastValue === '') {
			return 'idle';
		}

		if (validationResult.error) {
			return 'invalid';
		}

		if (validationResult.warning) {
			return 'warning';
		}

		return validationResult.isValid ? 'valid' : 'idle';
	}, [lastValue, validationResult]);

	const hasFeedback = Boolean(
		validationResult.error ||
			validationResult.warning ||
			validationResult.suggestion ||
			validationResult.helpText,
	);

	return {
		...validationResult,
		status,
		hasFeedback,
		isValidating,
		lastValue,
		validate: scheduleValidation,
		validateNow,
		validateOnChange,
		getFieldValidationProps,
		reset,
	};
};
