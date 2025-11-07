/**
 * Step1BasicInfo - Paso 1: Información Básica
 * Permite ingresar serial, seleccionar producto y tipo de equipo
 */
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Checkbox from '@/components/form/Checkbox';
import { useAppDispatch, useAppSelector } from '@/store';
import { createItem, startReview, completeReview } from '@/store/slices/technicalReviews';
import type { EquipmentType } from '@/interface/technicalReviews.interface';

interface Step1BasicInfoProps {
	branchId: number;
	onComplete: (itemId: number, serialNumber: string, equipmentType: EquipmentType) => void;
	onFinishGradeM?: (itemId: number) => void; // ← Callback para finalizar con Grado M
}

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
	branchId,
	onComplete,
	onFinishGradeM,
}) => {
	const dispatch = useAppDispatch();
	const creating = useAppSelector((s) => s.technicalReviews.creating);

	const [serialNumber, setSerialNumber] = useState('');
	const [selectedProduct, setSelectedProduct] = useState<TSelectOption | null>(null);
	const [equipmentType, setEquipmentType] = useState<EquipmentType | null>(null);
	const [doesNotTurnOn, setDoesNotTurnOn] = useState(false); // ← Estado para "No enciende"
	const [isFinishing, setIsFinishing] = useState(false); // ← Estado para finalizar Grado M
	const [error, setError] = useState<string | null>(null);

	// TODO: Integrar con slice de productos global cuando esté disponible
	// Por ahora, productos de ejemplo hardcoded
	const productOptions: TSelectOption[] = [
		{ value: '1', label: 'Notebook HP - Equipos' },
		{ value: '2', label: 'Desktop Dell - Equipos' },
		{ value: '3', label: 'Monitor LG - Periféricos' },
		{ value: '4', label: 'Docking Lenovo - Accesorios' },
	];

	const equipmentTypes: Array<{
		type: EquipmentType;
		label: string;
		icon: string;
		color: string;
	}> = [
		{ type: 'notebook', label: 'Notebook', icon: 'HeroComputerDesktop', color: 'blue' },
		{ type: 'desktop', label: 'Desktop', icon: 'HeroCpuChip', color: 'purple' },
		{ type: 'aio', label: 'All-in-One', icon: 'HeroDeviceTablet', color: 'green' },
		{ type: 'docking', label: 'Docking', icon: 'HeroServerStack', color: 'orange' },
		{ type: 'monitor', label: 'Monitor', icon: 'HeroTv', color: 'pink' },
	];

	const handleSubmit = async () => {
		setError(null);

		// Validación
		if (!serialNumber.trim()) {
			setError('Ingresa un número de serie');
			return;
		}
		if (!selectedProduct) {
			setError('Selecciona un producto');
			return;
		}
		if (!equipmentType) {
			setError('Selecciona un tipo de equipo');
			return;
		}

		try {
			// Crear el item
			const createResult = await dispatch(
				createItem({
					branchId,
					data: {
						batch_id: 0, // TODO: Obtener batch_id real cuando se integre con batches
						serial_number: serialNumber.trim(),
						product_id: Number(selectedProduct.value),
						equipment_type: equipmentType,
					},
				}),
			).unwrap();

			console.log('🔍 CreateResult completo:', createResult);
			console.log('🔍 CreateResult.id:', createResult.id);

			// Validar que el ID existe y es válido
			if (!createResult || !createResult.id || isNaN(createResult.id)) {
				console.error('ID inválido recibido:', createResult);
				throw new Error('El servidor no retornó un ID válido para el item creado');
			}

			const newItemId = createResult.id;

			// Iniciar la revisión
			await dispatch(
				startReview({
					branchId,
					itemId: newItemId,
				}),
			).unwrap();

			// Callback con el itemId, serial y tipo
			onComplete(newItemId, serialNumber.trim(), equipmentType);
		} catch (err: any) {
			console.error('Error en handleSubmit:', err);
			setError(err.message || 'Error al crear el item');
		}
	};

	/**
	 * Handler para finalizar con Grado M automático (equipo no enciende)
	 */
	const handleFinishGradeM = async () => {
		setError(null);
		setIsFinishing(true);

		// Validación
		if (!serialNumber.trim()) {
			setError('Ingresa un número de serie');
			setIsFinishing(false);
			return;
		}
		if (!selectedProduct) {
			setError('Selecciona un producto');
			setIsFinishing(false);
			return;
		}
		if (!equipmentType) {
			setError('Selecciona un tipo de equipo');
			setIsFinishing(false);
			return;
		}

		try {
			// Crear el item con campos técnicos vacíos
			const createResult = await dispatch(
				createItem({
					branchId,
					data: {
						batch_id: 0,
						serial_number: serialNumber.trim(),
						product_id: Number(selectedProduct.value),
						equipment_type: equipmentType,
						extra_attributes: {
							does_not_turn_on: true,
						},
					},
				}),
			).unwrap();

			console.log('🔍 CreateResult (Grado M):', createResult);

			// Validar ID
			if (!createResult || !createResult.id || isNaN(createResult.id)) {
				console.error('ID inválido recibido:', createResult);
				throw new Error('El servidor no retornó un ID válido para el item creado');
			}

			const newItemId = createResult.id;

			// Iniciar la revisión
			await dispatch(
				startReview({
					branchId,
					itemId: newItemId,
				}),
			).unwrap();

			// Completar la revisión automáticamente (Grado M)
			await dispatch(
				completeReview({
					branchId,
					itemId: newItemId,
				}),
			).unwrap();

			console.log('✅ Item finalizado con Grado M automático');

			// Callback específico para Grado M
			if (onFinishGradeM) {
				onFinishGradeM(newItemId);
			}
		} catch (err: any) {
			console.error('Error en handleFinishGradeM:', err);
			setError(err.message || 'Error al finalizar con Grado M');
		} finally {
			setIsFinishing(false);
		}
	};

	const isFormValid = serialNumber.trim() && selectedProduct && equipmentType;

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroInformationCircle' className='h-6 w-6 text-blue-600' />
						<h2 className='text-xl font-semibold'>Paso 1: Información Básica</h2>
					</div>
				</CardHeader>
				<CardBody className='space-y-6'>
					{/* Serial Number */}
					<div>
						<label className='mb-2 block text-sm font-medium'>
							Número de Serie <span className='text-red-500'>*</span>
						</label>
						<Input
							name='serialNumber'
							type='text'
							value={serialNumber}
							onChange={(e) => setSerialNumber(e.target.value)}
							placeholder='Ej: ABC123456'
							disabled={creating}
						/>
					</div>

					{/* Product */}
					<div>
						<label className='mb-2 block text-sm font-medium'>
							Producto <span className='text-red-500'>*</span>
						</label>
						<SelectReact
							name='product'
							options={productOptions}
							value={selectedProduct}
							onChange={(option) =>
								setSelectedProduct(option as TSelectOption | null)
							}
							placeholder='Seleccionar producto'
							isLoading={false}
							isDisabled={creating}
						/>
					</div>

					{/* Estado de Encendido - Checkbox para Grado M */}
					<div className='rounded-lg border-2 border-orange-300 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-950'>
						<Checkbox
							id='does_not_turn_on'
							checked={doesNotTurnOn}
							onChange={(e) => setDoesNotTurnOn(e.target.checked)}
							label={
								<span className='font-semibold text-orange-800 dark:text-orange-200'>
									🔴 El equipo NO enciende (Grado M automático)
								</span>
							}
						/>
						{doesNotTurnOn && (
							<p className='mt-2 text-sm text-orange-700 dark:text-orange-300'>
								Al marcar esta opción, el equipo se clasificará automáticamente como{' '}
								<strong>Grado M</strong> y se finalizará sin revisión técnica
								detallada.
							</p>
						)}
					</div>

					{/* Equipment Type */}
					<div>
						<label className='mb-2 block text-sm font-medium'>
							Tipo de Equipo <span className='text-red-500'>*</span>
						</label>
						<div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
							{equipmentTypes.map((et) => (
								<button
									key={et.type}
									type='button'
									onClick={() => setEquipmentType(et.type)}
									disabled={creating}
									className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
										equipmentType === et.type
											? `border-${et.color}-600 bg-${et.color}-50 dark:bg-${et.color}-950`
											: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
									}`}>
									<Icon
										icon={et.icon}
										className={`h-8 w-8 ${equipmentType === et.type ? `text-${et.color}-600` : 'text-gray-600'}`}
									/>
									<span
										className={`text-sm font-medium ${equipmentType === et.type ? `text-${et.color}-700 dark:text-${et.color}-300` : 'text-gray-700 dark:text-gray-300'}`}>
										{et.label}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Error */}
					{error && (
						<div className='rounded-lg bg-red-50 p-4 dark:bg-red-950'>
							<p className='text-sm text-red-800 dark:text-red-300'>
								<Icon
									icon='HeroExclamationCircle'
									className='mr-2 inline h-5 w-5'
								/>
								{error}
							</p>
						</div>
					)}

					{/* Submit Buttons */}
					<div className='flex justify-end gap-3'>
						{doesNotTurnOn ? (
							<Button
								variant='solid'
								color='red'
								onClick={handleFinishGradeM}
								isDisable={!isFormValid || isFinishing}
								icon={isFinishing ? 'HeroArrowPath' : 'HeroCheckCircle'}
								className={isFinishing ? 'animate-spin' : ''}>
								{isFinishing ? 'Finalizando...' : 'Finalizar - Grado M'}
							</Button>
						) : (
							<Button
								variant='solid'
								onClick={handleSubmit}
								isDisable={!isFormValid || creating}
								icon={creating ? 'HeroArrowPath' : 'HeroArrowRight'}
								className={creating ? 'animate-spin' : ''}>
								{creating ? 'Creando...' : 'Siguiente: Revisión Técnica'}
							</Button>
						)}
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default Step1BasicInfo;
