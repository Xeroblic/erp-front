import React, { useCallback, useState } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { IDocument, IDocumentFilters, IDocumentPayload } from './types/documentos.types';
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
		document_type_id: undefined,
		output_format: undefined,
		related_module: undefined,
		related_id: undefined,
		is_active: undefined,
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [selected, setSelected] = useState<IDocument | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [attachmentsLoading, setAttachmentsLoading] = useState(false);

	const {
		documents,
		stats,
		loading,
		actionLoading,
		documentTypeOptions,
		outputFormatOptions,
		moduleOptions,
		statusOptions,
		createDocument,
		updateDocument,
		deleteDocument,
		loadDocument,
		uploadAttachments,
		deleteAttachment,
		refreshDocuments,
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
			document_type_id: undefined,
			output_format: undefined,
			related_module: undefined,
			related_id: undefined,
			is_active: undefined,
		});
	};

	const handleCreateSubmit = async (payload: IDocumentPayload, files?: FileList | File[] | null) => {
		await createDocument(payload, files || undefined);
	};

	const handleEditSubmit = async (
		id: number,
		payload: Partial<IDocumentPayload>,
		files?: FileList | File[] | null,
	) => {
		await updateDocument(id, payload, files || undefined);
		setSelected(null);
	};

	const handleDeleteConfirm = async () => {
		if (!selected) return;
		await deleteDocument(selected.id);
		setDeleteOpen(false);
		setSelected(null);
	};

	const handleView = async (document: IDocument) => {
		setDetailOpen(true);
		setDetailLoading(true);
		setSelected(null);
		try {
			const detail = await loadDocument(document.id);
			setSelected(detail);
		} catch (error) {
			console.error('Error al cargar el documento', error);
			setSelected(document);
		} finally {
			setDetailLoading(false);
		}
	};

	const handleEdit = async (document: IDocument) => {
		setDetailLoading(true);
		try {
			const detail = await loadDocument(document.id);
			setSelected(detail);
			setEditOpen(true);
		} catch (error) {
			console.error('Error al cargar documento', error);
		} finally {
			setDetailLoading(false);
		}
	};

	const handleDelete = (document: IDocument) => {
		setSelected(document);
		setDeleteOpen(true);
	};

	const handleUploadAttachments = async (files: FileList | File[] | null) => {
		if (!selected || !files?.length) return;
		try {
			setAttachmentsLoading(true);
			await uploadAttachments(selected.id, files);
			const updated = await loadDocument(selected.id);
			setSelected(updated);
			await refreshDocuments();
		} finally {
			setAttachmentsLoading(false);
		}
	};

	const handleDeleteAttachment = async (attachmentId: number) => {
		if (!selected) return;
		try {
			setAttachmentsLoading(true);
			await deleteAttachment(selected.id, attachmentId);
			const updated = await loadDocument(selected.id);
			setSelected(updated);
			await refreshDocuments();
		} finally {
			setAttachmentsLoading(false);
		}
	};

	return (
		<PageWrapper name='documentos-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg  text-blue-600'>
							<Icon icon='HeroDocumentText' className='h-6 w-6' />
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900'>Gestión de documentos</h1>
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
					outputFormatOptions={outputFormatOptions}
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
				documentTypeOptions={documentTypeOptions}
				moduleOptions={moduleOptions}
				outputFormatOptions={outputFormatOptions}
				onSubmit={handleCreateSubmit}
				isLoading={actionLoading}
			/>
			<EditDocumentModal
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				document={selected}
				documentTypeOptions={documentTypeOptions}
				moduleOptions={moduleOptions}
				outputFormatOptions={outputFormatOptions}
				onSubmit={handleEditSubmit}
				isLoading={actionLoading}
			/>
			<ViewDocumentModal
				isOpen={detailOpen}
				setIsOpen={setDetailOpen}
				document={selected}
				onEdit={handleEdit}
				onUploadAttachments={handleUploadAttachments}
				onDeleteAttachment={handleDeleteAttachment}
				uploading={attachmentsLoading}
				loading={detailLoading}
			/>
			<DeleteDocumentModal
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				document={selected}
				onConfirm={handleDeleteConfirm}
				loading={actionLoading}
			/>
		</PageWrapper>
	);
};

export default Documentos;
