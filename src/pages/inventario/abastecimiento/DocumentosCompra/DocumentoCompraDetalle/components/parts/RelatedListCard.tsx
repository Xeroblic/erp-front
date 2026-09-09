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
 * `renderRow` es del llamador: esta card no sabe si la fila es un resumen de
 * recepción o una asignación de stock inicial — sólo pagina y decide el
 * estado vacío/cargando/error, igual que antes de que recepciones (card 05,
 * hallazgo 9) le diera contenido real a la primera.
 */

interface IRelatedListCardProps<TRow> {
	title: string;
	emptyLabel: string;
	subsidiaryId: number | null;
	documentId: number | null;
	fetcher: Parameters<typeof useRelatedDocumentList<TRow>>[0]['fetcher'];
	renderRow: (row: TRow) => React.ReactNode;
}

const RelatedListCard = <TRow,>({
	title,
	emptyLabel,
	subsidiaryId,
	documentId,
	fetcher,
	renderRow,
}: IRelatedListCardProps<TRow>) => {
	const { data, meta, loading, error, page, onPageChange } = useRelatedDocumentList<TRow>({
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
				{!loading && !error && data.length > 0 && (
					<ul className='divide-y divide-zinc-200 dark:divide-zinc-700'>
						{data.map((row, index) => (
							// eslint-disable-next-line react/no-array-index-key -- las filas no exponen una key propia genérica al caller.
							<li key={index} className='py-2 first:pt-0 last:pb-0'>
								{renderRow(row)}
							</li>
						))}
					</ul>
				)}
			</CardBody>
			{meta && !error && meta.total > 0 && (
				<TableCardFooterTemplateV2 table={table} isDisabled={loading} />
			)}
		</Card>
	);
};

export default RelatedListCard;
