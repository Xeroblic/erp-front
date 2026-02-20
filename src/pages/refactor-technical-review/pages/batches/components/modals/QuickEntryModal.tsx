import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { EQUIPMENT_TYPE_OPTIONS } from '@/pages/refactor-technical-review/components/constants/technicalReview.constants';
import { EquipmentType } from '@/interface/technicalReviews.interface';

interface QuickEntryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e?: React.FormEvent) => void;
	serial: string;
	setSerial: (value: string) => void;
	equipmentType: EquipmentType;
	setEquipmentType: (value: EquipmentType) => void;
	error: string | null;
	setError: (value: string | null) => void;
	success: string | null;
	setSuccess: (value: string | null) => void;
	isLoading: boolean;
	inputRef: React.RefObject<HTMLInputElement>;
	keepFocus: (event?: React.FocusEvent<HTMLInputElement>) => void;
	isTypeSelectorFocusedRef: React.MutableRefObject<boolean>;
}

const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	serial,
	setSerial,
	equipmentType,
	setEquipmentType,
	error,
	setError,
	success,
	setSuccess,
	isLoading,
	inputRef,
	keepFocus,
	isTypeSelectorFocusedRef,
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} isCentered>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroBolt' className='h-5 w-5 text-blue-500' />
					<span>Ingreso rápido de serie</span>
				</div>
			</ModalHeader>
			<form onSubmit={onSubmit}>
				<ModalBody>
					<p className='mb-3 text-sm text-gray-600 dark:text-gray-300'>
						Ingresa el número de serie para registrarlo inmediatamente en el lote. Se
						creará en estado <strong>pendiente</strong>.
					</p>
					<Input
						name='quick-entry-serial'
						label='Número de serie'
						placeholder='Ej: NB-001-INGRESO'
						value={serial}
						autoComplete='off'
						ref={inputRef}
						onChange={(e) => {
							setSerial(e.target.value);
							if (error) setError(null);
							if (success) setSuccess(null);
						}}
						onBlur={(event) => keepFocus(event)}
						onKeyDown={(e) => {
							if (e.key === 'Tab') {
								e.preventDefault();
							}
						}}
					/>
					<div
						className='mt-4'
						data-quick-entry-allow-blur='true'
						onPointerDownCapture={() => {
							isTypeSelectorFocusedRef.current = true;
						}}
						onPointerUpCapture={() => {
							window.setTimeout(() => {
								isTypeSelectorFocusedRef.current = false;
							}, 0);
						}}>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200'>
							Tipo de equipo
						</label>
						<SelectReact
							name='quick-entry-type'
							placeholder='Seleccionar tipo'
							options={EQUIPMENT_TYPE_OPTIONS}
							value={
								EQUIPMENT_TYPE_OPTIONS.find(
									(option) => option.value === equipmentType,
								) || null
							}
							onChange={(option) => {
								const selected = option as TSelectOption | null;
								setEquipmentType((selected?.value as EquipmentType) || 'notebook');
								if (error) setError(null);
								if (success) setSuccess(null);
							}}
							onFocus={() => {
								isTypeSelectorFocusedRef.current = true;
							}}
							onBlur={() => {
								isTypeSelectorFocusedRef.current = false;
							}}
						/>
					</div>
					{error && <p className='mt-2 text-sm text-red-500'>{error}</p>}
					{success && <p className='mt-2 text-sm text-green-600'>{success}</p>}
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={onClose} isDisable={isLoading}>
						Cancelar
					</Button>
					<Button color='blue' onClick={onSubmit} isLoading={isLoading}>
						Guardar serie
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default QuickEntryModal;
