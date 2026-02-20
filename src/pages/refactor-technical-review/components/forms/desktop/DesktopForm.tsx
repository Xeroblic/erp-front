/**
 * DesktopForm.tsx
 * Orchestrator for the Desktop technical review form.
 * Composes sections in the FormShell with Yup validation.
 */
import React, { useMemo, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { desktopSchema, type DesktopFormData } from '../../validation/desktop.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps } from '../shared/types';
import { useFormCompleteness } from '../../../hooks/useFormCompleteness';
import { DESKTOP_FIELDS_METADATA } from '../../constants/desktop/desktop.fields';

import {
	ALLOWED_COVER_CONDITIONS,
	ALLOWED_CHARGER_STATUSES,
} from '../../validation/constants/desktop.rules';

// ─── Section Components ──────────────────────────────────────────────────────
import DesktopBasicInfoSection from './sections/DesktopBasicInfoSection';
// ... (rest of imports are fine, just ensuring this is at the top)

// ...

import DesktopHardwareSection from './sections/DesktopHardwareSection';
import DesktopPortsSection from './sections/DesktopPortsSection';
import DesktopAestheticsSection from './sections/DesktopAestheticsSection';
import DesktopConnectivitySection from './sections/DesktopConnectivitySection';
import DesktopAccessoriesSection from './sections/DesktopAccessoriesSection';
import DesktopSoftwareSection from './sections/DesktopSoftwareSection';
import DesktopObservationsSection from './sections/DesktopObservationsSection';

// ─── Section Order ────────────────────────────────────────────────────────────
const DESKTOP_SECTIONS: SectionConfig<DesktopFormData>[] = [
	{
		key: 'basic-info',
		label: 'Info Básica',
		icon: 'HeroInformationCircle',
		component: DesktopBasicInfoSection,
	},
	{
		key: 'hardware',
		label: 'Hardware',
		icon: 'HeroCpuChip',
		component: DesktopHardwareSection,
	},
	{
		key: 'ports',
		label: 'Puertos',
		icon: 'HeroServerStack',
		component: DesktopPortsSection,
	},
	{
		key: 'aesthetics',
		label: 'Estética',
		icon: 'HeroSparkles',
		component: DesktopAestheticsSection,
	},
	{
		key: 'connectivity',
		label: 'Conectividad',
		icon: 'HeroSignal',
		component: DesktopConnectivitySection,
	},
	{
		key: 'accessories',
		label: 'Accesorios',
		icon: 'HeroBolt', // Using Bolt as it relates to power/charging
		component: DesktopAccessoriesSection,
	},
	{
		key: 'software',
		label: 'SO',
		icon: 'HeroCommandLine',
		component: DesktopSoftwareSection,
	},
	{
		key: 'observations',
		label: 'Observaciones',
		icon: 'HeroDocumentText',
		component: DesktopObservationsSection,
	},
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface DesktopFormProps {
	defaultValues?: Partial<DesktopFormData>;
	onSubmit: (data: DesktopFormData) => Promise<void>;
	onBack: () => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
	onStepChange?: (direction: 'next' | 'prev') => void;
	registerGetFormValues?: (getter: () => Record<string, unknown>) => void;
	isSaving?: boolean;
}

const DesktopForm: React.FC<DesktopFormProps> = ({
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
		reset,
		formState: { errors },
	} = useForm<DesktopFormData>({
		resolver: yupResolver(desktopSchema) as unknown as Resolver<DesktopFormData>,
		defaultValues: defaultValues || {},
		mode: 'onBlur',
	});

	// Calculate Completeness (using refactored hook with 2nd arg)
	// We watch all values to trigger updates
	const allValues = watch();
	const validationStats = useFormCompleteness(
		allValues as Record<string, any>,
		DESKTOP_FIELDS_METADATA,
	);

	// Assemble props passed to every section
	const sectionProps: FormSectionProps<DesktopFormData> = useMemo(
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

	// ... inside component ...

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

	// Auto-cleanup: Fix stale state from previous invalid schema versions
	// This detects if the loaded data has values that are no longer allowed
	// and resets them to null to prevent validation/save errors.
	useEffect(() => {
		const currentCover = watch('cover_condition');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (currentCover && !ALLOWED_COVER_CONDITIONS.includes(currentCover as any)) {
			console.warn('[AutoFix] Resetting invalid cover_condition:', currentCover);
			// Use shouldValidate: true to verify the fix immediately
			setValue('cover_condition', undefined as any, { shouldValidate: true });
		}

		const currentCharger = watch('charger_status');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (currentCharger && !ALLOWED_CHARGER_STATUSES.includes(currentCharger as any)) {
			console.warn('[AutoFix] Resetting invalid charger_status:', currentCharger);
			setValue('charger_status', undefined as any, { shouldValidate: true });
		}
	}, [watch, setValue]);

	// Handle finish
	const handleFinish = () => {
		handleSubmit(
			async (data) => {
				try {
					await onSubmit(data);
				} catch (error: unknown) {
					const message =
						error instanceof Error ? error.message : 'Error al guardar la revisión';
					console.error('DesktopForm submit error:', error);
					toast.error(message);
				}
			},
			(validationErrors) => {
				const messages = Object.values(validationErrors)
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
		<FormShell<DesktopFormData>
			sections={DESKTOP_SECTIONS}
			sectionProps={sectionProps}
			onBack={onBack}
			onFinish={handleFinish}
			isSubmitting={isSubmitting}
			onStepChange={onStepChange}
			isSaving={isSaving}
		/>
	);
};

export default DesktopForm;
