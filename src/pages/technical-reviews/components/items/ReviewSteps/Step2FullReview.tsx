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
}

const Step2FullReview: React.FC<Step2FullReviewProps> = ({
	branchId,
	itemId,
	equipmentType,
	initialValues = {},
	onBack,
	onComplete,
}) => {
	const dispatch = useAppDispatch();
	const updating = useAppSelector((s) => s.technicalReviews.updating);

	const [formValues, setFormValues] = useState<Partial<UpdateItemDetailsPayload>>(initialValues);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Sincronizar formValues cuando cambien los initialValues o cuando se monte el componente
	useEffect(() => {
		console.log('🔄 Sincronizando initialValues:', initialValues);
		setFormValues(initialValues);
	}, [initialValues]);

	const handleFieldChange = (field: string, value: any) => {
		setFormValues((prev) => ({
			...prev,
			[field]: value,
		}));
		setSaveError(null);
	};

	// Guardar parcial (sin finalizar revisión)
	const handleSave = async () => {
		try {
			console.log('💾 Guardando formValues:', formValues);
			console.log('📋 Equipment Type:', equipmentType);

			await dispatch(
				updateItemDetails({
					branchId,
					itemId,
					data: formValues,
					equipmentType, // Pasar el tipo de equipo para filtrar campos
				}),
			).unwrap();

			setLastSaved(new Date());
			setSaveError(null);
		} catch (error: any) {
			console.error('❌ Error al guardar:', error);
			setSaveError(error || 'Error al guardar');
		}
	};

	// Finalizar revisión (pasa al paso 3)
	const handleFinalize = async () => {
		try {
			// Primero guardar cualquier cambio pendiente
			await dispatch(
				updateItemDetails({
					branchId,
					itemId,
					data: formValues,
					equipmentType, // Pasar el tipo de equipo para filtrar campos
				}),
			).unwrap();

			// Luego notificar completado (el padre llamará completeReview)
			onComplete();
		} catch (error: any) {
			setSaveError(error || 'Error al finalizar revisión');
		}
	};

	// Obtener mensaje de campos requeridos según tipo de equipo
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

	// Validación básica de campos requeridos según tipo de equipo
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
									Revisión Técnica Completa
								</h4>
								<p className='mt-1 text-sm text-blue-800 dark:text-blue-200'>
									Completa todos los campos requeridos. Puedes guardar
									parcialmente y continuar después.
								</p>
							</div>
						</div>
						{lastSaved && (
							<div className='text-right text-xs text-blue-700 dark:text-blue-300'>
								<Icon icon='HeroCheckCircle' className='mr-1 inline h-4 w-4' />
								Guardado {lastSaved.toLocaleTimeString()}
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
