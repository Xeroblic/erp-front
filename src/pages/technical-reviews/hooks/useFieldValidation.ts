/**
 * Backwards compatibility shim
 * Reexporta el hook centralizado ubicado en shared/validation/hooks
 */
export {
	useFieldValidation,
	type UseFieldValidationProps,
	type ValidationResult,
	type ValidationStatus,
	type UseFieldValidationReturn,
} from '../shared/validation/hooks/useFieldValidation';
