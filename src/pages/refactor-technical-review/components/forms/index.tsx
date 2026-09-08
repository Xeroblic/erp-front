/**
 * Equipment Form Router
 * Renders the correct form based on equipmentType.
 * Each form is completely isolated with its own sections, constants, and validation.
 */
import React from 'react';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import NotebookForm from './notebook/NotebookForm';
import DesktopForm from './desktop/DesktopForm';
import AioForm from './aio/AioForm';
import DockingForm from './docking/DockingForm';
import MonitorForm from './monitor/MonitorForm';

interface EquipmentFormRouterProps {
	equipmentType: string;
	defaultValues?: Record<string, unknown>;
	onSubmit: (data: Record<string, unknown>) => Promise<void>;
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
	/** Initial section key to jump to on first mount (e.g. 'gallery' shortcut) */
	initialSectionKey?: string;
	schemaFields?: ITechnicalReviewSchema;
	schemaLoading?: boolean;
	schemaError?: string | null;
	onRetrySchema?: () => void;
}

const EquipmentFormRouter: React.FC<EquipmentFormRouterProps> = ({
	equipmentType,
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
	schemaLoading = false,
	schemaError,
	onRetrySchema,
}) => {
	const type = equipmentType.toLowerCase();

	const formProps = {
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
	};

	// ZF-98 llevó los campos del schema a los cinco tipos, así que el aviso de carga y el
	// reintento dejan de ser exclusivos de notebook y desktop.
	const schemaStatus = (schemaLoading || schemaError) && (
		<div
			className='mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'
			role='status'>
			{schemaLoading && 'Cargando las reglas actuales del formulario…'}
			{schemaError && (
				<div className='flex items-center justify-between gap-3'>
					<span>{schemaError}</span>
					<button type='button' className='underline' onClick={onRetrySchema}>
						Reintentar
					</button>
				</div>
			)}
		</div>
	);

	switch (type) {
		case 'notebook':
			return (
				<>
					{schemaStatus}
					<NotebookForm {...formProps} />
				</>
			);

		case 'desktop':
			return (
				<>
					{schemaStatus}
					<DesktopForm {...formProps} />
				</>
			);

		case 'aio':
		case 'all-in-one':
			return (
				<>
					{schemaStatus}
					<AioForm {...formProps} />
				</>
			);

		case 'docking':
			return (
				<>
					{schemaStatus}
					<DockingForm {...formProps} />
				</>
			);

		case 'monitor':
			return (
				<>
					{schemaStatus}
					<MonitorForm {...formProps} />
				</>
			);

		default:
			return (
				<div className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-700 dark:bg-zinc-900/50'>
					<p className='text-sm text-zinc-500'>
						Formulario para <strong>{equipmentType}</strong> aún no disponible.
					</p>
				</div>
			);
	}
};

export default EquipmentFormRouter;
