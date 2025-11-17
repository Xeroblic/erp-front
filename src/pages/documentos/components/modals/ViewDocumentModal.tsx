import React, { Dispatch, SetStateAction, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { IDocument } from '../../types/documentos.types';
import {
	formatDateTime,
	formatFileSize,
	getDocumentTypeColor,
	getDocumentTypeLabel,
	getFileIcon,
	getFileTypeLabel,
	getModuleLabel,
} from '../utils';

type ViewDocumentModalProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	document: IDocument | null;
	onEdit?: (document: IDocument) => void;
	onUploadAttachments?: (files: FileList | File[] | null) => void;
	onDeleteAttachment?: (attachmentId: number) => void;
	uploading?: boolean;
	loading?: boolean;
};

const ViewDocumentModal: React.FC<ViewDocumentModalProps> = ({
	isOpen,
	setIsOpen,
	document,
	onEdit,
	onUploadAttachments,
	onDeleteAttachment,
	uploading = false,
	loading = false,
}) => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!document) return;
		const files = event.target.files;
		if (files && files.length && onUploadAttachments) {
			onUploadAttachments(files);
		}
		event.target.value = '';
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
						<Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-gray-900'>Detalles del documento</h2>
						<p className='text-sm text-gray-600'>Información completa y adjuntos</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{loading ? (
					<div className='py-6 text-center text-sm text-gray-500'>
						<div className='mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
						Cargando documento...
					</div>
				) : document ? (
					<div className='space-y-6'>
						<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
							<div className='space-y-3'>
								<h3 className='text-lg font-semibold text-gray-900'>{document.name}</h3>
								<div className='space-y-2 text-sm text-gray-600'>
									<div className='flex justify-between'>
										<span className='font-medium text-gray-700'>Tipo de documento</span>
										<Badge color={getDocumentTypeColor(document) as any}>
											{getDocumentTypeLabel(document)}
										</Badge>
									</div>
									<div className='flex justify-between'>
										<span className='font-medium text-gray-700'>Tipo de archivo</span>
										<Badge variant='outline' color='gray'>
											{getFileTypeLabel(document.output_format)}
										</Badge>
									</div>
									<div className='flex justify-between'>
										<span className='font-medium text-gray-700'>Tamaño total adjuntos</span>
										<span>
											{formatFileSize(
												document.attachments?.reduce(
													(sum, att) => sum + (att.size ?? 0),
													0,
												) || 0,
											)}
										</span>
									</div>
								</div>
							</div>
							<div className='space-y-2 rounded-lg border p-4 text-sm text-gray-600'>
								<div className='flex justify-between'>
									<span className='font-medium text-gray-700'>Módulo relacionado</span>
									<span>{getModuleLabel(document.related_module)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='font-medium text-gray-700'>ID relacionado</span>
									<span>{document.related_id ?? '—'}</span>
								</div>
								<div className='flex justify-between'>
									<span className='font-medium text-gray-700'>Creado</span>
									<span>{formatDateTime(document.created_at)}</span>
								</div>
								<div className='flex justify-between'>
									<span className='font-medium text-gray-700'>Actualizado</span>
									<span>{formatDateTime(document.updated_at)}</span>
								</div>
								<Badge variant='outline' color={document.is_active ? 'emerald' : 'red'}>
									{document.is_active ? 'Activo' : 'Inactivo'}
								</Badge>
							</div>
						</div>

						{document.description && (
							<div className='rounded-lg bg-gray-50 p-4 text-sm text-gray-600'>
								<h4 className='mb-2 font-semibold text-gray-900'>Descripción</h4>
								<p>{document.description}</p>
							</div>
						)}

						<div className='space-y-3 rounded-lg border p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<h4 className='text-sm font-semibold text-gray-900'>Adjuntos</h4>
									<p className='text-xs text-gray-500'>
										{document.attachments?.length || 0} archivos vinculados al documento
									</p>
								</div>
								<div className='flex items-center space-x-2'>
									<input
										ref={fileInputRef}
										type='file'
										multiple
										className='hidden'
										onChange={handleFileChange}
									/>
									<Button
										variant='outline'
										size='sm'
										icon='HeroPaperClip'
										onClick={handleUploadClick}
										isLoading={uploading}
										isDisable={!onUploadAttachments}>
										Agregar adjuntos
									</Button>
								</div>
							</div>
							<div className='overflow-x-auto'>
								<table className='min-w-full divide-y divide-gray-200 text-sm'>
									<thead className='bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500'>
										<tr>
											<th className='px-2 py-2 text-left'>Archivo</th>
											<th className='px-2 py-2 text-left'>Tamaño</th>
											<th className='px-2 py-2 text-left'>Subido</th>
											<th className='px-2 py-2 text-center'>Acciones</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-100'>
										{(document.attachments || []).length === 0 && (
											<tr>
												<td
													colSpan={4}
													className='px-2 py-3 text-center text-sm text-gray-500'>
													Este documento no tiene archivos adjuntos.
												</td>
											</tr>
										)}
										{document.attachments?.map((attachment) => (
											<tr key={attachment.id}>
												<td className='px-2 py-2'>
													<div className='flex items-center space-x-2'>
														<Icon icon={getFileIcon(attachment.mime_type || '')} className='h-4 w-4 text-gray-500' />
														<span className='font-medium text-gray-800'>
															{attachment.original_name ||
																attachment.file_name ||
																`Adjunto #${attachment.id}`}
														</span>
													</div>
												</td>
												<td className='px-2 py-2 text-gray-600'>
													{formatFileSize(attachment.size || 0)}
												</td>
												<td className='px-2 py-2 text-gray-600'>
													{attachment.uploaded_at
														? formatDateTime(attachment.uploaded_at)
														: '—'}
												</td>
												<td className='px-2 py-2'>
													<div className='flex items-center justify-center space-x-2'>
														<Button
															size='xs'
															variant='outline'
															onClick={() => window.open(attachment.url, '_blank', 'noopener')}
															icon='HeroArrowDownTray'>
															Descargar
														</Button>
														{onDeleteAttachment && (
															<Button
																size='xs'
																variant='outline'
																color='red'
																icon='HeroTrash'
																onClick={() => onDeleteAttachment(attachment.id)}>
																Eliminar
															</Button>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				) : (
					<div className='py-6 text-center text-sm text-gray-500'>
						Selecciona un documento para ver sus detalles.
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-3'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cerrar
					</Button>
					{document && onEdit && (
						<Button
							color='amber'
							onClick={() => {
								setIsOpen(false);
								onEdit(document);
							}}>
							Editar documento
						</Button>
					)}
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default ViewDocumentModal;
