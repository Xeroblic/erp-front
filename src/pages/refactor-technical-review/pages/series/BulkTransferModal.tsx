import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/form/Textarea';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';

interface BulkTransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	onTransfer: (serialNumbers: string[], targetBranchId: number) => Promise<void>;
	destinationBranchOptions: TSelectOption[];
}

const BulkTransferModal: React.FC<BulkTransferModalProps> = ({
	isOpen,
	onClose,
	onTransfer,
	destinationBranchOptions,
}) => {
	const parseSerials = (rawInput: string): string[] => {
		return rawInput
			.split(/[\s,;]+/)
			.map((serial) => serial.trim())
			.filter(Boolean);
	};

	const [serialsInput, setSerialsInput] = useState('');
	const [targetBranch, setTargetBranch] = useState<TSelectOption | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Reset al abrir/cerrar o al cambiar opciones de destino
	useEffect(() => {
		if (!isOpen) {
			setTargetBranch(null);
			return;
		}

		if (!destinationBranchOptions.length) {
			setTargetBranch(null);
			return;
		}

		setTargetBranch((prev) => {
			if (!prev) return null;
			const stillExists = destinationBranchOptions.some(
				(opt) => String(opt.value) === String(prev.value),
			);
			return stillExists ? prev : null;
		});
	}, [isOpen, destinationBranchOptions]);

	const handleSubmit = async () => {
		// Acepta seriales separados por salto de línea, espacios, comas o punto y coma
		const serials = parseSerials(serialsInput);

		if (serials.length === 0) {
			toast.warning('Ingresa al menos un número de serie');
			return;
		}

		if (!targetBranch) {
			toast.warning('Selecciona la sucursal de destino');
			return;
		}

		setIsSubmitting(true);
		try {
			await onTransfer(serials, Number(targetBranch.value));

			// Limpiamos los estados al terminar
			setSerialsInput('');
			setTargetBranch(null);
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};
	// FKGRMW2 HVQRYW3 2C5WJL3
	const serialsCount = parseSerials(serialsInput).length;

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader className='bg-blue-50 dark:bg-blue-900/20'>
				<div className='flex items-center gap-2 text-blue-700 dark:text-blue-300'>
					<Icon icon='HeroArrowsRightLeft' className='h-5 w-5' />
					<span>Transferencia Masiva por S/N</span>
				</div>
			</ModalHeader>
			<ModalBody className='p-6'>
				<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
					{/* Lado Izquierdo: Input de Series */}
					<div className='flex h-full flex-col'>
						<label className='mb-2 block text-sm font-semibold uppercase text-gray-500'>
							Números de Serie (uno por línea)
						</label>
						<Textarea
							value={serialsInput}
							onChange={(e) => setSerialsInput(e.target.value)}
							rows={12}
							placeholder='SN-123456789&#10;SN-987654321'
							className='w-full flex-grow resize-none font-mono text-sm'
						/>
						<div className='mt-2 flex items-center justify-between text-sm'>
							<span className='text-gray-500'>Equipos detectados:</span>
							<span
								className={`font-bold ${serialsCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
								{serialsCount}
							</span>
						</div>
					</div>

					{/* Lado Derecho: Destino y Resumen */}
					<div className='flex flex-col gap-6'>
						<div>
							<label className='mb-2 block text-sm font-semibold uppercase text-gray-500'>
								Sucursal de Destino
							</label>
							<SelectReact
								name='sucursales'
								options={destinationBranchOptions}
								value={targetBranch}
								onChange={(val) => setTargetBranch(val as TSelectOption)}
								placeholder='Selecciona destino...'
							/>
						</div>

						{/* UX: Panel de información visual */}
						<div className='rounded-lg border border-blue-100 bg-blue-50 p-4 text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300'>
							<h4 className='mb-2 flex items-center gap-2 font-bold'>
								<Icon icon='HeroInformationCircle' className='h-5 w-5' />
								Instrucciones de Transferencia
							</h4>
							<ul className='ml-1 space-y-2 text-sm'>
								<li className='flex items-start gap-2'>
									<Icon
										icon='HeroCheckCircle'
										className='mt-0.5 h-4 w-4 opacity-70'
									/>
									<span>
										Pega los <strong>Números de Serie</strong> de los equipos a
										transferir (puedes usar un escáner de código de barras).
									</span>
								</li>
								<li className='flex items-start gap-2'>
									<Icon
										icon='HeroCheckCircle'
										className='mt-0.5 h-4 w-4 opacity-70'
									/>
									<span>
										Selecciona la <strong>sucursal de destino</strong> en tu
										misma subempresa.
									</span>
								</li>
								<li className='flex items-start gap-2'>
									<Icon
										icon='HeroExclamationTriangle'
										className='mt-0.5 h-4 w-4 text-amber-500'
									/>
									<span>
										Las series que no existan o no estén en tu sucursal actual
										serán ignoradas por el sistema.
									</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</ModalBody>
			<ModalFooter className='bg-gray-50 dark:bg-gray-800/50'>
				<Button variant='outline' onClick={onClose} disabled={isSubmitting}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					color='blue'
					onClick={handleSubmit}
					// isReloading={isSubmitting}
					disabled={serialsCount === 0 || !targetBranch}>
					Confirmar Transferencia
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default BulkTransferModal;
