/**
 * DesktopForm.tsx
 * Orchestrator for the Desktop technical review form.
 * Composes sections in the FormShell with Yup validation.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { getTechnicalReviewFieldError } from '@/utils/technicalReviewErrors';
import { toast } from 'react-toastify';

import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { desktopSchema, type DesktopFormData } from '../../validation/desktop.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps, ReviewFieldName } from '../shared/types';
import { formatFinishErrors, useReviewForm } from '../shared/useReviewForm';

import {
	ALLOWED_COVER_CONDITIONS,
	ALLOWED_CHARGER_STATUSES,
} from '../../validation/constants/desktop.rules';

// ─── Section Components ──────────────────────────────────────────────────────
import DesktopBasicInfoSection from './sections/DesktopBasicInfoSection';
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

const DESKTOP_SECTION_FIELDS: Record<string, ReviewFieldName<DesktopFormData>[]> = {
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
	accessories: ['includes_charger', 'charger_status', 'includes_antenna', 'antenna_condition'],
	software: ['operating_system'],
	observations: ['observations'],
};

/**
 * Limpia valores de versiones anteriores del schema que ya no son válidos, para que no
 * bloqueen la validación ni el guardado.
 */
const sanitizeLegacyValues = (values: DesktopFormData): DesktopFormData => {
	const next: Record<string, unknown> = { ...values };
	const legacyChecks: [keyof DesktopFormData, readonly string[]][] = [
		['cover_condition', ALLOWED_COVER_CONDITIONS],
		['charger_status', ALLOWED_CHARGER_STATUSES],
	];
	legacyChecks.forEach(([field, allowed]) => {
		const current = next[field];
		if (typeof current === 'string' && current && !allowed.includes(current)) {
			next[field] = undefined;
		}
	});
	return next as DesktopFormData;
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface DesktopFormProps {
	defaultValues?: Partial<DesktopFormData>;
	onSubmit: (data: DesktopFormData) => Promise<void>;
	onBack: () => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
	onStepChange?: (direction: 'next' | 'prev') => void;
	/** Guarda el borrador aunque la validación bloquee el avance de sección (ZF-102). */
	onPersistDraft?: () => Promise<void> | void;
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
	onPersistDraft,
	registerGetFormValues,
	isSaving = false,
	initialSectionKey,
	schemaFields,
}) => {
	const {
		formik: { setFieldError, setFieldTouched },
		sectionProps: baseSectionProps,
		getValues,
		validateFields,
		validateStep,
		validateAll,
	} = useReviewForm<DesktopFormData>({
		schema: desktopSchema,
		initialValues: (defaultValues ?? {}) as DesktopFormData,
		sectionFields: DESKTOP_SECTION_FIELDS,
		readOnly,
		schemaFields,
		registerGetFormValues,
		prepareReset: sanitizeLegacyValues,
	});
	const [sectionRequest, setSectionRequest] = useState<{ key: string; token: number }>();
	const showAntennaError = useCallback(() => {
		setSectionRequest((previous) => ({
			key: 'accessories',
			token: (previous?.token ?? 0) + 1,
		}));
	}, []);
	const submitReview = useCallback(
		async (data: DesktopFormData) => {
			try {
				await onSubmit(data);
			} catch (error: unknown) {
				const antennaError = getTechnicalReviewFieldError(error, 'antenna_condition');
				if (antennaError) {
					void setFieldTouched('antenna_condition', true, false);
					setFieldError('antenna_condition', antennaError);
					showAntennaError();
					return;
				}
				toast.error(
					error instanceof Error ? error.message : 'Error al guardar la revisión',
				);
			}
		},
		[onSubmit, setFieldError, setFieldTouched, showAntennaError],
	);

	// Assemble props passed to every section
	const sectionProps: FormSectionProps<DesktopFormData> = useMemo(
		() => ({
			...baseSectionProps,
			onDirectSubmit: async (partialData) => {
				// El atajo «No enciende» omite la validación completa, pero también debe
				// respetar el estado obligatorio de una antena previamente declarada.
				const antenna = await validateFields(['antenna_condition']);
				if (!antenna.isValid) {
					showAntennaError();
					return;
				}
				const payload = { ...getValues(), ...partialData } as DesktopFormData;
				await submitReview(payload);
			},
		}),
		[baseSectionProps, getValues, validateFields, showAntennaError, submitReview],
	);

	const handleFinish = useCallback(async () => {
		const result = await validateAll();
		if (result.isValid) {
			await submitReview(result.data);
			return;
		}
		if (result.errors.antenna_condition) showAntennaError();
		toast.error(formatFinishErrors(result.messages));
	}, [validateAll, submitReview, showAntennaError]);

	return (
		<FormShell<DesktopFormData>
			sections={DESKTOP_SECTIONS}
			sectionProps={sectionProps}
			onBack={onBack}
			onFinish={handleFinish}
			isSubmitting={isSubmitting}
			onStepChange={onStepChange}
			onPersistDraft={onPersistDraft}
			onValidateStep={validateStep}
			isSaving={isSaving}
			initialSectionKey={initialSectionKey}
			sectionRequest={sectionRequest}
		/>
	);
};

export default DesktopForm;
