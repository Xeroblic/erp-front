import React, { useMemo } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { formatDate } from '@/utils/format.utils';
import InventarioPagination from '@/pages/inventario/Inventario/components/parts/InventarioPagination';
import type { IPurchaseDocumentLine } from '@/interface/procurement.interface';
import useInitialStockAllocations from '../../hooks/useInitialStockAllocations';

interface IInitialStockAllocationsCardProps {
	subsidiaryId: number | null;
	documentId: number;
	/** Líneas del documento: el respaldo sólo trae `product_id`. */
	lines: readonly Pick<IPurchaseDocumentLine, 'product' | 'name_snapshot'>[];
}

/**
 * Respaldos de stock inicial hechos con este documento (§6 y §8): unidades que
 * ya estaban en bodega y se documentaron después, sin mover stock.
 *
 * Sólo lista las sucursales a las que el usuario accede, así que su total no se
 * presenta como el del documento: `related_counts.initial_stock_allocations`
 * cuenta toda la filial y puede ser mayor.
 */
const InitialStockAllocationsCard: React.FC<IInitialStockAllocationsCardProps> = ({
	subsidiaryId,
	documentId,
	lines,
}) => {
	const { visibleBranches } = useCurrentBranch();
	const { response, loading, error, paginate, retry } = useInitialStockAllocations({
		subsidiaryId,
		documentId,
	});

	const productNames = useMemo(
		() => new Map(lines.map((line) => [line.product.id, line.name_snapshot])),
		[lines],
	);
	const branchNames = useMemo(
		() => new Map(visibleBranches.map((branch) => [branch.id, branch.name])),
		[visibleBranches],
	);

	return (
		<Card>
			<CardHeader>
				<div>
					<CardTitle className='text-lg'>Asignaciones de stock inicial</CardTitle>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>
						Stock que ya estaba en bodega y se respaldó con este documento. Sólo se
						listan las de tus sucursales: el conteo de Relacionados incluye las de toda
						la filial.
					</p>
				</div>
			</CardHeader>
			<CardBody className='space-y-3'>
				{loading && !response && <p role='status'>Cargando asignaciones…</p>}
				{error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No pudimos cargar las asignaciones'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{error}</span>
							<Button size='sm' variant='outline' onClick={retry}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}
				{response && response.data.length === 0 && (
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>
						Este documento no respalda stock inicial en tus sucursales.
					</p>
				)}
				{response && response.data.length > 0 && (
					<>
						<p className='text-sm text-zinc-500 dark:text-zinc-400'>
							{response.meta.total}{' '}
							{response.meta.total === 1 ? 'asignación' : 'asignaciones'} en tus
							sucursales
						</p>
						<div className='overflow-x-auto'>
							<Table>
								<THead>
									<Tr>
										<Th>Fecha</Th>
										<Th>Sucursal</Th>
										<Th>Producto</Th>
										<Th>Ubicación</Th>
										<Th className='text-right'>Documentadas</Th>
										<Th>Motivo</Th>
									</Tr>
								</THead>
								<TBody>
									{response.data.map((allocation) => (
										<Tr key={allocation.id}>
											<Td>{formatDate(allocation.created_at)}</Td>
											<Td>
												{branchNames.get(allocation.branch_id) ??
													`Sucursal #${allocation.branch_id}`}
											</Td>
											<Td>
												{productNames.get(allocation.product_id) ??
													`Producto #${allocation.product_id}`}
											</Td>
											<Td>
												{allocation.warehouse_id === null
													? 'Sin ubicación'
													: `Bodega #${allocation.warehouse_id}`}
											</Td>
											<Td className='text-right tabular-nums'>
												{allocation.quantity}
											</Td>
											<Td>{allocation.reason}</Td>
										</Tr>
									))}
								</TBody>
							</Table>
						</div>
						<InventarioPagination
							meta={response.meta}
							loading={loading}
							onChange={paginate}
						/>
					</>
				)}
			</CardBody>
		</Card>
	);
};

export default InitialStockAllocationsCard;
