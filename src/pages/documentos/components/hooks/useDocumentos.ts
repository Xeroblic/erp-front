import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { TSelectOptions } from '@/components/form/SelectReact';
import { useAppSelector } from '@/store';
import documentsService from '@/services/documentsService';
import type {
	IDocument,
	IDocumentFilters,
	IDocumentPayload,
	IDocumentStats,
	IDocumentAttachment,
	IDocumentTypeSummary,
} from '../../types/documentos.types';
import { DOCUMENT_MODULE_OPTIONS, DOCUMENT_OUTPUT_FORMATS } from '../../types/documentos.types';

const STATUS_OPTIONS: TSelectOptions = [
	{ value: '', label: 'Todos los estados' },
	{ value: 'true', label: 'Activo' },
	{ value: 'false', label: 'Inactivo' },
];

const computeStats = (docs: IDocument[]): IDocumentStats => {
	const total = docs.length;
	const active = docs.filter((doc) => doc.is_active).length;
	const totalSize = docs.reduce((acc, doc) => {
		const attachmentsSize =
			doc.attachments?.reduce((sum, att) => sum + (att.size ?? 0), 0) ?? 0;
		return acc + attachmentsSize;
	}, 0);
	const recent = docs.filter((doc) => {
		const created = new Date(doc.created_at).getTime();
		const diffDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
		return diffDays <= 7;
	}).length;

	const byTypeMap = new Map<string, number>();
	docs.forEach((doc) => {
		const label = doc.document_type?.name || 'Sin tipo';
		byTypeMap.set(label, (byTypeMap.get(label) || 0) + 1);
	});

	const byModuleMap = new Map<string, number>();
	docs.forEach((doc) => {
		byModuleMap.set(doc.related_module, (byModuleMap.get(doc.related_module) || 0) + 1);
	});

	return {
		total_documents: total,
		active_documents: active,
		total_size: totalSize,
		recent_uploads: recent,
		documents_by_type: Array.from(byTypeMap.entries()).map(([label, count]) => ({
			label,
			count,
		})),
		documents_by_module: Array.from(byModuleMap.entries()).map(([module, count]) => ({
			module,
			count,
		})),
	};
};

