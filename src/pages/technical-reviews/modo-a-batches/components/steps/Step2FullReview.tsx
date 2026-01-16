/**
 * Step2FullReview - Paso 2: Revisión Técnica Completa
 * Renderiza el formulario específico según el tipo de equipo
 */
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateItemDetails } from '@/store/slices/technicalReviews';
import type {
	EquipmentType,
	UpdateItemDetailsPayload,
} from '@/interface/technicalReviews.interface';
import NotebookForm from '@/pages/technical-reviews/shared/forms/NotebookForm';
import DesktopForm from '@/pages/technical-reviews/shared/forms/DesktopForm';
import AioForm from '@/pages/technical-reviews/shared/forms/AioForm';
import DockingForm from '@/pages/technical-reviews/shared/forms/DockingForm';
import MonitorForm from '@/pages/technical-reviews/shared/forms/MonitorForm';

const COMMON_FIELDS: Array<keyof UpdateItemDetailsPayload> = [
	'brand',
	'model',
	'line',
	'processor',
	'ram_size',
	'ram_slots',
	'ram_type',
	'storage_size',
	'storage_technology',
	'operating_system',
	'general_condition',
	'cover_condition',
	'observations',
	'has_wifi',
	'has_bluetooth',
];

const COMPUTER_ALLOWED_FIELDS: Array<keyof UpdateItemDetailsPayload> = [
	...COMMON_FIELDS,
	'form_factor',
	'has_dedicated_gpu',
	'gpu_model',
	'includes_charger',
	'charger_status',
	'charger_watts',
	'battery_health',
	'screen_size',
	'screen_resolution',
	'screen_type',
	'screen_condition',
	'keyboard_layout',
	'keyboard_condition',
	'touchpad_condition',
	'has_webcam',
	'has_microphone',
	'has_fingerprint_reader',
	'has_cd_drive',
	// Ports
	'usb_a_ports',
	'usb_c_ports',
	'hdmi_ports',
	'displayport_ports',
	'vga_ports',
	'rj45_ports',
	'sd_readers',
	'all_ports_functional',
	'defective_ports_count',
];

const ALLOWED_FIELDS_BY_TYPE: Partial<
	Record<EquipmentType, Array<keyof UpdateItemDetailsPayload>>
> = {
	notebook: COMPUTER_ALLOWED_FIELDS,
	desktop: COMPUTER_ALLOWED_FIELDS,
	aio: COMPUTER_ALLOWED_FIELDS,
};

const sanitizeByEquipmentType = (
	values: Partial<UpdateItemDetailsPayload>,
	equipmentType?: EquipmentType,
): Partial<UpdateItemDetailsPayload> => {
	if (!equipmentType) return values;
	const allowedFields = ALLOWED_FIELDS_BY_TYPE[equipmentType];
	if (!allowedFields) return values;
	const sanitized: Partial<UpdateItemDetailsPayload> = {};
	allowedFields.forEach((field) => {
		if (values[field] !== undefined) {
			sanitized[field] = values[field];
		}
	});
	return sanitized;
};

interface Step2FullReviewProps {
	branchId: number;
	itemId: number;
	equipmentType: EquipmentType;
	initialValues?: Partial<UpdateItemDetailsPayload>;
	onBack: () => void;
	onComplete: () => void;
	onFieldChange?: (data: UpdateItemDetailsPayload) => void; // Callback para auto-save
	onItemUpdate?: (updatedItem: any) => void; // Callback cuando se actualiza el item
	isDirty?: boolean;
	isSaving?: boolean;
	lastSaved?: Date | null;
}

