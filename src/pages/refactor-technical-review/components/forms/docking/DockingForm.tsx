/**
 * DockingForm.tsx
 * Orchestrator for the Docking technical review form.
 * Composes sections in the FormShell with Yup validation.
 */
import React, { useCallback } from 'react';
import { toast } from 'react-toastify';

import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { dockingSchema, type DockingFormData } from '../../validation/docking.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, ReviewFieldName } from '../shared/types';
import { formatFinishErrors, useReviewForm } from '../shared/useReviewForm';

// ─── Section Components ──────────────────────────────────────────────────────
import DockingBasicInfoSection from './sections/DockingBasicInfoSection';
import { DockingPortsSection } from './sections/DockingPortsSection';
import DockingExtrasSection from './sections/DockingExtrasSection';
import GallerySection from '../shared/gallery/GallerySection';

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
	{
		key: 'gallery',
		label: 'Galería',
		icon: 'HeroPhoto',
		component: GallerySection,
	},
];

const DOCKING_SECTION_FIELDS: Record<string, ReviewFieldName<DockingFormData>[]> = {
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
		'loose_ports_count',
		'loose_port_types',
		'defective_port_types',
	],
	extras: [
		'has_wifi',
		'includes_power_adapter',
		'cover_condition',
		'lock_area_condition',
		'observations',
	],
};

/** `extra_attributes` siempre viaja como objeto: `null`/`undefined` rompen el render y el cast. */
const withExtraAttributes = (values: DockingFormData): DockingFormData => ({
	...values,
	extra_attributes: values.extra_attributes ?? {},
});

// ─── Props ────────────────────────────────────────────────────────────────────
interface DockingFormProps {
	defaultValues?: Partial<DockingFormData>;
	onSubmit: (data: DockingFormData) => Promise<void>;
	onBack: () => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
	/** Called when user navigates between form sections */
	onStepChange?: (direction: 'next' | 'prev') => void;
	/** Guarda el borrador aunque la validación bloquee el avance de sección (ZF-102). */
	onPersistDraft?: () => Promise<void> | void;
	/** Registers a getter for current form values (used by auto-save) */
	registerGetFormValues?: (getter: () => Record<string, unknown>) => void;
	/** Whether auto-save is in progress */
	isSaving?: boolean;
	/** Initial section key to jump to on first mount */
	initialSectionKey?: string;
	/** Metadata publicada por el endpoint de reglas para este tipo de equipo. */
	schemaFields?: ITechnicalReviewSchema;
}

const DockingForm: React.FC<DockingFormProps> = ({
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
	const { sectionProps, validateStep, validateAll } = useReviewForm<DockingFormData>({
		schema: dockingSchema,
		initialValues: (defaultValues ?? {}) as DockingFormData,
		sectionFields: DOCKING_SECTION_FIELDS,
		readOnly,
		schemaFields,
		registerGetFormValues,
		prepareReset: withExtraAttributes,
	});

	const handleFinish = useCallback(async () => {
		const result = await validateAll();
		if (!result.isValid) {
			toast.error(formatFinishErrors(result.messages));
			return;
		}
		try {
			await onSubmit(withExtraAttributes(result.data));
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Error al guardar la revisión de Docking';
			toast.error(message);
		}
	}, [validateAll, onSubmit]);

	return (
		<FormShell<DockingFormData>
			sections={DOCKING_SECTIONS}
			sectionProps={sectionProps}
			onBack={onBack}
			onFinish={handleFinish}
			isSubmitting={isSubmitting}
			onStepChange={onStepChange}
			onPersistDraft={onPersistDraft}
			onValidateStep={validateStep}
			isSaving={isSaving}
			initialSectionKey={initialSectionKey}
		/>
	);
};

export default DockingForm;
