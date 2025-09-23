import React, { Dispatch, SetStateAction, useRef, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Label from '@/components/form/Label';
import Icon from '@/components/icon/Icon';
import { DOCUMENT_TYPES, FILE_TYPES, RELATED_MODULES } from '../../types/documentos.types';

type CreateDocumentModalProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
	isOpen,
	setIsOpen,
	onSubmit,
}) => {
	const formRef = useRef<HTMLFormElement | null>(null);
	const [isActive, setIsActive] = useState(true);

	const handleSubmitClick = () => {
		formRef.current?.requestSubmit();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
						<Icon icon='HeroPlus' className='h-6 w-6 text-blue-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Subir nuevo documento</h2>
						<p className='text-sm text-gray-600'>
							Registra un documento asociado a una entidad
						</p>
					</div>
				</div>
			</ModalHeader>
			<form ref={formRef} id='createDocumentForm' onSubmit={onSubmit} className='space-y-4'>
				<ModalBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div className='md:col-span-2'>
							<Label htmlFor='create-name' className='required'>
								Nombre del documento
							</Label>
							<Input
								id='create-name'
								name='name'
								placeholder='Ej: Contrato de servicios 2024'
								required
							/>
						</div>
					</div>

					<div>
						<Label htmlFor='create-file-path' className='required'>
							Ruta del archivo
						</Label>
						<Input
							id='create-file-path'
							name='file_path'
							placeholder='Ej: /documents/contratos/contrato_2024.pdf'
							required
						/>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='create-document-type' className='required'>
								Tipo de documento
							</Label>
							<Select
								id='create-document-type'
								name='document_type'
								defaultValue='contrato'
								required>
								{DOCUMENT_TYPES.map((type) => (
									<option key={type.value} value={type.value}>
										{type.label}
									</option>
								))}
							</Select>
						</div>
						<div>
							<Label htmlFor='create-file-type' className='required'>
								Tipo de archivo
							</Label>
							<Select
								id='create-file-type'
								name='file_type'
								defaultValue='pdf'
								required>
								{FILE_TYPES.map((type) => (
									<option key={type.value} value={type.value}>
										{type.label}
									</option>
								))}
							</Select>
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='create-related-module' className='required'>
								Módulo relacionado
							</Label>
							<Select
								id='create-related-module'
								name='related_module'
								defaultValue='customer'
								required>
								{RELATED_MODULES.map((module) => (
									<option key={module.value} value={module.value}>
										{module.label}
									</option>
								))}
							</Select>
						</div>
						<div>
							<Label htmlFor='create-related-id' className='required'>
								ID relacionado
							</Label>
							<Input
								id='create-related-id'
								name='related_id'
								type='number'
								min='1'
								placeholder='ID de la entidad'
								required
							/>
						</div>
					</div>

					<div>
						<Label htmlFor='create-description'>Descripción (opcional)</Label>
						<Textarea
							id='create-description'
							name='description'
							placeholder='Propósito o detalles adicionales del documento'
							rows={3}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='create-is-active'>Estado</Label>
						<Checkbox
							id='create-is-active'
							name='is_active'
							checked={isActive}
              onClick={() => setIsActive(!isActive)}
							label='Documento activo'
						/>
					</div>
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button variant='outline' onClick={() => setIsOpen(false)}>
							Cancelar
						</Button>
						<Button color='blue' onClick={handleSubmitClick}>
							Subir documento
						</Button>
					</div>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default CreateDocumentModal;
