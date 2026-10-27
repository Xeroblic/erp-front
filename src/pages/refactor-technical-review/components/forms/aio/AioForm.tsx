import React, { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { aioSchema, AioFormData } from '../../validation/aio.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps, ReviewFieldName } from '../shared/types';
import { formatFinishErrors, useReviewForm } from '../shared/useReviewForm';
import {
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_STAND_CONDITIONS,
	ALLOWED_COVER_CONDITIONS,
	ALLOWED_CHARGER_STATUSES,
} from '../../validation/constants/aio.rules';

// Sections
import AioBasicInfoSection from './sections/AioBasicInfoSection';
import AioHardwareSection from './sections/AioHardwareSection';
import { AioScreenSection } from './sections/AioScreenSection';
import { AioPortsSection } from './sections/AioPortsSection';
import { AioAccessoriesSection } from './sections/AioAccessoriesSection';
import { AioObservationsSection } from './sections/AioObservationsSection';
import GallerySection from '../shared/gallery/GallerySection';
import {
	isScreenCounterBelowMinimum,
	needsScreenCounterNormalization,
} from '../../utils/screenCounters';

const AIO_SECTIONS: SectionConfig<AioFormData>[] = [
	{
		key: 'basic-info',
		label: 'Info Básica',
		icon: 'HeroInformationCircle',
		component: AioBasicInfoSection as unknown as React.FC<FormSectionProps<AioFormData>>,
	},
	{
		key: 'hardware',
		label: 'Hardware',
		icon: 'HeroCpuChip',
		component: AioHardwareSection as unknown as React.FC<FormSectionProps<AioFormData>>,
	},
	{
		key: 'screen',
		label: 'Pantalla & Base',
		icon: 'HeroComputerDesktop',
		component: AioScreenSection as unknown as React.FC<FormSectionProps<AioFormData>>,
	},
	{
		key: 'ports',
		label: 'Puertos',
		icon: 'HeroServerStack',
		component: AioPortsSection as unknown as React.FC<FormSectionProps<AioFormData>>,
	},
	{
		key: 'accessories',
		label: 'Accesorios',
		icon: 'HeroBolt',
		component: AioAccessoriesSection as unknown as React.FC<FormSectionProps<AioFormData>>,
	},
	{
		key: 'observations',
		label: 'SO & Obs.',
		icon: 'HeroDocumentText',
		component: AioObservationsSection as unknown as React.FC<FormSectionProps<AioFormData>>,
	},
	{
		key: 'gallery',
		label: 'Galería',
		icon: 'HeroPhoto',
		component: GallerySection,
	},
];

const AIO_SECTION_FIELDS: Record<string, ReviewFieldName<AioFormData>[]> = {
	'basic-info': ['brand', 'model', 'line', 'general_condition'],
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
	screen: [
		'screen_inches',
		'is_touchscreen',
		'screen_condition',
		'dead_pixels_count',
		'stand_condition',
		'cover_condition',
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
	accessories: ['includes_power_adapter', 'charger_status'],
	observations: ['operating_system', 'has_wifi', 'has_bluetooth', 'has_cd_drive', 'observations'],
};

/** Valores fuera de las listas permitidas, heredados de versiones anteriores del schema. */
const LEGACY_CHECKS: [keyof AioFormData, readonly string[]][] = [
	['screen_condition', ALLOWED_SCREEN_CONDITIONS],
	['stand_condition', ALLOWED_STAND_CONDITIONS],
	['cover_condition', ALLOWED_COVER_CONDITIONS],
	['charger_status', ALLOWED_CHARGER_STATUSES],
];

/** Limpia esos valores al cargar para que no bloqueen la validación ni el guardado. */
const sanitizeLegacyValues = (values: AioFormData): AioFormData => {
	const next: Record<string, unknown> = { ...values };
	LEGACY_CHECKS.forEach(([field, allowed]) => {
		const current = next[field];
		if (typeof current === 'string' && current && !allowed.includes(current)) {
			next[field] = undefined;
		}
	});
	return next as AioFormData;
};

interface AioFormProps {
	defaultValues?: Record<string, unknown>;
	onSubmit: (data: Record<string, unknown>) => Promise<void>;
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
	/** Metadata publicada por el endpoint de reglas para este tipo de equipo. */
	schemaFields?: ITechnicalReviewSchema;
}

const AioForm: React.FC<AioFormProps> = ({
	defaultValues,
	onSubmit,
	onBack,
	isSubmitting,
	readOnly,
	onStepChange,
	onPersistDraft,
	registerGetFormValues,
	isSaving,
	initialSectionKey,
	schemaFields,
}) => {
	const {
		formik: { setFieldTouched },
		values,
		setFieldValue,
		sectionProps: baseSectionProps,
		getValues,
		validateStep,
		validateAll,
	} = useReviewForm<AioFormData>({
		schema: aioSchema,
		initialValues: (defaultValues ?? {}) as unknown as AioFormData,
		sectionFields: AIO_SECTION_FIELDS,
		readOnly: !!readOnly,
		schemaFields,
		registerGetFormValues,
		touchOnChange: true,
		prepareReset: sanitizeLegacyValues,
	});

	// Reconcilia el contador con su condición. Corre en el montaje y en cada cambio de
	// las dos variables observadas (no sólo al cargar): si la condición está inactiva
	// limpia el contador, y si está activa conserva el valor recibido —incluido el 0 de
	// un borrador— pero lo valida de inmediato para que el error se vea sin tener que
	// intentar avanzar de paso.
	const screenCondition = values.screen_condition;
	const deadPixelsCount = values.dead_pixels_count;
	useEffect(() => {
		if (readOnly) return;

		const isDeadPixels = screenCondition === 'dead_pixels';
		if (needsScreenCounterNormalization(isDeadPixels, deadPixelsCount)) {
			setFieldValue('dead_pixels_count', 0, { touch: true });
			return;
		}

		if (isDeadPixels && isScreenCounterBelowMinimum(deadPixelsCount)) {
			void setFieldTouched('dead_pixels_count', true);
		}
	}, [readOnly, screenCondition, deadPixelsCount, setFieldValue, setFieldTouched]);

	const sectionProps: FormSectionProps<AioFormData> = useMemo(
		() => ({
			...baseSectionProps,
			onDirectSubmit: (partialData: Partial<AioFormData>) => {
				const payload = { ...getValues(), ...partialData } as AioFormData;
				void onSubmit(payload as unknown as Record<string, unknown>);
			},
		}),
		[baseSectionProps, getValues, onSubmit],
	);

	const handleFinish = useCallback(async () => {
		const result = await validateAll();
		if (!result.isValid) {
			toast.error(formatFinishErrors(result.messages));
			return;
		}
		try {
			await onSubmit(result.data as unknown as Record<string, unknown>);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Error al guardar la revisión AIO';
			toast.error(message);
		}
	}, [validateAll, onSubmit]);

	return (
		<FormShell<AioFormData>
			sections={AIO_SECTIONS}
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

export default AioForm;
