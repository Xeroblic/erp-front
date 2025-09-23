import React, { useCallback, useState } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import {
	IDocument,
	IDocumentFilters,
	IDocumentPayload,
	TDocumentType,
	TFileType,
	TRelatedModule,
} from './types/documentos.types';
import { useDocumentos } from './components/hooks/useDocumentos';
import DocumentStats from './components/DocumentStats';
import DocumentFilters from './components/DocumentFilters';
import DocumentsTable from './components/tables/DocumentsTable';
import CreateDocumentModal from './components/modals/CreateDocumentModal';
import EditDocumentModal from './components/modals/EditDocumentModal';
import ViewDocumentModal from './components/modals/ViewDocumentModal';
import DeleteDocumentModal from './components/modals/DeleteDocumentModal';

const Documentos: React.FC = () => {
	const [filters, setFilters] = useState<IDocumentFilters>({
		search: '',
		document_type: undefined,
		file_type: undefined,
		related_module: undefined,
		related_id: undefined,
		is_active: undefined,
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [selected, setSelected] = useState<IDocument | null>(null);

	const {
		documents,
		stats,
		loading,
		documentTypeOptions,
		fileTypeOptions,
		moduleOptions,
		statusOptions,
	} = useDocumentos(filters);

	const handleFilterChange = useCallback((key: keyof IDocumentFilters, value: unknown) => {
		setFilters((prev) => ({
			...prev,
			[key]: value === '' ? undefined : (value as IDocumentFilters[keyof IDocumentFilters]),
		}));
	}, []);

	const handleClearFilters = () => {
		setFilters({
			search: '',
			document_type: undefined,
			file_type: undefined,
			related_module: undefined,
			related_id: undefined,
			is_active: undefined,
		});
	};

	const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		const payload: IDocumentPayload = {
			name: String(formData.get('name') || ''),
			file_path: String(formData.get('file_path') || ''),
			file_type: formData.get('file_type') as TFileType,
			document_type: formData.get('document_type') as TDocumentType,
			related_module: formData.get('related_module') as TRelatedModule,
			related_id: Number(formData.get('related_id') || 0),
			description: String(formData.get('description') || '') || undefined,
			is_active: formData.get('is_active') === 'on',
		};

		console.log('Create document:', payload);
		event.currentTarget.reset();
		setCreateOpen(false);
	};

	const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selected) return;

		const formData = new FormData(event.currentTarget);

		const payload: IDocumentPayload = {
			name: String(formData.get('name') || ''),
			file_path: String(formData.get('file_path') || ''),
			file_type: formData.get('file_type') as TFileType,
			document_type: formData.get('document_type') as TDocumentType,
			related_module: formData.get('related_module') as TRelatedModule,
			related_id: Number(formData.get('related_id') || 0),
			description: String(formData.get('description') || '') || undefined,
			is_active: formData.get('is_active') === 'on',
		};

		console.log('Update document:', { id: selected.id, ...payload });
		setEditOpen(false);
		setSelected(null);
	};

	const handleDeleteConfirm = () => {
		if (!selected) return;
		console.log('Delete document:', selected.id);
		setDeleteOpen(false);
		setSelected(null);
	};

	const handleView = (document: IDocument) => {
		setSelected(document);
		setDetailOpen(true);
	};

	const handleEdit = (document: IDocument) => {
		setSelected(document);
		setEditOpen(true);
	};

	const handleDelete = (document: IDocument) => {
		setSelected(document);
		setDeleteOpen(true);
	};

	return (
		<PageWrapper name='documentos-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600'>
							<Icon icon='HeroDocumentText' className='h-6 w-6' />
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900'>
								Gestión de documentos
							</h1>
							<p className='text-sm text-gray-600'>
								Administra documentos asociados a las entidades del sistema
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='blue' onClick={() => setCreateOpen(true)} icon='HeroPlus'>
						Subir documento
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				<DocumentStats stats={stats} />
				<DocumentFilters
					filters={filters}
					documentTypeOptions={documentTypeOptions}
					fileTypeOptions={fileTypeOptions}
					moduleOptions={moduleOptions}
					statusOptions={statusOptions}
					onFilterChange={handleFilterChange}
					onClear={handleClearFilters}
				/>
				<DocumentsTable
					documents={documents}
					loading={loading}
					onView={handleView}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Container>

			<CreateDocumentModal
				isOpen={createOpen}
				setIsOpen={setCreateOpen}
				onSubmit={handleCreateSubmit}
			/>
			<EditDocumentModal
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				document={selected}
				onSubmit={handleEditSubmit}
			/>
			<ViewDocumentModal
				isOpen={detailOpen}
				setIsOpen={setDetailOpen}
				document={selected}
				onEdit={handleEdit}
			/>
			<DeleteDocumentModal
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				document={selected}
				onConfirm={handleDeleteConfirm}
			/>
		</PageWrapper>
	);
};

export default Documentos;
