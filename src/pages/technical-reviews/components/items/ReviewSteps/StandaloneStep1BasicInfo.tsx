import React from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { EquipmentType } from '@/interface/technicalReviews.interface';

type StandaloneStep1BasicInfoProps = {
	serialNumber: string;
	onSerialChange: (value: string) => void;
	productId: number | null;
	onProductChange: (value: number | null) => void;
	productOptions: TSelectOption[];
	productsLoading: boolean;
	equipmentType: EquipmentType | null;
	onEquipmentTypeChange: (value: EquipmentType) => void;
	manualBatchLabel: string | null;
	batchOptions: TSelectOption[];
	selectedBatchOption: TSelectOption | null;
	onBatchChange: (option: TSelectOption | null) => void;
	manualBatchLoading: boolean;
	manualBatchError: string | null;
	canContinue: boolean;
	loading: boolean;
	onBack: () => void;
	onSubmit: () => void;
};

const EQUIPMENT_TYPE_OPTIONS = [
	{ value: 'notebook', label: 'Notebook', icon: 'HeroComputerDesktop' },
	{ value: 'desktop', label: 'Desktop', icon: 'HeroServerStack' },
	{ value: 'aio', label: 'All-in-One', icon: 'HeroDeviceTablet' },
	{ value: 'docking', label: 'Docking', icon: 'HeroCube' },
	{ value: 'monitor', label: 'Monitor', icon: 'HeroTv' },
] as const;

const StandaloneStep1BasicInfo: React.FC<StandaloneStep1BasicInfoProps> = ({
	serialNumber,
	onSerialChange,
	productId,
	onProductChange,
	productOptions,
	productsLoading,
	equipmentType,
	onEquipmentTypeChange,
	manualBatchLabel,
	batchOptions,
	selectedBatchOption,
	onBatchChange,
	manualBatchLoading,
	manualBatchError,
	canContinue,
	loading,
	onBack,
	onSubmit,
}) => {
	const selectedProductOption = productId
		? (productOptions.find((opt) => opt.value === String(productId)) ?? null)
		: null;

	const manualBatchMessage = manualBatchLoading
		? 'Buscando lote disponible...'
		: manualBatchLabel
			? `Esta revisión se asociará automáticamente al lote ${manualBatchLabel}.`
			: 'No se encontró un lote abierto disponible. Debes crear uno en la sección de Lotes.';

	return (
		<Card>
			<CardHeader>
				<h3 className='text-lg font-semibold'>Paso 1: Información Básica</h3>
				<p className='text-sm text-gray-600'>
					Ingresa el número de serie y selecciona el producto. El tipo de equipo se asigna
					de manera automática según el producto (puedes ajustarlo si es necesario).
				</p>
			</CardHeader>
			<CardBody>
				<div className='space-y-6'>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Número de Serie <span className='text-red-500'>*</span>
						</label>
						<Input
							type='text'
							name='serial_number'
							value={serialNumber}
							onChange={(e) => onSerialChange(e.target.value)}
							className='font-mono'
							placeholder='Ej: SN001234567'
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Producto <span className='text-red-500'>*</span>
						</label>
						{productsLoading ? (
							<div className='text-sm text-gray-500'>Cargando productos...</div>
						) : (
							<SelectReact
								name='product_id'
								options={productOptions}
								value={selectedProductOption}
								onChange={(option) => {
									const selectedOption = option as TSelectOption | null;
									onProductChange(
										selectedOption ? Number(selectedOption.value) : null,
									);
								}}
								placeholder='Seleccionar producto con seguimiento por serie'
								isDisabled={productsLoading}
							/>
						)}
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Lote Manual<span className='text-red-500'>*</span>
						</label>
						<SelectReact
							name='batch_id'
							placeholder='Selecciona un lote abierto'
							options={batchOptions}
							value={selectedBatchOption}
							onChange={(option) => onBatchChange(option as TSelectOption | null)}
							isLoading={manualBatchLoading}
							isDisabled={manualBatchLoading || batchOptions.length === 0}
						/>
						{manualBatchError && (
							<p className='mt-1 text-xs text-red-500'>{manualBatchError}</p>
						)}
						<div className='text-xs text-gray-500 dark:text-gray-400'>
							{manualBatchMessage}
						</div>
					</div>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Tipo de Equipo <span className='text-red-500'>*</span>
						</label>
						<div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
							{EQUIPMENT_TYPE_OPTIONS.map((type) => (
								<button
									key={type.value}
									type='button'
									onClick={() =>
										onEquipmentTypeChange(type.value as EquipmentType)
									}
									className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
										equipmentType === type.value
											? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950'
											: 'border-gray-300 hover:border-blue-300'
									}`}>
									<Icon icon={type.icon} className='h-8 w-8' />
									<span className='text-sm font-medium'>{type.label}</span>
								</button>
							))}
						</div>
					</div>

					<div className='flex justify-between gap-3'>
						<Button variant='outline' onClick={onBack} isDisable={loading}>
							Cancelar
						</Button>
						<Button onClick={onSubmit} isDisable={loading || !canContinue}>
							Continuar
							<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
						</Button>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default StandaloneStep1BasicInfo;
