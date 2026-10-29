import React, { Dispatch, SetStateAction, useMemo, useRef } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import { IDocument, IDocumentAttachment } from '../../types/documentos.types';
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
		const { files } = event.target;
		if (files && files.length && onUploadAttachments) {
			onUploadAttachments(files);
		}
		event.target.value = '';
	};

	const attachmentColumns = useMemo<ColumnDef<IDocumentAttachment>[]>(
		() => [
			{
				accessorKey: 'file_name',
				header: 'Archivo',
				cell: ({ row }) => {
					const att = row.original;
					return (
						<div className='flex items-center space-x-2'>
							<Icon icon={getFileIcon(att.mime_type || '')} className='h-4 w-4' />
							<a
								href={att.url}
								target='_blank'
								rel='noopener noreferrer'
								className='font-medium text-primary-700 hover:underline'>
								{att.original_name || att.file_name || `Adjunto #${att.id}`}
							</a>
						</div>
					);
				},
			},
			{
				accessorKey: 'size',
				header: 'Tamaño',
				cell: ({ row }) => formatFileSize(row.original.size || 0),
			},
			{
				accessorKey: 'uploaded_at',
				header: 'Subido',
				cell: ({ row }) =>
					row.original.uploaded_at ? formatDateTime(row.original.uploaded_at) : '—',
			},
			{
				id: 'actions',
				header: 'Acciones',
				cell: ({ row }) => {
					const att = row.original;
					return (
						<div className='flex items-center space-x-2'>
							<Button
								size='xs'
								variant='outline'
								color='emerald'
								className='px-2'
								onClick={() => window.open(att.url, '_blank', 'noopener')}>
								<Icon
									icon='HeroArrowDownTray'
									color='emerald'
									className='h-4 w-4'
								/>
								Descargar
							</Button>
							{onDeleteAttachment && (
								<Button
									size='xs'
									variant='outline'
									className='px-2'
									color='red'
									onClick={() => onDeleteAttachment(att.id)}>
									<Icon icon='HeroTrash' color='red' className='ml-1 h-4 w-4' />
									Eliminar
								</Button>
							)}
						</div>
					);
				},
			},
		],
		[onDeleteAttachment],
	);

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full'>
						<Icon icon='HeroEye' className='h-6 w-6' />
					</div>
					<div>
						<Badge className='text-xl font-bold'>Detalles del documento</Badge>
						<p className='text-sm'>Información completa y adjuntos</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{loading ? (
					<div className='py-6 text-center text-sm'>
						<div className='mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
						Cargando documento...
					</div>
				) : document ? (
					<div className='space-y-5'>
						<Card className='border border-dashed border-gray-200 bg-transparent shadow-sm'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-lg font-semibold'>
									{document.name}
								</CardTitle>
								<p className='text-sm'>Resumen</p>
							</CardHeader>
							<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div className='space-y-3 text-sm'>
									<div className='flex items-center justify-between'>
										<span className='font-medium'>Tipo de documento</span>
										<Badge color={getDocumentTypeColor(document) as any}>
											{getDocumentTypeLabel(document)}
										</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span className='font-medium'>Tipo de archivo</span>
										<Badge className='px-2' variant='outline' color='gray'>
											{getFileTypeLabel(document.output_format)}
										</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span className='font-medium'>Tamaño total adjuntos</span>
										<span className=''>
											{formatFileSize(
												document.attachments?.reduce(
													(sum, att) => sum + (att.size ?? 0),
													0,
												) || 0,
											)}
										</span>
									</div>
								</div>
								<div className='space-y-2 rounded-lg border border-gray-200 p-4 text-sm'>
									<div className='flex items-center justify-between'>
										<span className='font-medium'>Módulo relacionado</span>
										<span className=''>
											{getModuleLabel(document.related_module)}
										</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='font-medium'>ID relacionado</span>
										<span className=''>{document.related_id ?? '—'}</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='font-medium'>Creado</span>
										<span className=''>
											{formatDateTime(document.created_at)}
										</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='font-medium'>Actualizado</span>
										<span className=''>
											{formatDateTime(document.updated_at)}
										</span>
									</div>
									<Badge
										className='px-2'
										variant='outline'
										color={document.is_active ? 'emerald' : 'red'}>
										{document.is_active ? 'Activo' : 'Inactivo'}
									</Badge>
								</div>
							</CardBody>
						</Card>

						{document.description && (
							<Card className='border border-dashed border-gray-200 bg-transparent shadow-sm'>
								<CardHeader className='pb-2'>
									<CardTitle className='text-sm font-semibold'>
										Descripción
									</CardTitle>
								</CardHeader>
								<CardBody className='text-sm'>{document.description}</CardBody>
							</Card>
						)}

						<Card className='border border-dashed border-gray-200 bg-transparent shadow-sm'>
							<CardHeader className='flex items-center justify-between pb-2'>
								<div>
									<CardTitle className='text-sm font-semibold'>
										Adjuntos
									</CardTitle>
									<p className='text-xs'>
										{document.attachments?.length || 0} archivos vinculados al
										documento
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
							</CardHeader>
							<CardBody>
								<DataTable<IDocumentAttachment>
									columns={attachmentColumns}
									data={document.attachments || []}
									searchPlaceholder='Buscar adjuntos...'
									emptyMessage='Este documento no tiene archivos adjuntos.'
									pageSize={5}
								/>
							</CardBody>
						</Card>
					</div>
				) : (
					<div className='py-6 text-center text-sm'>
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
