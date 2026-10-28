import React, { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { monitorSchema, type MonitorFormData } from '../../validation/monitor.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps, ReviewFieldName } from '../shared/types';
import { formatFinishErrors, useReviewForm } from '../shared/useReviewForm';

// ─── Section Components ──────────────────────────────────────────────────────
import MonitorBasicInfoSection from './sections/MonitorBasicInfoSection';
import MonitorScreenSection from './sections/MonitorScreenSection';
import { MonitorPortsSection } from './sections/MonitorPortsSection';
import MonitorAccessoriesSection from './sections/MonitorAccessoriesSection';
import Observations from './sections/Observations';
import GallerySection from '../shared/gallery/GallerySection';
import {
	isScreenCounterBelowMinimum,
	needsScreenCounterNormalization,
} from '../../utils/screenCounters';

// ─── Section Order ─────────────────────────
const MONITOR_SECTIONS: SectionConfig<MonitorFormData>[] = [
	{
		key: 'basic-info',
		label: 'Info Básica',
		icon: 'HeroInformationCircle',
		component: MonitorBasicInfoSection,
	},
	{
		key: 'screen',
		label: 'Pantalla & Físico',
		icon: 'HeroTv',
		component: MonitorScreenSection,
	},
	{
		key: 'ports',
		label: 'Puertos & Conectividad',
		icon: 'HeroServerStack',
		component: MonitorPortsSection,
	},

	{
		key: 'accessories',
		label: 'Accesorios',
		icon: 'HeroSparkles',
		component: MonitorAccessoriesSection,
	},
	{
		key: 'observations',
		label: 'Obs.',
		icon: 'HeroDocumentText',
		component: Observations,
	},
	{
		key: 'gallery',
		label: 'Galería',
		icon: 'HeroPhoto',
		component: GallerySection,
	},
];

const MONITOR_SECTION_FIELDS: Record<string, ReviewFieldName<MonitorFormData>[]> = {
	'basic-info': ['brand', 'model', 'line', 'general_condition'],
	screen: [
		'screen_inches',
		'screen_resolution',
		'is_touchscreen',
		'screen_condition',
		'spots_count',
		'dead_pixels_count',
		'stand_condition',
		'frame_condition',
	],
	ports: [
		'has_usb_hub',
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'dvi_ports',
		'usb_a_ports',
		'usb_c_ports',
		'sd_readers',
		'rj45_ports',
		'charging_ports',
		'all_ports_functional',
		'defective_ports_count',
		'defective_ports_critical_count',
		'loose_ports_count',
		'loose_port_types',
		'defective_port_types',
	],
	accessories: ['includes_power_cable', 'includes_video_cable', 'includes_stand'],
};

export interface MonitorFormProps {
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

const MonitorForm: React.FC<MonitorFormProps> = ({
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
	const normalizedDefaultValues = useMemo(() => {
		if (!defaultValues) return {} as MonitorFormData;

		const values = { ...defaultValues } as Record<string, unknown>;
		// `usb_hub_ports` y `type_c_ports` se renombraron a `usb_a_ports` y `usb_c_ports`,
		// y la migración del backend arrastró los datos guardados. La carga sólo cubre lo
		// que ya estuviera hidratado con los nombres viejos —una respuesta en caché, una
		// pestaña abierta desde antes del despliegue— para no mostrar el contador en cero.
		if (values.usb_a_ports == null && values.usb_hub_ports != null) {
			values.usb_a_ports = values.usb_hub_ports;
		}
		if (values.usb_c_ports == null && values.type_c_ports != null) {
			values.usb_c_ports = values.type_c_ports;
		}
		delete values.usb_hub_ports;
		delete values.type_c_ports;

		return values as unknown as MonitorFormData;
	}, [defaultValues]);

	const {
		formik: { setFieldTouched },
		values,
		setFieldValue,
		sectionProps: baseSectionProps,
		getValues,
		validateStep,
		validateAll,
	} = useReviewForm<MonitorFormData>({
		schema: monitorSchema,
		initialValues: normalizedDefaultValues,
		sectionFields: MONITOR_SECTION_FIELDS,
		readOnly: !!readOnly,
		schemaFields,
		registerGetFormValues,
		touchOnChange: true,
	});

	// Reconcilia los contadores con su condición. Corre en el montaje y en cada cambio
	// de las tres variables observadas (no sólo al cargar): si la condición está
	// inactiva limpia el contador, y si está activa conserva el valor recibido
	// —incluido el 0 de un borrador— pero lo valida de inmediato para que el error se
	// vea sin tener que intentar avanzar de paso.
	const screenCondition = values.screen_condition;
	const spotsCount = values.spots_count;
	const deadPixelsCount = values.dead_pixels_count;
	useEffect(() => {
		if (readOnly) return;

		const isSpots = screenCondition === 'spots';
		if (needsScreenCounterNormalization(isSpots, spotsCount)) {
			setFieldValue('spots_count', 0, { touch: true });
		} else if (isSpots && isScreenCounterBelowMinimum(spotsCount)) {
			void setFieldTouched('spots_count', true);
		}

		const isDeadPixels = screenCondition === 'dead_pixels';
		if (needsScreenCounterNormalization(isDeadPixels, deadPixelsCount)) {
			setFieldValue('dead_pixels_count', 0, { touch: true });
		} else if (isDeadPixels && isScreenCounterBelowMinimum(deadPixelsCount)) {
			void setFieldTouched('dead_pixels_count', true);
		}
	}, [readOnly, screenCondition, spotsCount, deadPixelsCount, setFieldValue, setFieldTouched]);

	const sectionProps: FormSectionProps<MonitorFormData> = useMemo(
		() => ({
			...baseSectionProps,
			onDirectSubmit: (partialData: Partial<MonitorFormData>) => {
				const payload = { ...getValues(), ...partialData };
				void onSubmit(payload);
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
			const finalData = { ...result.data } as Record<string, unknown>;
			if (
				!finalData.extra_attributes ||
				Object.keys(finalData.extra_attributes).length === 0
			) {
				finalData.extra_attributes = {};
			}
			await onSubmit(finalData);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Error al guardar la revisión';
			toast.error(message);
		}
	}, [validateAll, onSubmit]);

	return (
		<FormShell<MonitorFormData>
			sections={MONITOR_SECTIONS}
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

export default MonitorForm;
