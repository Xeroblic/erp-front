import React from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import Alert from '@/components/ui/Alert';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import TableCardFooterTemplateV2, {
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import useRelatedDocumentList from '../../hooks/useRelatedDocumentList';

/**
 * Una lista relacionada paginada del detalle (sección 6): «las listas
 * relacionadas paginan; no se incrusta historia ilimitada en el detalle».
 * Siempre vacía en este mock, pero la paginación es real contra el
 * servicio — el día que exista contenido, sólo el servicio cambia.
 */

interface IRelatedListCardProps {
	title: string;
	emptyLabel: string;
	subsidiaryId: number | null;
	documentId: number | null;
	fetcher: Parameters<typeof useRelatedDocumentList>[0]['fetcher'];
}

const RelatedListCard: React.FC<IRelatedListCardProps> = ({
	title,
	emptyLabel,
	subsidiaryId,
	documentId,
	fetcher,
}) => {
	const { meta, loading, error, page, onPageChange } = useRelatedDocumentList({
		subsidiaryId,
		documentId,
		fetcher,
	});

	const pagination: PaginationState = {
		pageIndex: Math.max(0, page - 1),
		pageSize: meta?.per_page ?? 10,
	};
	const table: TablePaginationController = {
		getState: () => ({ pagination }),
		setPageSize: () => undefined,
		setPageIndex: (updater: Updater<number>) => {
			const pageIndex =
				typeof updater === 'function' ? updater(pagination.pageIndex) : updater;
			onPageChange(Math.max(1, pageIndex + 1));
		},
		getCanPreviousPage: () => page > 1,
		previousPage: () => onPageChange(Math.max(1, page - 1)),
		getPageCount: () => meta?.last_page ?? 1,
		getCanNextPage: () => Boolean(meta && page < meta.last_page),
		nextPage: () => onPageChange(page + 1),
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg'>{title}</CardTitle>
				{meta && <span className='text-sm text-zinc-500'>{meta.total} en total</span>}
			</CardHeader>
			<CardBody>
				{loading && (
					<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
				)}
				{!loading && error && (
					<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
						{error}
					</Alert>
				)}
				{!loading && !error && meta?.total === 0 && (
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>{emptyLabel}</p>
				)}
			</CardBody>
			{meta && !error && meta.total > 0 && (
				<TableCardFooterTemplateV2 table={table} isDisabled={loading} />
			)}
		</Card>
	);
};

export default RelatedListCard;
