/**
 * NotebookForm.tsx
 * Orchestrator for the Notebook technical review form.
 * Composes 9 sections in the FormShell with Yup validation.
 *
 * ✏️ To reorder sections → just reorder NOTEBOOK_SECTIONS below.
 * ✏️ To add a section → create a new component in sections/ and add it here.
 */
import React, { useMemo, useEffect } from 'react';
import { useForm, type FieldPath, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { notebookSchema, type NotebookFormData } from '../../validation/notebook.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps } from '../shared/types';

// ─── Section Components ──────────────────────────────────────────────────────
import BasicInfoSection from './sections/BasicInfoSection';
import HardwareSection from './sections/HardwareSection';
import PowerSection from './sections/PowerSection';
import PortsSection from './sections/PortsSection';
import ScreenSection from './sections/ScreenSection';
import InputSection from './sections/InputSection';
import AestheticsSection from './sections/AestheticsSection';
import SoftwareSection from './sections/SoftwareSection';
import ObservationsSection from './sections/ObservationsSection';

// ─── Section Order (edit this array to reorder steps) ─────────────────────────
const NOTEBOOK_SECTIONS: SectionConfig<NotebookFormData>[] = [
	{
		key: 'basic-info',
		label: 'Info Básica',
		icon: 'HeroInformationCircle',
		component: BasicInfoSection,
	},
	{
		key: 'hardware',
		label: 'Hardware',
		icon: 'HeroCpuChip',
		component: HardwareSection,
	},
	{
		key: 'power',
		label: 'Energía',
		icon: 'HeroBolt',
		component: PowerSection,
	},
	{
		key: 'ports',
		label: 'Puertos',
		icon: 'HeroServerStack',
		component: PortsSection,
	},
	{
		key: 'screen',
		label: 'Pantalla',
		icon: 'HeroComputerDesktop',
		component: ScreenSection,
	},
	{
		key: 'input',
		label: 'Entrada',
		icon: 'HeroHandRaised',
		component: InputSection,
	},
	{
		key: 'aesthetics',
		label: 'Estética',
		icon: 'HeroSparkles',
		component: AestheticsSection,
	},
	{
		key: 'software',
		label: 'SO',
		icon: 'HeroCommandLine',
		component: SoftwareSection,
	},
	{
		key: 'observations',
		label: 'Observaciones',
		icon: 'HeroDocumentText',
		component: ObservationsSection,
	},
];

const NOTEBOOK_SECTION_FIELDS: Record<string, FieldPath<NotebookFormData>[]> = {
	'basic-info': ['brand', 'model', 'line'],
	hardware: [
		'processor',
		'ram_size',
		'ram_slots',
		'ram_type',
		'storage_size',
		'storage_technology',
	],
	power: [
		'includes_charger',
		'charger_watts',
		'charger_status',
		'battery_health',
		'battery_status',
		'battery_percentage',
	],
	ports: [
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_c_ports',
		'usb_a_ports',
		'sd_readers',
		'rj45_ports',
		'all_ports_functional',
		'defective_ports_count',
	],
	screen: [
		'screen_inches',
		'is_touchscreen',
		'screen_condition',
		'dead_pixels_count',
		'spots_count',
	],
	input: ['keyboard_condition', 'keyboard_layout', 'has_numeric_keypad', 'has_backlit_keyboard'],
	aesthetics: [
		'general_condition',
		'cover_condition',
		'hinge_condition',
		'touchpad_condition',
		'bottom_condition',
	],
	software: ['operating_system', 'has_biometric', 'has_wifi', 'has_bluetooth'],
	observations: ['observations'],
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface NotebookFormProps {
	defaultValues?: Partial<NotebookFormData>;
	onSubmit: (data: NotebookFormData) => Promise<void>;
	onBack: () => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
	/** Called when user navigates between form sections */
	onStepChange?: (direction: 'next' | 'prev') => void;
	/** Registers a getter for current form values (used by auto-save) */
	registerGetFormValues?: (getter: () => Record<string, unknown>) => void;
	/** Whether auto-save is in progress */
	isSaving?: boolean;
}

const NotebookForm: React.FC<NotebookFormProps> = ({
	defaultValues,
	onSubmit,
	onBack,
	isSubmitting = false,
	readOnly = false,
	onStepChange,
	registerGetFormValues,
	isSaving = false,
}) => {
	const {
		control,
		handleSubmit,
		watch,
		setValue,
		trigger,
		getValues,
		getFieldState,
		reset,
		formState: { errors },
	} = useForm<NotebookFormData>({
		resolver: yupResolver(notebookSchema) as unknown as Resolver<NotebookFormData>,
		defaultValues: defaultValues || {},
		mode: 'onBlur',
	});

	// Assemble props passed to every section
	const sectionProps: FormSectionProps<NotebookFormData> = useMemo(
		() => ({
			control,
			errors,
			readOnly,
			watch,
			setValue,
		}),
		[control, errors, readOnly, watch, setValue],
	);

	// Expose getFormValues to parent for auto-save
	useEffect(() => {
		if (registerGetFormValues) {
			registerGetFormValues(() => watch() as unknown as Record<string, unknown>);
		}
	}, [registerGetFormValues, watch]);

	// Reset form when defaultValues changes deeply
	const prevDefaultValues = React.useRef<string | null>(null);
	useEffect(() => {
		if (defaultValues) {
			const stringified = JSON.stringify(defaultValues);
			if (stringified !== prevDefaultValues.current) {
				reset(defaultValues);
				prevDefaultValues.current = stringified;
			}
		}
	}, [defaultValues, reset]);

	// Handle finish
	const validateStep = async (sectionKey: string) => {
		const stepFields = NOTEBOOK_SECTION_FIELDS[sectionKey] ?? [];
		const currentValues = getValues();

		for (const field of stepFields) {
			try {
				await notebookSchema.validateAt(field, currentValues);
			} catch (error) {
				await trigger(stepFields, { shouldFocus: true });
				if (error instanceof Error) {
					return { isValid: false, message: error.message };
				}
				return {
					isValid: false,
					message: 'Debes completar los campos obligatorios antes de continuar.',
				};
			}
		}

		const isValid = await trigger(stepFields, { shouldFocus: true });

		if (isValid) {
			return { isValid: true };
		}

		const firstError = stepFields
			.map((field) => getFieldState(field).error?.message)
			.find(Boolean);

		return {
			isValid: false,
			message:
				typeof firstError === 'string'
					? firstError
					: 'Debes completar los campos obligatorios antes de continuar.',
		};
	};

	const handleFinish = () => {
		handleSubmit(
			async (data) => {
				try {
					await onSubmit(data);
				} catch (error: unknown) {
					const message =
						error instanceof Error ? error.message : 'Error al guardar la revisión';
					console.error('NotebookForm submit error:', error);
					toast.error(message);
				}
			},
			(validationErrors) => {
				// Collect all validation error messages
				const messages = Object.values(
					validationErrors as Record<string, { message?: string }>,
				)
					.map((e) => e?.message)
					.filter(Boolean)
					.slice(0, 5);

				if (messages.length > 0) {
					toast.error(`Corrige los errores antes de continuar:\n${messages.join('\n')}`);
				} else {
					toast.error('Hay campos con errores. Revisa el formulario.');
				}
			},
		)();
	};

	return (
		<FormShell<NotebookFormData>
			sections={NOTEBOOK_SECTIONS}
			sectionProps={sectionProps}
			onBack={onBack}
			onFinish={handleFinish}
			isSubmitting={isSubmitting}
			onStepChange={onStepChange}
			onValidateStep={validateStep}
			isSaving={isSaving}
		/>
	);
};

export default NotebookForm;
