import React, { useMemo, useEffect, useRef } from 'react';
import { useForm, type FieldPath, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { monitorSchema, type MonitorFormData } from '../../validation/monitor.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps } from '../shared/types';
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_STAND_CONDITIONS,
	ALLOWED_FRAME_CONDITIONS,
} from '../../constants/monitor/monitor.rules';

// ─── Section Components ──────────────────────────────────────────────────────
import MonitorBasicInfoSection from './sections/MonitorBasicInfoSection';
import MonitorScreenSection from './sections/MonitorScreenSection';
import MonitorPortsSection from './sections/MonitorPortsSection';
import MonitorAccessoriesSection from './sections/MonitorAccessoriesSection';
import Observations from './sections/Observations';

// ─── Section Order ─────────────────────────
const MONITOR_SECTIONS: SectionConfig<MonitorFormData>[] = [
	{
		key: 'basic-info',
		label: 'Info Básica',
		icon: 'HeroInformationCircle',
		component: MonitorBasicInfoSection as unknown as React.FC<
			FormSectionProps<MonitorFormData>
		>,
	},
	{
		key: 'screen',
		label: 'Pantalla & Físico',
		icon: 'HeroTv',
		component: MonitorScreenSection as unknown as React.FC<FormSectionProps<MonitorFormData>>,
	},
	{
		key: 'ports',
		label: 'Puertos & Conectividad',
		icon: 'HeroServerStack',
		component: MonitorPortsSection as unknown as React.FC<FormSectionProps<MonitorFormData>>,
	},

	{
		key: 'accessories',
		label: 'Accesorios',
		icon: 'HeroSparkles',
		component: MonitorAccessoriesSection as unknown as React.FC<
			FormSectionProps<MonitorFormData>
		>,
	},
	{
		key: 'observations',
		label: 'Obs.',
		icon: 'HeroDocumentText',
		component: Observations as unknown as React.FC<FormSectionProps<MonitorFormData>>,
	},
];

const MONITOR_SECTION_FIELDS: Record<string, FieldPath<MonitorFormData>[]> = {
	'basic-info': ['brand', 'model', 'line', 'general_condition'],
	screen: [
		'screen_inches',
		'screen_resolution',
		'is_touchscreen',
		'screen_condition',
		'spots_count',
		'stand_condition',
		'frame_condition',
	],
	ports: [
		'has_usb_hub',
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'dvi_ports',
		'type_c_ports',
		'rj45_ports',
		'usb_hub_ports',
		'all_ports_functional',
		'defective_ports_count',
		'defective_ports_critical_count',
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
	registerGetFormValues?: (getter: () => Record<string, unknown>) => void;
	isSaving?: boolean;
}

const MonitorForm: React.FC<MonitorFormProps> = ({
	defaultValues,
	onSubmit,
	onBack,
	isSubmitting,
	readOnly,
	onStepChange,
	registerGetFormValues,
	isSaving,
}) => {
	const normalizedDefaultValues = useMemo(() => {
		if (!defaultValues) return {} as MonitorFormData;

		const values = { ...defaultValues } as Record<string, unknown>;
		// Legacy compatibility: some historical records persisted usb_c_ports only.
		if (values.type_c_ports == null && values.usb_c_ports != null) {
			values.type_c_ports = values.usb_c_ports;
		}

		return values as unknown as MonitorFormData;
	}, [defaultValues]);

	// ─── RHF Setup ─────────────────────────────────────────────────────────
	const {
		control,
		handleSubmit,
		formState: { errors },
		getValues,
		reset,
		watch,
		setValue,
		trigger,
		getFieldState,
	} = useForm<MonitorFormData>({
		resolver: yupResolver(
			monitorSchema,
		) as unknown as import('react-hook-form').Resolver<MonitorFormData>,
		defaultValues: normalizedDefaultValues,
		mode: 'onChange',
	});

	// Register getter for AutoSave integration
	useEffect(() => {
		if (registerGetFormValues) {
			registerGetFormValues(getValues);
		}
	}, [registerGetFormValues, getValues]);

	// Deep reset handling on external change
	const prevDefaultValues = useRef<string | null>(null);
	useEffect(() => {
		if (Object.keys(normalizedDefaultValues).length > 0) {
			const stringified = JSON.stringify(normalizedDefaultValues);
			if (stringified !== prevDefaultValues.current) {
				reset(normalizedDefaultValues);
				prevDefaultValues.current = stringified;
			}
		}
	}, [normalizedDefaultValues, reset]);

	const sectionProps = {
		control,
		errors,
		readOnly: !!readOnly,
		watch,
		setValue,
		getValues,
	};

	const validateStep = async (sectionKey: string) => {
		const stepFields = MONITOR_SECTION_FIELDS[sectionKey] ?? [];
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
					const finalData = { ...data } as Record<string, unknown>;
					const resolvedTypeCPorts = finalData.type_c_ports ?? finalData.usb_c_ports;
					finalData.type_c_ports = resolvedTypeCPorts;
					// Keep alias synced to prevent divergence in intermediate layers.
					finalData.usb_c_ports = resolvedTypeCPorts;
					if (
						!finalData.extra_attributes ||
						Object.keys(finalData.extra_attributes).length === 0
					) {
						finalData.extra_attributes = {};
					}
					await onSubmit(finalData as unknown as Record<string, unknown>);
				} catch (error: unknown) {
					const message =
						error instanceof Error ? error.message : 'Error al guardar la revisión';
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
		<FormShell<MonitorFormData>
			sections={MONITOR_SECTIONS}
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

export default MonitorForm;
