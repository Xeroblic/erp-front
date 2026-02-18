/**
 * NotebookForm.tsx
 * Orchestrator for the Notebook technical review form.
 * Composes 9 sections in the FormShell with Yup validation.
 *
 * ✏️ To reorder sections → just reorder NOTEBOOK_SECTIONS below.
 * ✏️ To add a section → create a new component in sections/ and add it here.
 */
import React, { useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import { notebookSchema, type NotebookFormData } from '../../validation/notebook.schema';
import FormShell from '../shared/FormShell';
import type { SectionConfig, FormSectionProps } from '../shared/types';

// ─── Section Components ──────────────────────────────────────────────────────
import BasicInfoSection from './sections/BasicInfoSection';
import HardwareSection from './sections/HardwareSection';
import PowerSection from './sections/PowerSection';
import PortsSection from './sections/PortsSection';
import ScreenSection from './sections/ScreenSection';
import InputSection from './sections/InputSection';
import AestheticsSection from './sections/AestheticsSection';
import SoftwareSection from './sections/SoftwareSection';
import ObservationsSection from './sections/ObservationsSection';

// ─── Section Order (edit this array to reorder steps) ─────────────────────────
const NOTEBOOK_SECTIONS: SectionConfig<NotebookFormData>[] = [
	{
		key: 'basic-info',
		label: 'Info Básica',
		icon: 'HeroInformationCircle',
		component: BasicInfoSection,
	},
	{
		key: 'hardware',
		label: 'Hardware',
		icon: 'HeroCpuChip',
		component: HardwareSection,
	},
	{
		key: 'power',
		label: 'Energía',
		icon: 'HeroBolt',
		component: PowerSection,
	},
	{
		key: 'ports',
		label: 'Puertos',
		icon: 'HeroServerStack',
		component: PortsSection,
	},
	{
		key: 'screen',
		label: 'Pantalla',
		icon: 'HeroComputerDesktop',
		component: ScreenSection,
	},
	{
		key: 'input',
		label: 'Entrada',
		icon: 'HeroHandRaised',
		component: InputSection,
	},
	{
		key: 'aesthetics',
		label: 'Estética',
		icon: 'HeroSparkles',
		component: AestheticsSection,
	},
	{
		key: 'software',
		label: 'SO',
		icon: 'HeroCommandLine',
		component: SoftwareSection,
	},
	{
		key: 'observations',
		label: 'Observaciones',
		icon: 'HeroDocumentText',
		component: ObservationsSection,
	},
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface NotebookFormProps {
	defaultValues?: Partial<NotebookFormData>;
	onSubmit: (data: NotebookFormData) => Promise<void>;
	onBack: () => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
}

const NotebookForm: React.FC<NotebookFormProps> = ({
	defaultValues,
	onSubmit,
	onBack,
	isSubmitting = false,
	readOnly = false,
}) => {
	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<NotebookFormData>({
		resolver: yupResolver(notebookSchema) as unknown as Resolver<NotebookFormData>,
		defaultValues: defaultValues || {},
		mode: 'onBlur',
	});

	// Assemble props passed to every section
	const sectionProps: FormSectionProps<NotebookFormData> = useMemo(
		() => ({
			control,
			errors,
			readOnly,
			watch,
			setValue,
		}),
		[control, errors, readOnly, watch, setValue],
	);

	// Handle finish
	const handleFinish = () => {
		handleSubmit(
			async (data) => {
				try {
					await onSubmit(data);
				} catch (error: unknown) {
					const message =
						error instanceof Error ? error.message : 'Error al guardar la revisión';
					console.error('NotebookForm submit error:', error);
					toast.error(message);
				}
			},
			(validationErrors) => {
				// Collect all validation error messages
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
		<FormShell<NotebookFormData>
			sections={NOTEBOOK_SECTIONS}
			sectionProps={sectionProps}
			onBack={onBack}
			onFinish={handleFinish}
			isSubmitting={isSubmitting}
		/>
	);
};

export default NotebookForm;
