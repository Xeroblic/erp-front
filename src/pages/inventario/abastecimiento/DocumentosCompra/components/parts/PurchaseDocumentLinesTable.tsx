import React from 'react';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProductCard, CostBlock, WarehouseLabel } from '@/components/procurement';
import type { IPurchaseDocumentLine } from '@/interface/procurement.interface';

/**
 * Líneas del documento con su cobertura (sección 6). `remaining_quantity`
 * nunca se muestra negativo — el contrato lo calcula así, pero un mock que
 * lo repitiera sin cuidado dejaría pasar un dato imposible.
 */

interface IPurchaseDocumentLinesTableProps {
	lines: IPurchaseDocumentLine[];
	hasCoverage: boolean;
}

const CoverageStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
	<div className='flex flex-col items-center rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800'>
		<span className='text-xs text-zinc-500 dark:text-zinc-400'>{label}</span>
		<span className='text-base font-semibold tabular-nums'>{Math.max(0, value)}</span>
	</div>
);

const PurchaseDocumentLinesTable: React.FC<IPurchaseDocumentLinesTableProps> = ({
	lines,
	hasCoverage,
}) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Líneas</CardTitle>
			<span className='text-sm text-zinc-500'>
				{lines.length} línea{lines.length === 1 ? '' : 's'}
			</span>
		</CardHeader>
		<CardBody className='space-y-4'>
			{lines.map((line) => (
				<div
					key={line.id}
					className='space-y-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700'>
					<ProductCard
						product={line.product}
						density='comfortable'
						showCatalogPricing={false}
						aside={
							<div className='text-right'>
								<p className='text-xs text-zinc-500 dark:text-zinc-400'>Cantidad</p>
								<p className='text-lg font-semibold tabular-nums'>
									{line.quantity}
								</p>
							</div>
						}
					/>

					{(line.sku_snapshot !== line.product.sku ||
						line.name_snapshot !== line.product.name) && (
						<p className='text-xs text-amber-700 dark:text-amber-400'>
							Comprado como <strong>{line.name_snapshot}</strong> ({line.sku_snapshot}
							); el catálogo cambió después.
						</p>
					)}

					{line.notes && (
						<p className='text-sm text-zinc-600 dark:text-zinc-300'>{line.notes}</p>
					)}

					<CostBlock cost={line.cost} />

					{hasCoverage && (
						<div className='space-y-2'>
							<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
								<CoverageStat label='Recibido' value={line.received_quantity} />
								<CoverageStat
									label='Stock inicial'
									value={line.initial_stock_allocated_quantity}
								/>
								<CoverageStat label='Cubierto' value={line.accounted_quantity} />
								<CoverageStat label='Pendiente' value={line.remaining_quantity} />
							</div>
							{line.received_distribution.length > 0 && (
								<div className='flex flex-wrap gap-1.5'>
									{line.received_distribution.map((row, index) => (
										<Badge
											// eslint-disable-next-line react/no-array-index-key -- la fila no trae un id propio.
											key={`${line.id}-distribution-${index}`}
											variant='outline'
											color='zinc'
											className='text-xs'>
											<WarehouseLabel warehouse={row.warehouse} /> ·{' '}
											{row.quantity}
										</Badge>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			))}
		</CardBody>
	</Card>
);

export default PurchaseDocumentLinesTable;
