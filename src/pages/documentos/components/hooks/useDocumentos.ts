import { useEffect, useMemo, useState } from 'react';
import { TSelectOptions } from '@/components/form/SelectReact';
import {
  IDocument,
  IDocumentFilters,
  IDocumentStats,
  DOCUMENT_TYPES,
  FILE_TYPES,
  RELATED_MODULES,
} from '../../types/documentos.types';
import { mockDocuments, mockDocumentStats } from '../mocks/documentosMock';

export function useDocumentos(filters: IDocumentFilters) {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [stats, setStats] = useState<IDocumentStats>(mockDocumentStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let data = [...mockDocuments];

      if (filters.search) {
        const query = filters.search.toLowerCase();
        data = data.filter((doc) =>
          [doc.name, doc.description || '', doc.uploaded_by_name || '']
            .join(' ')
            .toLowerCase()
            .includes(query),
        );
      }

      if (filters.document_type) {
        data = data.filter((doc) => doc.document_type === filters.document_type);
      }

      if (filters.file_type) {
        data = data.filter((doc) => doc.file_type === filters.file_type);
      }

      if (filters.related_module) {
        data = data.filter((doc) => doc.related_module === filters.related_module);
      }

      if (filters.related_id) {
        data = data.filter((doc) => doc.related_id === filters.related_id);
      }

      if (filters.is_active !== undefined) {
        data = data.filter((doc) => doc.is_active === filters.is_active);
      }

      setDocuments(data);
      setStats(mockDocumentStats);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters]);

  const documentTypeOptions = useMemo<TSelectOptions>(
    () => DOCUMENT_TYPES.map((item) => ({ value: item.value, label: item.label })),
    [],
  );

  const fileTypeOptions = useMemo<TSelectOptions>(
    () => FILE_TYPES.map((item) => ({ value: item.value, label: item.label })),
    [],
  );

  const moduleOptions = useMemo<TSelectOptions>(
    () => RELATED_MODULES.map((item) => ({ value: item.value, label: item.label })),
    [],
  );

  const statusOptions: TSelectOptions = useMemo(
    () => [
      { value: '', label: 'Todos los estados' },
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ],
    [],
  );

  return {
    documents,
    stats,
    loading,
    documentTypeOptions,
    fileTypeOptions,
    moduleOptions,
    statusOptions,
  };
}
