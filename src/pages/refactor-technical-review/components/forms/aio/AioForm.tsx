import React, { useEffect } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { aioSchema, AioFormData } from '../../validation/aio.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps } from '../shared/types';
import {
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_STAND_CONDITIONS,
	ALLOWED_COVER_CONDITIONS,
	ALLOWED_CHARGER_STATUSES,
} from '../../validation/constants/aio.rules';

// Sections
import AioBasicInfoSection from './sections/AioBasicInfoSection';
import AioHardwareSection from './sections/AioHardwareSection';
import AioScreenSection from './sections/AioScreenSection';
import AioPortsSection from './sections/AioPortsSection';
import AioAccessoriesSection from './sections/AioAccessoriesSection';
import AioObservationsSection from './sections/AioObservationsSection';

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
];

const AIO_SECTION_FIELDS: Record<string, FieldPath<AioFormData>[]> = {
	'basic-info': ['brand', 'model', 'general_condition'],
	hardware: [
		'processor',
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
	],
	accessories: ['includes_power_adapter', 'charger_status'],
	observations: ['operating_system', 'has_wifi', 'has_bluetooth', 'has_cd_drive', 'observations'],
};

interface AioFormProps {
	defaultValues?: Record<string, unknown>;
	onSubmit: (data: Record<string, unknown>) => Promise<void>;
	onBack: () => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
	onStepChange?: (direction: 'next' | 'prev') => void;
	registerGetFormValues?: (getter: () => Record<string, unknown>) => void;
	isSaving?: boolean;
}

const AioForm: React.FC<AioFormProps> = ({
	defaultValues,
	onSubmit,
	onBack,
	isSubmitting,
	readOnly,
	onStepChange,
	registerGetFormValues,
	isSaving,
}) => {
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
	} = useForm<AioFormData>({
		resolver: yupResolver(
			aioSchema,
		) as unknown as import('react-hook-form').Resolver<AioFormData>,
		defaultValues: (defaultValues as unknown as AioFormData) || {},
		mode: 'onChange',
	});

	// Register getter for AutoSave integration
	useEffect(() => {
		if (registerGetFormValues) {
			registerGetFormValues(getValues);
		}
	}, [registerGetFormValues, getValues]);

	// Deep reset handling on external change
	const prevDefaultValues = React.useRef<string | null>(null);
	useEffect(() => {
		if (defaultValues) {
			const stringified = JSON.stringify(defaultValues);
			if (stringified !== prevDefaultValues.current) {
				reset(defaultValues as unknown as AioFormData);
				prevDefaultValues.current = stringified;
			}
		}
	}, [defaultValues, reset]);

	// Auto-cleanup for strict typing mismatches on load
	useEffect(() => {
		const currentScreen = watch('screen_condition');
		if (
			currentScreen &&
			!ALLOWED_SCREEN_CONDITIONS.includes(
				currentScreen as unknown as (typeof ALLOWED_SCREEN_CONDITIONS)[number],
			)
		) {
			console.warn('[AutoFix] Resetting invalid AIO screen_condition:', currentScreen);
			setValue('screen_condition', undefined as unknown as AioFormData['screen_condition'], {
				shouldValidate: true,
			});
		}

		const currentStand = watch('stand_condition');
		if (
			currentStand &&
			!ALLOWED_STAND_CONDITIONS.includes(
				currentStand as unknown as (typeof ALLOWED_STAND_CONDITIONS)[number],
			)
		) {
			console.warn('[AutoFix] Resetting invalid AIO stand_condition:', currentStand);
			setValue('stand_condition', undefined as unknown as AioFormData['stand_condition'], {
				shouldValidate: true,
			});
		}

		const currentCover = watch('cover_condition');
		if (
			currentCover &&
			!ALLOWED_COVER_CONDITIONS.includes(
				currentCover as unknown as (typeof ALLOWED_COVER_CONDITIONS)[number],
			)
		) {
			setValue('cover_condition', undefined as unknown as AioFormData['cover_condition'], {
				shouldValidate: true,
			});
		}

		const currentCharger = watch('charger_status');
		if (
			currentCharger &&
			!ALLOWED_CHARGER_STATUSES.includes(
				currentCharger as unknown as (typeof ALLOWED_CHARGER_STATUSES)[number],
			)
		) {
			setValue('charger_status', undefined as unknown as AioFormData['charger_status'], {
				shouldValidate: true,
			});
		}
	}, [watch, setValue]);

	const sectionProps = {
		control,
		errors,
		readOnly: !!readOnly,
		watch,
		setValue,
		getValues,
		onDirectSubmit: (partialData: Partial<AioFormData>) => {
			const currentData = getValues();
			const payload = { ...currentData, ...partialData } as AioFormData;
			onSubmit(payload as unknown as Record<string, unknown>);
		},
	};

	const validateStep = async (sectionKey: string) => {
		const stepFields = AIO_SECTION_FIELDS[sectionKey] ?? [];
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
					await onSubmit(data as unknown as Record<string, unknown>);
				} catch (error: unknown) {
					const message =
						error instanceof Error ? error.message : 'Error al guardar la revisión AIO';
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
		<FormShell<AioFormData>
			sections={AIO_SECTIONS}
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

export default AioForm;
