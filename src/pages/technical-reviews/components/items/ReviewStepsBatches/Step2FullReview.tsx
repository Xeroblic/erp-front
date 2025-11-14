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
import NotebookForm from '../../forms/NotebookForm';
import DesktopForm from '../../forms/DesktopForm';
import AioForm from '../../forms/AioForm';
import DockingForm from '../../forms/DockingForm';
import MonitorForm from '../../forms/MonitorForm';

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
	onItemUpdate, // Nuevo: callback para actualizar item del padre
	isDirty = false,
	isSaving = false,
	lastSaved = null,
}) => {
	const dispatch = useAppDispatch();
	const updating = useAppSelector((s) => s.technicalReviews.updating);

	const [formValues, setFormValues] = useState<Partial<UpdateItemDetailsPayload>>(initialValues);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Sincronizar formValues cuando cambien los initialValues o cuando se monte el componente
	useEffect(() => {
		setFormValues(initialValues);
	}, [initialValues]);

	const handleFieldChange = (field: string, value: any) => {
		const newValues = {
			...formValues,
			[field]: value,
		};
		setFormValues(newValues);
		setSaveError(null);

		// Notificar al padre (usado para auto-save si está habilitado)
		// Si onFieldChange es undefined, solo guardado manual
		if (onFieldChange) {
			onFieldChange(newValues as UpdateItemDetailsPayload);
		}
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
					<AioForm branchId={branchId} values={formValues} onChange={handleFieldChange} />
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
			<Card className='border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'>
				<CardBody className='p-4'>
					<div className='flex items-start justify-between'>
						<div className='flex gap-3'>
							<Icon
								icon='HeroClipboardDocumentCheck'
								className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400'
							/>
							<div>
								<h4 className='font-semibold text-blue-900 dark:text-blue-100'>
									Revisión Técnica Completa batches
								</h4>
								<p className='mt-1 text-sm text-blue-800 dark:text-blue-200'>
									Completa todos los campos técnicos del equipo. Usa el botón
									"Guardar" para persistir los cambios.
								</p>
							</div>
						</div>

						{/* Indicador de estado (solo si auto-save está activado) */}
						{onFieldChange && (
							<div className='text-right text-xs'>
								{isSaving && (
									<div className='text-blue-600 dark:text-blue-400'>
										<Icon
											icon='HeroArrowPath'
											className='mr-1 inline h-4 w-4 animate-spin'
										/>
										Guardando...
									</div>
								)}
								{!isSaving && isDirty && (
									<div className='text-yellow-600 dark:text-yellow-400'>
										<Icon icon='HeroClock' className='mr-1 inline h-4 w-4' />
										Cambios sin guardar
									</div>
								)}
								{!isSaving && !isDirty && lastSaved && (
									<div className='text-green-600 dark:text-green-400'>
										<Icon
											icon='HeroCheckCircle'
											className='mr-1 inline h-4 w-4'
										/>
										Guardado {lastSaved.toLocaleTimeString()}
									</div>
								)}
							</div>
						)}
					</div>
				</CardBody>
			</Card>

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
			<div className='flex justify-between gap-3'>
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
						color='blue'
						onClick={handleFinalize}
						isDisable={updating || !isFormValid()}>
						{updating ? 'Procesando...' : 'Finalizar Revisión'}
						<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default Step2FullReview;
