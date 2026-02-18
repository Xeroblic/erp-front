/**
 * Shared types for the modular form system.
 * Each equipment type form uses these interfaces to define its sections.
 */
import type { Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';

/** Props passed to every section component */
export interface FormSectionProps<T extends Record<string, any> = Record<string, any>> {
	control: Control<T>;
	errors: FieldErrors<T>;
	readOnly: boolean;
	watch: UseFormWatch<T>;
	setValue: UseFormSetValue<T>;
}

/** Configuration for a single form section/step */
export interface SectionConfig<T extends Record<string, any> = Record<string, any>> {
	key: string;
	label: string;
	icon: string;
	component: React.ComponentType<FormSectionProps<T>>;
}
