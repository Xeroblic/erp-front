import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Checkbox from '@/components/form/Checkbox';
import { useAppDispatch, useAppSelector } from '@/store';
import { createItem, startReview, completeReview } from '@/store/slices/technicalReviews';
import type { EquipmentType } from '@/interface/technicalReviews.interface';
import Label from '@/components/form/Label';
import { toast } from 'react-toastify';

interface Step1BasicInfoProps {
	branchId: number;
	onComplete: (itemId: number, serialNumber: string, equipmentType: EquipmentType) => void;
	onFinishGradeM?: (itemId: number) => void;
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
	const [doesNotTurnOn, setDoesNotTurnOn] = useState(false);
	const [isFinishing, setIsFinishing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [checking, setChecking] = useState(false);
	let debounceTimer: ReturnType<typeof setTimeout>; // ✅ ARREGLO TIPADO AQUÍ

	const productOptions: TSelectOption[] = [
		{ value: '1', label: 'Notebook HP - Equipos' },
		{ value: '2', label: 'Desktop Dell - Equipos' },
		{ value: '3', label: 'Monitor LG - Periféricos' },
		{ value: '4', label: 'Docking Lenovo - Accesorios' },
	];

	const equipmentTypes = [
		{ type: 'notebook', label: 'Notebook', icon: 'HeroComputerDesktop', color: 'blue' },
		{ type: 'desktop', label: 'Desktop', icon: 'HeroCpuChip', color: 'purple' },
		{ type: 'aio', label: 'All-in-One', icon: 'HeroDeviceTablet', color: 'green' },
		{ type: 'docking', label: 'Docking', icon: 'HeroServerStack', color: 'orange' },
		{ type: 'monitor', label: 'Monitor', icon: 'HeroTv', color: 'pink' },
	];

	// 🧠 Validar si ya existe la serie
	const checkSerialExists = async (serial: string) => {
		if (!serial.trim()) return;
		setChecking(true);
		try {
			const res = await fetch(
				`/api/branches/${branchId}/technical-reviews/items?search=${encodeURIComponent(serial.trim())}`,
				{
					headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
				},
			);
			if (!res.ok) throw new Error('Error al verificar serie');
			const data = await res.json();
			const exists = data?.data?.some(
				(item: any) =>
					item.serial_number?.trim().toLowerCase() === serial.trim().toLowerCase(),
			);

			if (exists) {
				setError(`Ya existe una serie con el número "${serial.trim()}"`);
				toast.error(`⚠️ La serie ${serial.trim()} ya está registrada`, {
					position: 'top-right',
					autoClose: 4000,
					theme: 'colored',
				});
			} else {
				setError(null);
			}
		} catch (err) {
			console.error('Error verificando serie existente:', err);
		} finally {
			setChecking(false);
		}
	};

	// ⌨️ Manejo del input con debounce
	const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setSerialNumber(val);
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => checkSerialExists(val), 600);
	};

	// También verificar al salir del input
	const handleSerialBlur = () => {
		checkSerialExists(serialNumber);
	};

	const handleSubmit = async () => {
		setError(null);

		if (!serialNumber.trim()) return setError('Ingresa un número de serie');
		if (!selectedProduct) return setError('Selecciona un producto');
		if (!equipmentType) return setError('Selecciona un tipo de equipo');
		if (error) return; // si ya había error de existencia, no crear

		try {
			// Crear el item usando Redux thunk
			const createResult = await dispatch(
				createItem({
					branchId,
					data: {
						batch_id: 0,
						serial_number: serialNumber.trim(),
						product_id: Number(selectedProduct.value),
						equipment_type: equipmentType,
					},
				}),
			).unwrap();

			console.log('🔍 CreateResult completo:', createResult);

			// Validar que el ID existe y es válido
			if (!createResult || !createResult.id || isNaN(createResult.id)) {
				console.error('❌ ID inválido recibido:', createResult);
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
			console.error('❌ Error en handleSubmit:', err);

			// Manejar error 422 (validación)
			const errorMessage = err?.message || err || 'Error al crear el item';

			setError(errorMessage);

			toast.error(errorMessage, {
				position: 'top-right',
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
			});
		}
	};

	const isFormValid = serialNumber.trim() && selectedProduct && equipmentType && !error;

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
						<Label htmlFor='n_serie' className='mb-2 block text-sm font-medium'>
							Número de Serie <span className='text-red-500'>*</span>
						</Label>
						<div className='relative'>
							<Input
								name='serialNumber'
								type='text'
								value={serialNumber}
								onChange={handleSerialChange}
								onBlur={handleSerialBlur}
								placeholder='Ej: ABC123456'
								disabled={creating}
							/>
							{checking && (
								<span className='absolute right-3 top-2 text-xs text-gray-500'>
									Verificando...
								</span>
							)}
						</div>
						{error && (
							<p className='mt-1 text-sm text-red-600 dark:text-red-400'>{error}</p>
						)}
					</div>

					{/* Product */}
					<div>
						<Label htmlFor='product' className='mb-2 block text-sm font-medium'>
							Producto <span className='text-red-500'>*</span>
						</Label>
						<SelectReact
							name='product'
							options={productOptions}
							value={selectedProduct}
							onChange={(option) =>
								setSelectedProduct(option as TSelectOption | null)
							}
							placeholder='Seleccionar producto'
							isDisabled={creating}
						/>
					</div>

					{/* Equipment Type */}
					<div>
						<Label htmlFor='equipment_type' className='mb-2 block text-sm font-medium'>
							Tipo de Equipo <span className='text-red-500'>*</span>
						</Label>
						<div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
							{equipmentTypes.map((et) => (
								<Button
									key={et.type}
									onClick={() => setEquipmentType(et.type as EquipmentType)}
									isDisable={creating}
									className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
										equipmentType === et.type
											? `border-${et.color}-600 bg-${et.color}-50 dark:bg-${et.color}-950`
											: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
									}`}>
									<Icon
										icon={et.icon}
										className={`h-8 w-8 ${
											equipmentType === et.type
												? `text-${et.color}-600`
												: 'text-gray-600'
										}`}
									/>
									<span
										className={`text-sm font-medium ${
											equipmentType === et.type
												? `text-${et.color}-700 dark:text-${et.color}-300`
												: 'text-gray-700 dark:text-gray-300'
										}`}>
										{et.label}
									</span>
								</Button>
							))}
						</div>
					</div>

					{/* Botones */}
					<div className='flex justify-end gap-3'>
						<Button
							variant='solid'
							onClick={handleSubmit}
							isDisable={!isFormValid || creating}
							icon={creating ? 'HeroArrowPath' : 'HeroArrowRight'}
							className={creating ? 'animate-spin' : ''}>
							{creating ? 'Creando...' : 'Siguiente: Revisión Técnica'}
						</Button>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default Step1BasicInfo;
