import React, { Dispatch, SetStateAction, useRef, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Label from '@/components/form/Label';
import Icon from '@/components/icon/Icon';
import type { IDocumentPayload } from '../../types/documentos.types';
import type { TSelectOptions } from '@/components/form/SelectReact';

type CreateDocumentModalProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	documentTypeOptions: TSelectOptions;
	moduleOptions: TSelectOptions;
	outputFormatOptions: TSelectOptions;
	onSubmit: (payload: IDocumentPayload, files?: FileList | File[] | null) => Promise<void> | void;
	isLoading?: boolean;
};

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
	isOpen,
	setIsOpen,
	documentTypeOptions,
	moduleOptions,
	outputFormatOptions,
	onSubmit,
	isLoading = false,
}) => {
	const formRef = useRef<HTMLFormElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isActive, setIsActive] = useState(true);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const payload: IDocumentPayload = {
			name: String(formData.get('name') || '').trim(),
			document_type_id: Number(formData.get('document_type_id') || 0),
			output_format: String(formData.get('output_format') || ''),
			related_module: formData.get('related_module') as any,
			related_id: formData.get('related_id')
				? Number(formData.get('related_id'))
				: undefined,
			description: String(formData.get('description') || '') || undefined,
			is_active: formData.get('is_active') === 'on',
		};

		try {
			await onSubmit(payload, fileInputRef.current?.files);
			event.currentTarget.reset();
			if (fileInputRef.current) fileInputRef.current.value = '';
			setIsActive(true);
			setIsOpen(false);
		} catch (error) {
			console.error('Error al crear documento', error);
		}
	};

	const handleSubmitClick = () => formRef.current?.requestSubmit();

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
			<form ref={formRef} id='createDocumentForm' onSubmit={handleSubmit} className='space-y-4'>
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

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='create-document-type' className='required'>
								Tipo de documento
							</Label>
							<Select id='create-document-type' name='document_type_id' required defaultValue=''>
								<option value='' disabled>
									Selecciona un tipo
								</option>
								{documentTypeOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</Select>
						</div>
						<div>
							<Label htmlFor='create-file-type' className='required'>
								Formato de archivo
							</Label>
							<Select id='create-file-type' name='output_format' required defaultValue=''>
								<option value='' disabled>
									Selecciona formato
								</option>
								{outputFormatOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
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
							<Select id='create-related-module' name='related_module' required defaultValue=''>
								<option value='' disabled>
									Selecciona módulo
								</option>
								{moduleOptions.map((module) => (
									<option key={module.value} value={module.value}>
										{module.label}
									</option>
								))}
							</Select>
						</div>
						<div>
							<Label htmlFor='create-related-id'>ID relacionado</Label>
							<Input
								id='create-related-id'
								name='related_id'
								type='number'
								min='1'
								placeholder='ID de la entidad'
							/>
						</div>
					</div>

					<div>
						<Label htmlFor='create-description'>Descripción (opcional)</Label>
						<Textarea
							id='create-description'
							name='description'
							placeholder='Propósito o detalles adicionales'
							rows={3}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='create-files'>Adjuntos (opcional)</Label>
						<Input id='create-files' name='files' type='file' multiple ref={fileInputRef} />
						<p className='text-xs text-gray-500'>
							Puedes adjuntar varios archivos; se subirán al guardar el documento.
						</p>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='create-is-active'>Estado</Label>
						<Checkbox
							id='create-is-active'
							name='is_active'
							checked={isActive}
							onChange={() => setIsActive((prev) => !prev)}
							label='Documento activo'
						/>
					</div>
				</ModalBody>
				<ModalFooter>
					<div className='flex justify-end space-x-3'>
						<Button variant='outline' onClick={() => setIsOpen(false)}>
							Cancelar
						</Button>
						<Button color='blue' onClick={handleSubmitClick} isLoading={isLoading}>
							Subir documento
						</Button>
					</div>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default CreateDocumentModal;