export function useDocumentos(filters: IDocumentFilters) {
	const user = useAppSelector((state) => state.auth.user);
	const subsidiaryId =
		user?.subsidiary?.id ??
		user?.subsidiary_id ??
		user?.branch?.subsidiary?.id ??
		user?.empresa?.subsidiary_id ??
		null;

	const [documents, setDocuments] = useState<IDocument[]>([]);
	const [stats, setStats] = useState<IDocumentStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [documentTypes, setDocumentTypes] = useState<IDocumentTypeSummary[]>([]);

	const fetchDocuments = useCallback(async () => {
		if (!subsidiaryId) {
			setDocuments([]);
			setStats(null);
			return;
		}
		setLoading(true);
		try {
			const data = await documentsService.listDocuments(subsidiaryId, filters);
			setDocuments(data);
			setStats(computeStats(data));
			const unique = new Map<number, IDocumentTypeSummary>();
			data.forEach((doc) => {
				if (doc.document_type) {
					unique.set(doc.document_type.id, doc.document_type);
				}
			});
			setDocumentTypes(Array.from(unique.values()));
		} catch (error: any) {
			const message =
				error?.response?.data?.message || 'No se pudieron cargar los documentos';
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, [subsidiaryId, filters]);

	useEffect(() => {
		fetchDocuments();
	}, [fetchDocuments]);

	const createDocument = useCallback(
		async (payload: IDocumentPayload, files?: File[] | FileList) => {
			if (!subsidiaryId) return null;
			setActionLoading(true);
			try {
				const created = await documentsService.createDocument(subsidiaryId, payload);
				if (files && files.length) {
					await documentsService.uploadAttachments(subsidiaryId, created.id, files);
				}
				toast.success('Documento creado correctamente');
				await fetchDocuments();
				return created;
			} catch (error: any) {
				const message =
					error?.response?.data?.message || 'Error al crear el documento';
				toast.error(message);
				throw error;
			} finally {
				setActionLoading(false);
			}
		},
		[subsidiaryId, fetchDocuments],
	);

	const updateDocument = useCallback(
		async (
			documentId: number,
			payload: Partial<IDocumentPayload>,
			files?: File[] | FileList,
		) => {
			if (!subsidiaryId) return null;
			setActionLoading(true);
			try {
				const updated = await documentsService.updateDocument(
					subsidiaryId,
					documentId,
					payload,
				);
				if (files && files.length) {
					await documentsService.uploadAttachments(subsidiaryId, documentId, files);
				}
				toast.success('Documento actualizado correctamente');
				await fetchDocuments();
				return updated;
			} catch (error: any) {
				const message =
					error?.response?.data?.message || 'Error al actualizar el documento';
				toast.error(message);
				throw error;
			} finally {
				setActionLoading(false);
			}
		},
		[subsidiaryId, fetchDocuments],
	);

	const deleteDocument = useCallback(
		async (documentId: number) => {
			if (!subsidiaryId) return;
			setActionLoading(true);
			try {
				await documentsService.deleteDocument(subsidiaryId, documentId);
				toast.success('Documento eliminado');
				await fetchDocuments();
			} catch (error: any) {
				const message =
					error?.response?.data?.message || 'Error al eliminar el documento';
				toast.error(message);
				throw error;
			} finally {
				setActionLoading(false);
			}
		},
		[subsidiaryId, fetchDocuments],
	);

	const loadDocument = useCallback(
		async (documentId: number) => {
			if (!subsidiaryId) return null;
			try {
				const document = await documentsService.getDocument(subsidiaryId, documentId);
				return document;
			} catch (error: any) {
				const message =
					error?.response?.data?.message || 'No se pudo cargar el documento';
				toast.error(message);
				throw error;
			}
		},
		[subsidiaryId],
	);

	const uploadAttachments = useCallback(
		async (documentId: number, files: File[] | FileList) => {
			if (!subsidiaryId || !files.length) return [] as IDocumentAttachment[];
			try {
				const attachments = await documentsService.uploadAttachments(
					subsidiaryId,
					documentId,
					files,
				);
				toast.success('Adjuntos cargados correctamente');
				return attachments;
			} catch (error: any) {
				const message =
					error?.response?.data?.message || 'Error al subir adjuntos';
				toast.error(message);
				throw error;
			}
		},
		[subsidiaryId],
	);

	const deleteAttachment = useCallback(
		async (documentId: number, attachmentId: number) => {
			if (!subsidiaryId) return;
			try {
				await documentsService.deleteAttachment(subsidiaryId, documentId, attachmentId);
				toast.success('Adjunto eliminado');
			} catch (error: any) {
				const message =
					error?.response?.data?.message || 'Error al eliminar el adjunto';
				toast.error(message);
				throw error;
			}
		},
		[subsidiaryId],
	);

	const documentTypeOptions = useMemo<TSelectOptions>(() => {
		return documentTypes.map((type) => ({
			value: type.id.toString(),
			label: type.name,
		}));
	}, [documentTypes]);

	const outputFormatOptions: TSelectOptions = useMemo(
		() =>
			DOCUMENT_OUTPUT_FORMATS.map((item) => ({
				value: item.value,
				label: item.label,
			})),
		[],
	);

	const moduleOptions: TSelectOptions = useMemo(
		() =>
			DOCUMENT_MODULE_OPTIONS.map((item) => ({
				value: item.value,
				label: item.label,
			})),
		[],
	);

	return {
		documents,
		stats,
		loading,
		actionLoading,
		documentTypeOptions,
		outputFormatOptions,
		moduleOptions,
		statusOptions: STATUS_OPTIONS,
		createDocument,
		updateDocument,
		deleteDocument,
		loadDocument,
		uploadAttachments,
		deleteAttachment,
		refreshDocuments: fetchDocuments,
	};
}
