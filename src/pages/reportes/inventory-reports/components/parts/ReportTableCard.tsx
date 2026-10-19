import React, { type ReactNode } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Tr } from '@/components/ui/Table';
import type { IApiPaginationMeta } from '@/interface/procurement.interface';
import InventarioPagination from '@/pages/inventario/Inventario/components/parts/InventarioPagination';
import type { IReportPage } from '@/pages/reportes/inventory-reports/utils';

const SKELETON_ROWS = 5;

interface IReportTableCardProps {
	title: string;
	/** Qué muestra y para qué alcance (sucursal o todas). */
	description: string;
	ariaLabel: string;
	/** Ancho mínimo de la tabla antes de desplazarse, p. ej. `min-w-[760px]`. */
	minWidthClass: string;
	/** Fila de cabeceras (`<Th>` o `SortableTableHeader`). */
	head: ReactNode;
	columnCount: number;
	/** Página visible; también da el total del encabezado y el paginador. */
	page: IReportPage<unknown>;
	perPage: number;
	onPaginate: (page: number, perPage: number) => void;
	loading: boolean;
	hasError: boolean;
	emptyTitle: string;
	emptyHint: string;
	/** Acciones de la cabecera, como exportar. */
	headerActions?: ReactNode;
	/** Qué cuenta el total: singular y plural. */
	itemLabel?: [string, string];
	/** Filas de la página. */
	children: ReactNode;
}

/**
 * Tarjeta de tabla de los reportes, con la misma estructura que la lista de
 * Inventario: título y total en la cabecera, esqueleto mientras carga,
 * mensajes de error y vacío dentro de la tabla, y el paginador estándar.
 */
const ReportTableCard: React.FC<IReportTableCardProps> = ({
	title,
	description,
	ariaLabel,
	minWidthClass,
	head,
	columnCount,
	page,
	perPage,
	onPaginate,
	loading,
	hasError,
	emptyTitle,
	emptyHint,
	headerActions,
	itemLabel = ['producto', 'productos'],
	children,
}) => {
	const meta: IApiPaginationMeta = {
		current_page: page.page,
		last_page: page.lastPage,
		per_page: perPage,
		total: page.total,
		from: page.total === 0 ? null : (page.page - 1) * perPage + 1,
		to: page.total === 0 ? null : (page.page - 1) * perPage + page.rows.length,
		links: [],
		path: '',
	};

	return (
		<Card>
			<CardHeader>
				<div className='min-w-0'>
					<CardTitle className='text-lg'>{title}</CardTitle>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>{description}</p>
				</div>
				<div className='flex flex-wrap items-center gap-3'>
					{!loading && !hasError && (
						<span className='text-sm text-zinc-500'>
							{page.total} {page.total === 1 ? itemLabel[0] : itemLabel[1]}
						</span>
					)}
					{headerActions}
				</div>
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table aria-label={ariaLabel} className={minWidthClass}>
					<THead>{head}</THead>
					<TBody>
						{loading &&
							Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
								<Tr key={`reporte-skeleton-${rowIndex}`}>
									{Array.from({ length: columnCount }, (_cell, cellIndex) => (
										<Td key={`reporte-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && hasError && (
							<Tr>
								<Td colSpan={columnCount} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										No fue posible mostrar el reporte
									</p>
								</Td>
							</Tr>
						)}
						{!loading && !hasError && page.total === 0 && (
							<Tr>
								<Td colSpan={columnCount} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{emptyTitle}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>{emptyHint}</p>
								</Td>
							</Tr>
						)}
						{!loading && !hasError && children}
					</TBody>
				</Table>
			</CardBody>
			{!loading && !hasError && page.total > 0 && (
				<InventarioPagination meta={meta} loading={loading} onChange={onPaginate} />
			)}
		</Card>
	);
};

export default ReportTableCard;
