import React, { Dispatch, SetStateAction, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Label from '@/components/form/Label';
import Icon from '@/components/icon/Icon';
import type { IDocument, IDocumentPayload } from '../../types/documentos.types';
import type { TSelectOptions } from '@/components/form/SelectReact';

type EditDocumentModalProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	document: IDocument | null;
	documentTypeOptions: TSelectOptions;
	moduleOptions: TSelectOptions;
	outputFormatOptions: TSelectOptions;
	onSubmit: (
		documentId: number,
		payload: Partial<IDocumentPayload>,
		files?: FileList | File[] | null,
	) => Promise<void> | void;
	isLoading?: boolean;
};

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
	isOpen,
	setIsOpen,
	document,
	documentTypeOptions,
	moduleOptions,
	outputFormatOptions,
	onSubmit,
	isLoading = false,
}) => {
	const formRef = useRef<HTMLFormElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!document) return;
		const formData = new FormData(event.currentTarget);
		const payload: Partial<IDocumentPayload> = {
			name: String(formData.get('name') || '').trim(),
			document_type_id: Number(formData.get('document_type_id') || document.document_type_id),
			output_format: String(formData.get('output_format') || document.output_format),
			related_module: (formData.get('related_module') as any) || document.related_module,
			related_id: formData.get('related_id')
				? Number(formData.get('related_id'))
				: document.related_id,
			description: String(formData.get('description') || '') || undefined,
			is_active: formData.get('is_active') === 'on',
		};

		try {
			await onSubmit(document.id, payload, fileInputRef.current?.files);
			if (fileInputRef.current) fileInputRef.current.value = '';
			setIsOpen(false);
		} catch (error) {
			console.error('Error al actualizar documento', error);
		}
	};

	const handleSubmitClick = () => formRef.current?.requestSubmit();

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
						<Icon icon='HeroPencil' className='h-6 w-6 text-amber-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Editar documento</h2>
						<p className='text-sm text-gray-600'>
							Actualiza los metadatos y adjunta nuevos archivos si lo necesitas
						</p>
					</div>
				</div>
			</ModalHeader>
			{document ? (
				<form ref={formRef} id='editDocumentForm' onSubmit={handleSubmit} className='space-y-4'>
					<ModalBody>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div className='md:col-span-2'>
								<Label htmlFor='edit-name' className='required'>
									Nombre del documento
								</Label>
								<Input id='edit-name' name='name' defaultValue={document.name} required />
							</div>
						</div>

						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<Label htmlFor='edit-document-type' className='required'>
									Tipo de documento
								</Label>
								<Select
									id='edit-document-type'
									name='document_type_id'
									defaultValue={document.document_type_id.toString()}
									required>
									{documentTypeOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</div>
							<div>
								<Label htmlFor='edit-output-format' className='required'>
									Formato de archivo
								</Label>
								<Select
									id='edit-output-format'
									name='output_format'
									defaultValue={document.output_format}
									required>
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
								<Label htmlFor='edit-related-module' className='required'>
									Módulo relacionado
								</Label>
								<Select
									id='edit-related-module'
									name='related_module'
									defaultValue={document.related_module}
									required>
									{moduleOptions.map((module) => (
										<option key={module.value} value={module.value}>
											{module.label}
										</option>
									))}
								</Select>
							</div>
							<div>
								<Label htmlFor='edit-related-id'>ID relacionado</Label>
								<Input
									id='edit-related-id'
									name='related_id'
									type='number'
									min='1'
									defaultValue={document.related_id ?? undefined}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor='edit-description'>Descripción</Label>
							<Textarea
								id='edit-description'
								name='description'
								defaultValue={document.description || ''}
								rows={3}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='edit-files'>Agregar adjuntos</Label>
							<Input id='edit-files' name='files' type='file' multiple ref={fileInputRef} />
							<p className='text-xs text-gray-500'>
								Los archivos nuevos se sumarán al documento. Puedes eliminarlos desde el
								detalle.
							</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='edit-is-active'>Estado</Label>
							<Checkbox
								id='edit-is-active'
								name='is_active'
								defaultChecked={document.is_active}
								label='Documento activo'
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end space-x-3'>
							<Button variant='outline' onClick={() => setIsOpen(false)}>
								Cancelar
							</Button>
							<Button color='amber' onClick={handleSubmitClick} isLoading={isLoading}>
								Guardar cambios
							</Button>
						</div>
					</ModalFooter>
				</form>
			) : (
				<ModalBody>
					<div className='py-6 text-center text-sm text-gray-500'>
						Selecciona un documento para editar.
					</div>
				</ModalBody>
			)}
		</Modal>
	);
};

export default EditDocumentModal;
