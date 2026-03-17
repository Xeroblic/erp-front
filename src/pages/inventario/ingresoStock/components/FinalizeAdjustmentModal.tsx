import React from 'react';
import { FormikProps } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import { useUserBranches } from '@/hooks/userBrandBranch';
import { IAdjustmentForm } from '../types';

interface FinalizeAdjustmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	form: FormikProps<IAdjustmentForm>;
	isSubmitting: boolean;
	itemCount: number;
}

export const FinalizeAdjustmentModal: React.FC<FinalizeAdjustmentModalProps> = ({
	isOpen,
	onClose,
	form,
	isSubmitting,
	itemCount,
}) => {
	const { branches, loading: loadingBranches } = useUserBranches();

	const handleTypeChange = (type: 'ingreso' | 'egreso') => {
		form.setFieldValue('movementType', type);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<h3 className='text-xl font-bold'>Finalizar Ajuste de Stock</h3>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-5'>
					{/* Información */}
					<div className='flex items-center justify-between rounded-md bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400'>
						<span>Se ajustarán <strong>{itemCount}</strong> productos de la zona de trabajo.</span>
					</div>

					{/* Tipo de movimiento */}
					<div>
						<Label htmlFor='movementTypeBtn' className='mb-2 block'>Tipo de Movimiento</Label>
						<div className='flex flex-wrap items-center gap-3'>
							<Button
								color={form.values.movementType === 'ingreso' ? 'emerald' : 'zinc'}
								variant={form.values.movementType === 'ingreso' ? 'solid' : 'outline'}
								onClick={() => handleTypeChange('ingreso')}
							>
								Ingreso (+)
							</Button>
							<Button
								color={form.values.movementType === 'egreso' ? 'red' : 'zinc'}
								variant={form.values.movementType === 'egreso' ? 'solid' : 'outline'}
								onClick={() => handleTypeChange('egreso')}
							>
								Egreso (-)
							</Button>
							{form.touched.movementType && form.errors.movementType && (
								<span className="text-xs text-red-500">{form.errors.movementType}</span>
							)}
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4'>
						<div className='col-span-1'>
							<Label htmlFor='branchId'>Sucursal destino</Label>
							<Select
								id='branchId'
								name='branchId'
								value={form.values.branchId}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								disabled={loadingBranches}
							>
								<option value=''>Selecciona una sucursal...</option>
								{branches.map(b => (
									<option key={b.id} value={b.id}>{b.name}</option>
								))}
							</Select>
							{form.touched.branchId && form.errors.branchId && (
								<p className='mt-1 text-xs text-red-500'>
									{form.errors.branchId}
								</p>
							)}
						</div>

						<div className='col-span-1'>
							<Label htmlFor='reason'>Razón del ajuste</Label>
							<Input
								id='reason'
								name='reason'
								placeholder='Ej: Ingreso por Factura #8821'
								value={form.values.reason}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								isValid={form.isValid}
								isTouched={!!form.touched.reason}
								invalidFeedback={form.errors.reason}
							/>
						</div>

						<div className='col-span-1'>
							<Label htmlFor='notes'>Notas (opcional)</Label>
							<Textarea
								id='notes'
								name='notes'
								placeholder='Detalles adicionales...'
								value={form.values.notes}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								rows={3}
							/>
						</div>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color='zinc' variant='outline' onClick={onClose} isDisable={isSubmitting}>
					Cancelar
				</Button>
				<Button color='amber' variant='solid' onClick={() => form.handleSubmit()} isDisable={isSubmitting}>
					{isSubmitting ? 'Enviando...' : 'Confirmar Ajuste'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};
