/**
 * DesktopForm.tsx
 * Orchestrator for the Desktop technical review form.
 * Composes sections in the FormShell with Yup validation.
 */
import React, { useMemo, useEffect } from 'react';
import { useForm, type FieldPath, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { desktopSchema, type DesktopFormData } from '../../validation/desktop.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps } from '../shared/types';
import { useFormCompleteness } from '../../../hooks/useFormCompleteness';
import { DESKTOP_FIELDS_METADATA } from '../../constants/desktop/desktop.fields';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';

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
import GallerySection from '../shared/gallery/GallerySection';

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
	{
		key: 'gallery',
		label: 'Galería',
		icon: 'HeroPhoto',
		component: GallerySection,
	},
];

const DESKTOP_SECTION_FIELDS: Record<string, FieldPath<DesktopFormData>[]> = {
	'basic-info': ['brand', 'model', 'line'],
	hardware: [
		'processor',
		'has_no_ram',
		'has_no_storage',
		'ram_size',
		'ram_slots',
		'ram_type',
		'storage_size',
		'storage_technology',
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
		'loose_ports_count',
		'loose_port_types',
		'defective_port_types',
	],
	aesthetics: ['general_condition', 'cover_condition', 'powers_on'],
	connectivity: ['has_wifi', 'has_bluetooth', 'has_cd_drive'],
	accessories: ['includes_charger', 'charger_status'],
	software: ['operating_system'],
	observations: ['observations'],
};

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
	/** Initial section key to jump to on first mount */
	initialSectionKey?: string;
	schemaFields?: ITechnicalReviewSchema;
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
	initialSectionKey,
	schemaFields,
}) => {
	const {
		control,
		handleSubmit,
		watch,
		setValue,
		getValues,
		trigger,
		getFieldState,
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
			schemaFields,
			onDirectSubmit: (partialData) => {
				const currentData = getValues();
				const payload = { ...currentData, ...partialData } as DesktopFormData;
				onSubmit(payload);
			},
		}),
		[control, errors, readOnly, watch, setValue, getValues, onSubmit, schemaFields],
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
	const validateStep = async (sectionKey: string) => {
		const stepFields = DESKTOP_SECTION_FIELDS[sectionKey] ?? [];
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
					console.error('DesktopForm submit error:', error);
					toast.error(message);
				}
			},
			(validationErrors) => {
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
		<FormShell<DesktopFormData>
			sections={DESKTOP_SECTIONS}
			sectionProps={sectionProps}
			onBack={onBack}
			onFinish={handleFinish}
			isSubmitting={isSubmitting}
			onStepChange={onStepChange}
			onValidateStep={validateStep}
			isSaving={isSaving}
			initialSectionKey={initialSectionKey}
		/>
	);
};

export default DesktopForm;
