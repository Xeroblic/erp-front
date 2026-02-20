/**
 * Equipment Form Router
 * Renders the correct form based on equipmentType.
 * Each form is completely isolated with its own sections, constants, and validation.
 */
import React from 'react';
import NotebookForm from './notebook/NotebookForm';
import DesktopForm from './desktop/DesktopForm';
import AioForm from './aio/AioForm';

interface EquipmentFormRouterProps {
	equipmentType: string;
	defaultValues?: Record<string, unknown>;
	onSubmit: (data: Record<string, unknown>) => Promise<void>;
	onBack: () => void;
	isSubmitting?: boolean;
	readOnly?: boolean;
	/** Called when user navigates between form sections */
	onStepChange?: (direction: 'next' | 'prev') => void;
	/** Registers a getter for current form values (used by auto-save) */
	registerGetFormValues?: (getter: () => Record<string, unknown>) => void;
	/** Whether auto-save is in progress */
	isSaving?: boolean;
}

const EquipmentFormRouter: React.FC<EquipmentFormRouterProps> = ({
	equipmentType,
	defaultValues,
	onSubmit,
	onBack,
	isSubmitting,
	readOnly,
	onStepChange,
	registerGetFormValues,
	isSaving,
}) => {
	const type = equipmentType.toLowerCase();

	const formProps = {
		defaultValues,
		onSubmit,
		onBack,
		isSubmitting,
		readOnly,
		onStepChange,
		registerGetFormValues,
		isSaving,
	};

	switch (type) {
		case 'notebook':
			return <NotebookForm {...formProps} />;

		case 'desktop':
			return <DesktopForm {...formProps} />;

		case 'aio':
		case 'all-in-one':
			return <AioForm {...formProps} />;

		// case 'monitor':
		//   return <MonitorForm {...formProps} />;
		// case 'docking':
		//   return <DockingForm {...formProps} />;

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
