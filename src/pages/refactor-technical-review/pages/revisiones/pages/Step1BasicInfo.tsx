import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import EquipmentTypeSelector from '../components/EquipmentTypeSelector';
import type { TSelectOption } from '@/components/form/SelectReact';
import type { EquipmentType } from '@/store/slices/technicalReviews';

interface Step1BasicInfoProps {
	serialNumber: string;
	onSerialChange: (v: string) => void;
	productId: number | null;
	onProductChange: (id: number | null) => void;
	productOptions: TSelectOption[];
	productsLoading: boolean;
	equipmentType: EquipmentType;
	onEquipmentTypeChange: (type: EquipmentType) => void;
	canContinue: boolean;
	loading: boolean;
	onBack: () => void;
	onSubmit: () => Promise<void>;
	readOnly?: boolean;
}

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
	serialNumber,
	onSerialChange,
	productId,
	onProductChange,
	productOptions,
	productsLoading,
	equipmentType,
	onEquipmentTypeChange,
	canContinue,
	loading,
	onBack,
	onSubmit,
	readOnly = false,
}) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [serialError, setSerialError] = useState('');

	const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value.toUpperCase().trim();
		onSerialChange(val);
		if (val.length > 0) setSerialError('');
	};

	const handleSubmit = async () => {
		if (!serialNumber) {
			setSerialError('El número de serie es obligatorio');
			return;
		}
		if (!productId) return;

		setIsSubmitting(true);
		try {
			await onSubmit();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardBody className='space-y-6'>
				{/* Step Header */}
				<div className='flex items-start justify-between'>
					<div>
						<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
							Paso 1: Información Básica
						</h2>
						<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
							Ingresa el número de serie, producto y tipo de equipo
						</p>
					</div>
				</div>

				{/* Serial Number */}
				<div className='space-y-2'>
					<label className='flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Número de Serie
						<span className='text-red-500'>*</span>
					</label>
					<Input
						name='serial_number'
						value={serialNumber}
						onChange={handleSerialChange}
						placeholder='Ej: SDFSDFSD'
						className={`font-mono uppercase ${serialError ? 'border-red-500' : ''}`}
						autoFocus={!readOnly}
						disabled={readOnly}
					/>
					{serialError && (
						<p className='flex items-center gap-1 text-xs text-red-500'>
							<Icon icon='HeroExclamationCircle' className='h-3 w-3' />
							{serialError}
						</p>
					)}
				</div>

				{/* Product */}
				<div className='space-y-2'>
					<label className='flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Producto
						<span className='text-red-500'>*</span>
					</label>
					<SelectReact
						name='product_id'
						options={productOptions}
						value={
							productId
								? productOptions.find((o) => o.value === String(productId)) || null
								: null
						}
						onChange={(opt) => onProductChange(opt ? Number((opt as any).value) : null)}
						placeholder='Seleccionar producto con seguimiento por serie'
						isLoading={productsLoading}
						isDisabled={readOnly}
					/>
				</div>

				{/* Equipment Type */}
				<div className='space-y-2'>
					<label className='flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Tipo de Equipo
						<span className='text-red-500'>*</span>
					</label>
					<EquipmentTypeSelector
						value={equipmentType}
						onChange={onEquipmentTypeChange}
						disabled={isSubmitting || loading || readOnly}
					/>
				</div>

				{/* Footer Actions */}
				<div className='flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700'>
					<Button variant='outline' color='red' onClick={onBack} disabled={isSubmitting}>
						Cancelar
					</Button>

					{readOnly ? (
						<span className='flex items-center gap-2 text-sm text-blue-500'>
							<Icon icon='HeroEye' className='h-4 w-4' />
							Solo lectura
						</span>
					) : (
						<Button
							variant='solid'
							color='blue'
							onClick={handleSubmit}
							isLoading={isSubmitting || loading}
							disabled={!canContinue || isSubmitting || loading}>
							Continuar
							<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
						</Button>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default Step1BasicInfo;
