/**
 * DockingForm.tsx
 * Orchestrator for the Docking technical review form.
 * Composes sections in the FormShell with Yup validation.
 */
import React, { useMemo, useEffect } from 'react';
import { useForm, type FieldPath, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { dockingSchema, type DockingFormData } from '../../validation/docking.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps } from '../shared/types';

// ─── Section Components ──────────────────────────────────────────────────────
import DockingBasicInfoSection from './sections/DockingBasicInfoSection';
import DockingPortsSection from './sections/DockingPortsSection';
import DockingExtrasSection from './sections/DockingExtrasSection';

// ─── Section Order ─────────────────────────
const DOCKING_SECTIONS: SectionConfig<DockingFormData>[] = [
	{
		key: 'basic-info',
		label: 'Info Básica',
		icon: 'HeroInformationCircle',
		component: DockingBasicInfoSection,
	},
	{
		key: 'ports',
		label: 'Puertos',
		icon: 'HeroServerStack',
		component: DockingPortsSection,
	},
	{
		key: 'extras',
		label: 'Extras & Notas',
		icon: 'HeroSparkles',
		component: DockingExtrasSection,
	},
];

const DOCKING_SECTION_FIELDS: Record<string, FieldPath<DockingFormData>[]> = {
	'basic-info': ['brand', 'model', 'line', 'general_condition'],
	ports: [
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_c_ports',
		'sd_readers',
		'rj45_ports',
		'usb_a_ports',
		'all_ports_functional',
		'defective_ports_count',
	],
	extras: ['has_wifi', 'includes_power_adapter', 'cover_condition', 'observations'],
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface DockingFormProps {
	defaultValues?: Partial<DockingFormData>;
	onSubmit: (data: DockingFormData) => Promise<void>;
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

const DockingForm: React.FC<DockingFormProps> = ({
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
		getFieldState,
		reset,
		formState: { errors },
	} = useForm<DockingFormData>({
		resolver: yupResolver(dockingSchema) as unknown as Resolver<DockingFormData>,
		defaultValues: defaultValues || {},
		mode: 'onBlur',
	});

	// Assemble props passed to every section
	const sectionProps: FormSectionProps<DockingFormData> = useMemo(
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
			// Normalize empty objects into correct shapes internally to avoid UI breaks on render
			const stringified = JSON.stringify(defaultValues);
			if (stringified !== prevDefaultValues.current) {
				const valuesToReset = { ...defaultValues };

				// Prevent Yup objects like extra_attributes from turning into 'undefined' causing null loops, normalize them
				if (
					valuesToReset.extra_attributes === undefined ||
					valuesToReset.extra_attributes === null
				) {
					valuesToReset.extra_attributes = {} as any; // Allow empty obj bypassing Yup's undefined cast momentarily
				}

				reset(valuesToReset);
				prevDefaultValues.current = stringified;
			}
		}
	}, [defaultValues, reset]);

	// Handle finish
	const validateStep = async (sectionKey: string) => {
		const stepFields = DOCKING_SECTION_FIELDS[sectionKey] ?? [];
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
					// Prepare clean data payload (handling implicit empty/undefined object maps)
					const payloadToSend = {
						...data,
						extra_attributes:
							data.extra_attributes && Object.keys(data.extra_attributes).length > 0
								? data.extra_attributes
								: ({} as any),
					};

					await onSubmit(payloadToSend);
				} catch (error: unknown) {
					const message =
						error instanceof Error
							? error.message
							: 'Error al guardar la revisión de Docking';
					console.error('DockingForm submit error:', error);
					toast.error(message);
				}
			},
			(validationErrors) => {
				// Collect all validation error messages
				const messages = Object.values(validationErrors)
					.map((e) => e?.message)
					.filter(Boolean)
					.slice(0, 5); // Show top 5 max to prevent massive toasts

				if (messages.length > 0) {
					toast.error(`Corrige los errores antes de continuar:\n${messages.join('\n')}`);
				} else {
					toast.error('Hay campos con errores. Revisa el formulario.');
				}
			},
		)();
	};

	return (
		<FormShell<DockingFormData>
			sections={DOCKING_SECTIONS}
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

export default DockingForm;
