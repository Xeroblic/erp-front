/**
 * ApproveModal - Modal para aprobar item con selección de grado
 */
import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';

interface ApproveModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (grade: string, overrideReason?: string) => void;
	suggestedGrade?: string;
	isLoading?: boolean;
}

const ApproveModal: React.FC<ApproveModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	suggestedGrade,
	isLoading = false,
}) => {
	const [selectedGrade, setSelectedGrade] = useState<TSelectOption | null>(null);
	const [overrideReason, setOverrideReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	const gradeOptions: TSelectOption[] = [
		{ value: 'A', label: 'A - Excelente' },
		{ value: 'B', label: 'B - Bueno' },
		{ value: 'C', label: 'C - Regular' },
		{ value: 'D', label: 'D - Deficiente' },
	];

	const isOverride = selectedGrade && suggestedGrade && selectedGrade.value !== suggestedGrade;

	const handleConfirm = () => {
		setError(null);

		if (!selectedGrade) {
			setError('Selecciona un grado');
			return;
		}

		if (isOverride && !overrideReason.trim()) {
			setError('Debes ingresar un motivo al modificar el grado sugerido');
			return;
		}

		onConfirm(selectedGrade.value, isOverride ? overrideReason : undefined);
	};

	const handleClose = () => {
		setSelectedGrade(null);
		setOverrideReason('');
		setError(null);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose}>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroCheckCircle' className='h-6 w-6 text-green-600' />
					<h3 className='text-xl font-semibold'>Aprobar Revisión</h3>
				</div>
			</ModalHeader>
			<ModalBody className='space-y-4'>
				{suggestedGrade && (
					<div className='rounded-lg bg-blue-50 p-3 dark:bg-blue-950'>
						<p className='text-sm text-blue-800 dark:text-blue-300'>
							<Icon icon='HeroInformationCircle' className='mr-2 inline h-5 w-5' />
							Grado sugerido por el sistema: <strong>{suggestedGrade}</strong>
						</p>
					</div>
				)}

				<div>
					<label className='mb-2 block text-sm font-medium'>
						Grado Final <span className='text-red-500'>*</span>
					</label>
					<SelectReact
						name='grade'
						options={gradeOptions}
						value={selectedGrade}
						onChange={(option) => setSelectedGrade(option as TSelectOption | null)}
						placeholder='Seleccionar grado'
						isDisabled={isLoading}
					/>
				</div>

				{isOverride && (
					<div>
						<label className='mb-2 block text-sm font-medium'>
							Motivo del Cambio <span className='text-red-500'>*</span>
						</label>
						<Textarea
							name='override_reason'
							value={overrideReason}
							onChange={(e) => setOverrideReason(e.target.value)}
							rows={3}
							placeholder='Explica por qué modificas el grado sugerido...'
							disabled={isLoading}
						/>
						<p className='mt-1 text-xs text-gray-500'>
							Estás modificando el grado sugerido. Debes proporcionar una razón.
						</p>
					</div>
				)}

				{error && (
					<div className='rounded-lg bg-red-50 p-3 dark:bg-red-950'>
						<p className='text-sm text-red-800 dark:text-red-300'>
							<Icon icon='HeroExclamationCircle' className='mr-2 inline h-5 w-5' />
							{error}
						</p>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={handleClose} isDisable={isLoading}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					color='green'
					onClick={handleConfirm}
					isDisable={isLoading}
					icon={isLoading ? 'HeroArrowPath' : 'HeroCheckCircle'}>
					{isLoading ? 'Aprobando...' : 'Aprobar'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ApproveModal;
