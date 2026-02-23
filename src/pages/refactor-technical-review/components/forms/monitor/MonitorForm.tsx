import React, { useMemo, useEffect, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
];

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
	// ─── RHF Setup ─────────────────────────────────────────────────────────
	const {
		control,
		handleSubmit,
		formState: { errors },
		getValues,
		reset,
		watch,
		setValue,
	} = useForm<MonitorFormData>({
		resolver: yupResolver(
			monitorSchema,
		) as unknown as import('react-hook-form').Resolver<MonitorFormData>,
		defaultValues: (defaultValues as unknown as MonitorFormData) || {},
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
		if (defaultValues) {
			const stringified = JSON.stringify(defaultValues);
			if (stringified !== prevDefaultValues.current) {
				reset(defaultValues as unknown as MonitorFormData);
				prevDefaultValues.current = stringified;
			}
		}
	}, [defaultValues, reset]);

	const sectionProps = {
		control,
		errors,
		readOnly: !!readOnly,
		watch,
		setValue,
		getValues,
	};

	const handleFinish = () => {
		handleSubmit(
			async (data) => {
				try {
					const finalData = { ...data };
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
			isSaving={isSaving}
		/>
	);
};

export default MonitorForm;