const Step2FullReview: React.FC<Step2FullReviewProps> = ({
	branchId,
	itemId,
	equipmentType,
	initialValues = {},
	onBack,
	onComplete,
	onFieldChange, // Nuevo: callback para auto-save
	onItemUpdate, 
}) => {
	const dispatch = useAppDispatch();
	const updating = useAppSelector((s) => s.technicalReviews.updating);

	const [formValues, setFormValues] = useState<Partial<UpdateItemDetailsPayload>>(initialValues);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Sincronizar formValues cuando cambien los initialValues o cuando se monte el componente
	useEffect(() => {
		setFormValues(initialValues);
	}, [initialValues]);




	const isFirstRender = React.useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		if (onFieldChange) {
			onFieldChange(formValues as UpdateItemDetailsPayload);
		}
	}, [formValues]);

	const handleFieldChange = (field: string, value: any) => {
		setFormValues((prev) => ({
			...prev,
			[field]: value,
		}));
		setSaveError(null);
	};

	// Guardar cambios manualmente
	const handleSave = async () => {
		try {
			const updatedItem = await dispatch(
				updateItemDetails({
					branchId,
					itemId,
					data: formValues,
					equipmentType,
				}),
			).unwrap();

			setSaveError(null);

			// Notificar al padre que el item se actualizó
			if (onItemUpdate) {
				onItemUpdate(updatedItem);
			}
		} catch (error: any) {
			setSaveError(error || 'Error al guardar');
		}
	};

	const handleFinalize = async () => {
		try {
			// Primero guardar cualquier cambio pendiente
			const updatedItem = await dispatch(
				updateItemDetails({
					branchId,
					itemId,
					data: formValues,
					equipmentType,
				}),
			).unwrap();

			if (onItemUpdate) {
				onItemUpdate(updatedItem);
			}

			onComplete();
		} catch (error: any) {
			setSaveError(error || 'Error al finalizar revisión');
		}
	};

	const getRequiredFieldsMessage = () => {
		switch (equipmentType) {
			case 'notebook':
			case 'desktop':
			case 'aio':
				return 'Marca, Modelo, Procesador, RAM y Almacenamiento';
			case 'docking':
				return 'Marca y Modelo';
			case 'monitor':
				return 'Marca y Modelo';
			default:
				return 'Marca y Modelo';
		}
	};

	const isFormValid = () => {
		let required: string[] = [];

		switch (equipmentType) {
			case 'notebook':
				required = ['brand', 'model', 'processor', 'ram_size', 'storage_size'];
				break;
			case 'desktop':
				required = ['brand', 'model', 'processor', 'ram_size', 'storage_size'];
				break;
			case 'aio':
				required = ['brand', 'model', 'processor', 'ram_size', 'storage_size'];
				break;
			case 'docking':
				required = ['brand', 'model'];
				break;
			case 'monitor':
				required = ['brand', 'model'];
				break;
			default:
				required = ['brand', 'model'];
		}

		return required.every((field) => {
			const value = formValues[field as keyof UpdateItemDetailsPayload];
			return value !== undefined && value !== null && value !== '';
		});
	};

	// Renderizar el formulario según el tipo
	const renderForm = () => {
		switch (equipmentType) {
			case 'notebook':
				return (
					<NotebookForm
						branchId={branchId}
						values={formValues}
						onChange={handleFieldChange}
						onFinalize={handleFinalize}
						onBack={onBack}
						isUpdating={updating}
						isFormValid={isFormValid()}
					/>
				);

			case 'desktop':
				return (
					<DesktopForm
					branchId={branchId}
					values={formValues}
					onChange={handleFieldChange}
				/>
				);

			case 'aio':
				return (
					<AioForm
					branchId={branchId}
					values={formValues}
					onChange={handleFieldChange}
				/>
				);

			case 'docking':
				return (
					<DockingForm
					branchId={branchId}
					values={formValues}
					onChange={handleFieldChange}
				/>
				);

			case 'monitor':
				return (
					<MonitorForm
					branchId={branchId}
					values={formValues}
					onChange={handleFieldChange}
				/>
				);

			default:
				return null;
		}
	};

	return (
		<div className='space-y-6'>
			{/* Header con info */}
		

			{/* Error */}
			{saveError && (
				<Card className='border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'>
					<CardBody className='p-4'>
						<div className='flex gap-3'>
							<Icon
								icon='HeroExclamationCircle'
								className='h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400'
							/>
							<div>
								<h4 className='font-semibold text-red-900 dark:text-red-100'>
									Error al guardar
								</h4>
								<p className='mt-1 text-sm text-red-800 dark:text-red-200'>
									{saveError}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Formulario específico del tipo */}
			{renderForm()}

			{/* Validación pendiente */}
			{!isFormValid() && (
				<Card className='border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'>
					<CardBody className='p-4'>
						<div className='flex gap-3'>
							<Icon
								icon='HeroExclamationTriangle'
								className='h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400'
							/>
							<div>
								<h4 className='font-semibold text-yellow-900 dark:text-yellow-100'>
									Campos requeridos pendientes
								</h4>
								<p className='mt-1 text-sm text-yellow-800 dark:text-yellow-200'>
									Asegúrate de completar: {getRequiredFieldsMessage()} antes de
									finalizar.
								</p>
							</div>
						</div>
					</CardBody>
				</Card>
			)}

		{/* Botones de acción */}
		<div className='flex justify-between gap-3 mt-6'>
			<Button variant='outline' onClick={onBack} isDisable={updating}>
				<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
				Volver
			</Button>

			<div className='flex gap-3'>
				<Button variant='outline' onClick={handleSave} isDisable={updating}>
					<Icon icon='HeroDocumentArrowDown' className='mr-2 h-4 w-4' />
					{updating ? 'Guardando...' : 'Guardar'}
				</Button>

				<Button
					variant='solid'
					color={updating ? 'blue' : 'emerald'}
					onClick={handleFinalize}
					isDisable={updating || !isFormValid()}>
					{updating ? 'Procesando...' : 'Finalizar Revisión'}
					<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4 text-white' />
				</Button>
			</div>
		</div>
	</div>
);
};

export default Step2FullReview;
