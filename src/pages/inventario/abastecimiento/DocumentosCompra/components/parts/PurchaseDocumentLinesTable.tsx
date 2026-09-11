import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import { ProductCard, CostBlock, WarehouseLabel } from '@/components/procurement';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import type { IPurchaseDocumentLine } from '@/interface/procurement.interface';

/**
 * Líneas del documento con su cobertura (sección 6). `remaining_quantity`
 * nunca se muestra negativo — el contrato lo calcula así, pero un mock que
 * lo repitiera sin cuidado dejaría pasar un dato imposible.
 *
 * Cada línea nace **compacta** (producto, cantidad, costo efectivo) y se
 * expande a pedido para el resto: notas, desglose de costo completo y
 * cobertura de recepción. Con documentos de muchas líneas, mostrar todo
 * siempre convertía esta card en un muro de texto — igual que
 * `TimelineItem` en trazabilidad, cada línea guarda su propio estado de
 * expansión.
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

interface ILineRowProps {
	line: IPurchaseDocumentLine;
	hasCoverage: boolean;
}

const LineRow: React.FC<ILineRowProps> = ({ line, hasCoverage }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const isMismatched =
		line.sku_snapshot !== line.product.sku || line.name_snapshot !== line.product.name;
	const detailsId = `purchase-document-line-${line.id}-details`;
	const effectiveUnitAmount = formatDecimalAmount(
		line.cost.effective_unit_amount,
		line.cost.currency_code,
	);

	return (
		<div className='rounded-xl border border-zinc-200 dark:border-zinc-700'>
			<button
				type='button'
				onClick={() => setIsExpanded((previous) => !previous)}
				aria-expanded={isExpanded}
				aria-controls={detailsId}
				aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} detalle de la línea de ${line.product.name}`}
				className='flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60'>
				<div className='min-w-0 grow'>
					<ProductCard
						product={line.product}
						density='compact'
						showCatalogPricing={false}
					/>
				</div>
				<div className='flex shrink-0 items-center gap-4'>
					<div className='text-right'>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>Cantidad</p>
						<p className='text-base font-semibold tabular-nums'>{line.quantity}</p>
					</div>
					<div className='text-right'>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>Costo efectivo</p>
						<p className='text-base font-semibold tabular-nums'>
							{effectiveUnitAmount ?? 'Desconocido'}
						</p>
					</div>
					{isMismatched && (
						<Icon
							icon='HeroExclamationTriangle'
							className='shrink-0 text-amber-500'
							aria-label='El catálogo cambió después de esta compra'
						/>
					)}
					{/*
					 * Un solo ícono que rota, no dos íconos que se alternan: `Icon`
					 * carga cada nombre de forma asíncrona y pinta `null` mientras
					 * tanto — alternar `HeroChevronUp`/`HeroChevronDown` hacía que la
					 * flecha desapareciera un instante en cada clic y el `grow` del
					 * `ProductCard` de al lado ocupara ese espacio, corriendo el
					 * texto. Mismo patrón que `WebhookCatalogPanel`. */}
					<Icon
						icon='HeroChevronDown'
						className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
							isExpanded ? 'rotate-180' : ''
						}`}
					/>
				</div>
			</button>

			{isExpanded && (
				<div
					id={detailsId}
					className='space-y-3 border-t border-zinc-200 p-3 dark:border-zinc-700'>
					{isMismatched && (
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
			)}
		</div>
	);
};

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
		<CardBody className='space-y-2'>
			{lines.map((line) => (
				<LineRow key={line.id} line={line} hasCoverage={hasCoverage} />
			))}
		</CardBody>
	</Card>
);

export default PurchaseDocumentLinesTable;
