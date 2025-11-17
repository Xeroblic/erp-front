import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Table, { THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
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

type DocumentsTableProps = {
	documents: IDocument[];
	loading: boolean;
	onView: (document: IDocument) => void;
	onEdit: (document: IDocument) => void;
	onDelete: (document: IDocument) => void;
};

const DocumentsTable: React.FC<DocumentsTableProps> = ({
	documents,
	loading,
	onView,
	onEdit,
	onDelete,
}) => (
	<Card>
		<CardHeader>
			<div className='flex items-center justify-between'>
				<CardTitle>Lista de documentos</CardTitle>
				<div className='flex items-center space-x-2 text-sm text-gray-500'>
					<span>{documents.length} documentos</span>
					{loading && (
						<div className='flex items-center space-x-2'>
							<div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
							<span>Cargando…</span>
						</div>
					)}
				</div>
			</div>
		</CardHeader>
		<CardBody className='p-0'>
			<div className='overflow-x-auto'>
				<Table className='min-w-full divide-y divide-gray-200'>
					<THead className='bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
						<Tr>
							<Th>Documento</Th>
							<Th>Tipo</Th>
							<Th>Archivo</Th>
							<Th>Módulo</Th>
							<Th>Tamaño</Th>
							<Th>Subido por</Th>
							<Th>Fecha</Th>
							<Th>Estado</Th>
							<Th>Acciones</Th>
						</Tr>
					</THead>
					<TBody className='divide-y divide-gray-200 bg-white'>
						{documents.map((document) => (
							<Tr key={document.id} className='hover:bg-gray-50'>
								<Td>
									<div className='flex items-center space-x-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
											<Icon
												icon={getFileIcon(document.output_format)}
												className='h-5 w-5 text-gray-600'
											/>
										</div>
										<div>
											<p className='font-medium text-gray-900'>
												{document.name}
											</p>
											<p className='text-sm text-gray-500'>
												ID relacionado: {document.related_id ?? '—'}
											</p>
										</div>
									</div>
								</Td>
								<Td>
									<Badge color={getDocumentTypeColor(document) as any}>
										{getDocumentTypeLabel(document)}
									</Badge>
								</Td>
								<Td>
									<Badge variant='outline' color='gray'>
										{getFileTypeLabel(document.output_format)}
									</Badge>
								</Td>
								<Td className='text-sm text-gray-900'>
									{getModuleLabel(document.related_module)}
								</Td>
								<Td className='text-sm text-gray-600'>
									{formatFileSize(
										document.attachments?.reduce(
											(sum, att) => sum + (att.size ?? 0),
											0,
										) || 0,
									)}
								</Td>
								<Td className='text-sm text-gray-900'>
									{document.metadata?.uploaded_by_name || 'N/A'}
								</Td>
								<Td className='text-sm text-gray-600'>
									{formatDateTime(document.created_at)}
								</Td>
								<Td>
									<Badge
										variant='outline'
										color={document.is_active ? 'emerald' : 'red'}>
										{document.is_active ? 'Activo' : 'Inactivo'}
									</Badge>
								</Td>
								<Td>
									<div className='flex items-center space-x-2'>
										<Button
											size='xs'
											variant='outline'
											className='text-blue-600 hover:text-blue-700'
											onClick={() => onView(document)}>
											<Icon icon='HeroEye' className='h-4 w-4' />
										</Button>
										<Button
											size='xs'
											variant='outline'
											className='text-amber-600 hover:text-amber-700'
											onClick={() => onEdit(document)}>
											<Icon icon='HeroPencil' className='h-4 w-4' />
										</Button>
										<Button
											size='xs'
											variant='outline'
											className='text-red-600 hover:text-red-700'
											onClick={() => onDelete(document)}>
											<Icon icon='HeroTrash' className='h-4 w-4' />
										</Button>
									</div>
								</Td>
							</Tr>
						))}
					</TBody>
				</Table>
			</div>

			{documents.length === 0 && !loading && (
				<div className='flex flex-col items-center justify-center py-12 text-center text-sm text-gray-500'>
					<Icon icon='HeroDocumentText' className='mb-3 h-10 w-10 text-gray-300' />
					<p className='font-medium text-gray-600'>No se encontraron documentos</p>
					<p className='text-gray-400'>Ajusta los filtros o sube un nuevo documento.</p>
				</div>
			)}
		</CardBody>
	</Card>
);

export default DocumentsTable;
