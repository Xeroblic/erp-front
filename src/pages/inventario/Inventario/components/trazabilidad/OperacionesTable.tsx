import React, { Fragment, useMemo } from 'react';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import type { IInventoryOperationRow } from '@/interface/inventoryOperations.interface';
import type { IWarehouseCompact } from '@/interface/procurement.interface';
import InventarioPagination from '@/pages/inventario/Inventario/components/parts/InventarioPagination';
import OperacionDetalle from '@/pages/inventario/Inventario/components/trazabilidad/OperacionDetalle';
import type { TInventarioTrazabilidad } from '@/pages/inventario/Inventario/hooks/useInventarioTrazabilidad';
import {
	OPERACION_TIPOS_DOCUMENTALES,
	operacionTipoInfo,
} from '@/pages/inventario/Inventario/types';

const COLUMN_COUNT = 6;

const pad = (value: number): string => String(value).padStart(2, '0');

/** Fecha y hora locales del momento de la operación. */
const fechaHora = (timestamp: string): { fecha: string; hora: string } | null => {
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return null;
	return {
		fecha: `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`,
		hora: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
	};
};

const Unidades = ({ operation }: { operation: IInventoryOperationRow }) => {
	const units = operation.summary.units_affected;
	if (units === 0 && OPERACION_TIPOS_DOCUMENTALES.includes(operation.operation_type))
		return <span className='text-sm text-zinc-500'>Sin cambio físico</span>;
	return <span className='font-semibold tabular-nums'>{units.toLocaleString('es-CL')}</span>;
};

const OperacionCelda = ({ operation }: { operation: IInventoryOperationRow }) => {
	const tipo = operacionTipoInfo(operation.operation_type);
	return (
		<div className='flex items-center gap-3'>
			<span
				className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tipo.accent}`}>
				<Icon icon={tipo.icon} size='text-lg' color='white' aria-hidden='true' />
			</span>
			<div>
				<p className='font-medium'>{operation.title}</p>
				{tipo.label !== operation.title && (
					<p className='text-sm text-zinc-500'>{tipo.label}</p>
				)}
			</div>
		</div>
	);
};

interface IOperacionesTableProps {
	title: string;
	/** Frase bajo el título: qué muestra la lista. */
	description: string;
	data: TInventarioTrazabilidad;
	warehouses: IWarehouseCompact[];
	hasFilters: boolean;
	/** Algún filtro elige productos: el detalle destaca los ítems que coinciden. */
	highlightMatches: boolean;
	onPaginate: (page: number, perPage: number) => void;
}

/**
 * Operaciones de stock de la sucursal, de la más nueva a la más antigua. Cada
 * fila es un acto completo (una recepción, un traslado, un ajuste) y se
 * despliega para ver qué productos movió y cómo quedó cada ubicación.
 */
const OperacionesTable: React.FC<IOperacionesTableProps> = ({
	title,
	description,
	data,
	warehouses,
	hasFilters,
	highlightMatches,
	onPaginate,
}) => {
	const { response, loading, error, refresh, expanded, toggle, detailOf, retryDetail } = data;
	const warehousesById = useMemo(
		() => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])),
		[warehouses],
	);

	let body: React.ReactNode;
	if (loading)
		body = Array.from({ length: 5 }, (_, rowIndex) => (
			<Tr key={`operaciones-skeleton-${rowIndex}`}>
				{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
					<Td key={`operaciones-skeleton-${rowIndex}-${cellIndex}`}>
						<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
					</Td>
				))}
			</Tr>
		));
	else if (!response || response.data.length === 0)
		body = (
			<Tr>
				<Td colSpan={COLUMN_COUNT} className='py-8 text-center text-zinc-500'>
					{hasFilters
						? 'No hay operaciones para estos filtros.'
						: 'Todavía no hay operaciones registradas.'}
				</Td>
			</Tr>
		);
	else
		body = response.data.map((operation) => {
			const isOpen = expanded.includes(operation.id);
			const detailId = `operacion-${operation.id}`;
			const momento = fechaHora(operation.occurred_at);
			return (
				<Fragment key={operation.id}>
					<Tr>
						<Td>
							{momento ? (
								<>
									<p className='font-medium tabular-nums'>{momento.fecha}</p>
									<p className='text-sm tabular-nums text-zinc-500'>
										{momento.hora}
									</p>
								</>
							) : (
								<span className='text-zinc-400'>—</span>
							)}
						</Td>
						<Td>
							<OperacionCelda operation={operation} />
						</Td>
						<Td>
							{operation.reason ? (
								<p>{operation.reason}</p>
							) : (
								<p className='text-zinc-400'>Sin motivo</p>
							)}
							{operation.actor && (
								<p className='text-sm text-zinc-500'>Por {operation.actor.name}</p>
							)}
						</Td>
						<Td className='text-right tabular-nums'>
							{operation.summary.products_count.toLocaleString('es-CL')}
						</Td>
						<Td className='text-right'>
							<Unidades operation={operation} />
						</Td>
						<Td>
							<div className='flex justify-center'>
								<Button
									size='sm'
									variant='outline'
									icon={isOpen ? 'HeroChevronUp' : 'HeroChevronDown'}
									aria-expanded={isOpen}
									aria-controls={detailId}
									onClick={() => toggle(operation.id)}>
									{isOpen ? 'Ocultar' : 'Ver detalle'}
								</Button>
							</div>
						</Td>
					</Tr>
					{isOpen && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='bg-zinc-50 dark:bg-zinc-900/40'>
								<div id={detailId}>
									<OperacionDetalle
										state={detailOf(operation.id)}
										warehouses={warehousesById}
										highlightMatches={highlightMatches}
										onRetry={() => retryDetail(operation.id)}
									/>
								</div>
							</Td>
						</Tr>
					)}
				</Fragment>
			);
		});

	return (
		<Card>
			<CardHeader>
				<div>
					<CardTitle className='text-lg'>{title}</CardTitle>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>{description}</p>
				</div>
				{!error && response && (
					<span className='text-sm text-zinc-500'>
						{response.meta.total.toLocaleString('es-CL')}{' '}
						{response.meta.total === 1 ? 'operación' : 'operaciones'}
					</span>
				)}
			</CardHeader>
			{error ? (
				<CardBody>
					<Alert color='red' variant='outline' title='No pudimos cargar la trazabilidad'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{error}</span>
							<Button size='sm' variant='outline' onClick={refresh}>
								Reintentar
							</Button>
						</div>
					</Alert>
				</CardBody>
			) : (
				<CardBody className='overflow-x-auto p-0'>
					<Table aria-label={title} className='min-w-[860px]'>
						<THead>
							<Tr>
								<Th scope='col'>Fecha</Th>
								<Th scope='col'>Operación</Th>
								<Th scope='col'>Motivo</Th>
								<Th scope='col' className='text-right'>
									Productos
								</Th>
								<Th scope='col' className='text-right'>
									Unidades
								</Th>
								<Th scope='col' className='text-center'>
									Detalle
								</Th>
							</Tr>
						</THead>
						<TBody>{body}</TBody>
					</Table>
				</CardBody>
			)}
			{!error && response && (
				<InventarioPagination
					meta={response.meta}
					loading={loading}
					onChange={onPaginate}
				/>
			)}
		</Card>
	);
};

export default OperacionesTable;
