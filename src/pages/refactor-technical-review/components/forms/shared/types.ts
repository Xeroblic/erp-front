/**
 * Shared types for the modular form system.
 * Each equipment type form uses these interfaces to define its sections.
 */
import type {
	Control,
	FieldErrors,
	UseFormWatch,
	UseFormSetValue,
	FieldValues,
} from 'react-hook-form';
import type { TIcons } from '@/types/icons.type';

/** Props passed to every section component */
export interface FormSectionProps<T extends FieldValues = FieldValues> {
	control: Control<T>;
	errors: FieldErrors<T>;
	readOnly: boolean;
	watch: UseFormWatch<T>;
	setValue: UseFormSetValue<T>;
	onDirectSubmit?: (payload: Partial<T>) => void;
}

/** Configuration for a single form section/step */
export interface SectionConfig<T extends FieldValues = FieldValues> {
	key: string;
	label: string;
	icon: TIcons;
	component: React.ComponentType<FormSectionProps<T>>;
}
