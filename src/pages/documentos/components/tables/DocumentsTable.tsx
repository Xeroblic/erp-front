import React, { useMemo } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';


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
import { Row } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable';

type DocumentsTableProps = {
    documents: IDocument[];
    loading: boolean;
    onView: (document: IDocument) => void;
    onEdit: (document: IDocument) => void;
    onDelete: (document: IDocument) => void;
};

const DocumentsTableV2: React.FC<DocumentsTableProps> = ({
    documents,
    loading,
    onView,
    onEdit,
    onDelete,
}) => {
    const columns = useMemo(
        () => [
            {
                accessorKey: 'name',
                header: 'Documento',
                cell: ({ row }: { row: Row<IDocument> }) => {
                    const doc = row.original as IDocument;

                    return (
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                                <Icon
                                    icon={getFileIcon(doc.output_format)}
                                    className="h-5 w-5 text-gray-600 dark:text-gray-300"
                                />
                            </div>
                            <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                    ID relacionado: {doc.related_id ?? '—'}
                                </p>
                            </div>
                        </div>
                    );
                },
                enableSorting: true,
            },

            {
                accessorKey: 'type',
                header: 'Tipo',
                cell: ({ row }: { row: Row<IDocument> }) => {
                    const d = row.original;
                    return (
                        <Badge color={getDocumentTypeColor(d) as any}>
                            {getDocumentTypeLabel(d)}
                        </Badge>
                    );
                },
            },

            {
                accessorKey: 'output_format',
                header: 'Archivo',
                cell: ({ row }: { row: Row<IDocument> }) => (
                    <Badge variant="outline" color="gray">
                        {getFileTypeLabel(row.original.output_format)}
                    </Badge>
                ),
            },

            {
                accessorKey: 'related_module',
                header: 'Módulo',
                cell: ({ row }: { row: Row<IDocument> }) => getModuleLabel(row.original.related_module),
            },

            {
                accessorKey: 'size',
                header: 'Tamaño',
                cell: ({ row }: { row: Row<IDocument> }) =>
                    formatFileSize(
                        row.original.attachments?.reduce(
                            (s, a) => s + (a.size ?? 0),
                            0,
                        ) || 0,
                    ),
            },

            {
                accessorKey: 'uploaded_by',
                header: 'Subido por',
                cell: ({ row }: { row: Row<IDocument> }) =>
                    row.original.metadata?.uploaded_by_name || 'N/A',
            },

            {
                accessorKey: 'created_at',
                header: 'Fecha',
                cell: ({ row }: { row: Row<IDocument> }) => formatDateTime(row.original.created_at),
                enableSorting: true,
            },

            {
                accessorKey: 'is_active',
                header: 'Estado',
                cell: ({ row }: { row: Row<IDocument> }) => (
                    <Badge
                        variant="outline"
                        color={row.original.is_active ? 'emerald' : 'red'}
                    >
                        {row.original.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                ),
            },

            {
                id: 'actions',
                header: 'Acciones',
                cell: ({ row }: { row: Row<IDocument> }) => {
                    const doc = row.original;

                    return (
                        <div className="flex items-center gap-2">
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => onView(doc)}
                            >
                                <Icon icon="HeroEye" className="h-4 w-4" />
                            </Button>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => onEdit(doc)}
                                className="text-amber-600"
                            >
                                <Icon icon="HeroPencil" className="h-4 w-4" />
                            </Button>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => onDelete(doc)}
                                className="text-red-600"
                            >
                                <Icon icon="HeroTrash" className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [onView, onEdit, onDelete],
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center w-full">
                    <CardTitle>Documentos</CardTitle>
                    <Badge variant="outline">
                        {documents.length} registros
                    </Badge>
                </div>
            </CardHeader>

            <CardBody>
                <DataTable<IDocument>
                    columns={columns}
                    data={documents}
                    loading={loading}
                    searchPlaceholder="Buscar documento…"
                    emptyMessage="No se encontraron documentos"
                    pageSize={10}
                />
            </CardBody>
        </Card>
    );
};

export default DocumentsTableV2;
