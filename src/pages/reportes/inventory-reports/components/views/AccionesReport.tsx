import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusPill } from '@/components/procurement';
import Button from '@/components/ui/Button';
import { Td, Th, Tr } from '@/components/ui/Table';
import useCan from '@/hooks/useCan';
import { supplierDetailLink, type IPageLink } from '@/config/procurementLinks';
import type {
	IReplenishmentReportRow,
	TReplenishmentStatus,
} from '@/interface/inventoryReports.interface';
import {
	inventarioProductoComprasLink,
	inventarioProductoLink,
} from '@/pages/inventario/Inventario/types';
import type { TInventoryReportFiltersApi } from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';
import useAccionesReport from '@/pages/reportes/inventory-reports/hooks/useAccionesReport';
import InventoryReportFilters from '@/pages/reportes/inventory-reports/components/filters/InventoryReportFilters';
import ReportTableCard from '@/pages/reportes/inventory-reports/components/parts/ReportTableCard';
import { ReportLoadError } from '@/pages/reportes/inventory-reports/components/parts/ReportNotices';
import {
	EmptyCell,
	formatReportDate,
	ProductCell,
	UnitsCell,
} from '@/pages/reportes/inventory-reports/components/parts/ReportCells';
import { REPLENISHMENT_STATUSES } from '@/services/reports/inventoryReports.service';
import {
	REPLENISHMENT_COLORS,
	REPLENISHMENT_LABELS,
	type IInventoryReportContext,
} from '@/pages/reportes/inventory-reports/types';

const COLUMN_COUNT = 6;

const plural = (count: number, singular: string, pluralForm: string): string =>
	`${count} ${count === 1 ? singular : pluralForm}`;

/**
 * El sugerido con su última compra o, sin sugerido, cuántos proveedores le
 * vendieron y cuántos podrían sugerirse: el detalle por proveedor está en la
 * sección «Compras» de la ficha.
 */
const SupplierCell: React.FC<{ recommendation: IReplenishmentReportRow['recommendation'] }> = ({
	recommendation,
}) => {
	const { supplier, last_purchase: lastPurchase } = recommendation;
	if (supplier)
		return (
			<div className='max-w-[240px] min-w-0'>
				<p
					className='line-clamp-2 text-sm font-semibold wrap-break-word'
					title={supplier.display_name}>
					{supplier.display_name}
				</p>
				{lastPurchase && (
					<p className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
						Última compra el {formatReportDate(lastPurchase.received_on)} (hace{' '}
						{plural(lastPurchase.days_since_purchase, 'día', 'días')})
					</p>
				)}
			</div>
		);
	return (
		<div className='max-w-[240px] min-w-0 text-sm text-zinc-600 dark:text-zinc-300'>
			<p>
				{plural(
					recommendation.historical_supplier_count,
					'proveedor con compras',
					'proveedores con compras',
				)}
			</p>
			<p className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
				{plural(recommendation.eligible_supplier_count, 'elegible', 'elegibles')}
			</p>
		</div>
	);
};

/** Disponible de la filial; negativo tras un faltante real (reservas sobre lo apto). */
const AvailableCell: React.FC<{ value: number }> = ({ value }) => (
	<div className='flex flex-col items-end'>
		<UnitsCell value={value} emphasis />
		{value < 0 && (
			<span className='text-xs font-medium text-red-700 dark:text-red-300'>
				Reservado sobre lo apto
			</span>
		)}
	</div>
);

interface IStatusTabsProps {
	active: TReplenishmentStatus | null;
	counts: Record<TReplenishmentStatus, number> | null;
	total: number | null;
	onChange: (status: TReplenishmentStatus | null) => void;
}

/**
 * Pestañas por estado de la recomendación. Los números son `status_counts`,
 * que ignoran el estado elegido: cada pestaña conserva el suyo mientras se
 * lista otra. Mientras no llega la primera respuesta, sin número.
 */
const StatusTabs: React.FC<IStatusTabsProps> = ({ active, counts, total, onChange }) => {
	const options: { value: TReplenishmentStatus | null; label: string; count: number | null }[] = [
		{ value: null, label: 'Todos', count: total },
		...REPLENISHMENT_STATUSES.map((status) => ({
			value: status,
			label: REPLENISHMENT_LABELS[status],
			count: counts ? counts[status] : null,
		})),
	];
	return (
		<div role='group' aria-label='Estado de la recomendación' className='flex flex-wrap gap-2'>
			{options.map((option) => (
				<Button
					key={option.value ?? 'todos'}
					size='sm'
					variant={option.value === active ? 'solid' : 'outline'}
					aria-pressed={option.value === active}
					onClick={() => onChange(option.value)}>
					{option.count === null ? option.label : `${option.label} · ${option.count}`}
				</Button>
			))}
		</div>
	);
};

interface IAccionesReportProps {
	context: IInventoryReportContext;
	filtersApi: TInventoryReportFiltersApi;
}

/**
 * Acciones: productos en stock crítico de la empresa, lo más urgente primero,
 * con el proveedor al que conviene comprarle según las compras anteriores
 * (`GET P/replenishment-candidates`, §13). El orden es el del backend y no se
 * cambia; tampoco hay sucursal: el stock es de la filial. El contrato no
 * sugiere cantidad a comprar y no se exporta: el backend no lo ofrece.
 */
const AccionesReport: React.FC<IAccionesReportProps> = ({ context, filtersApi }) => {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const { all } = useCan();
	const { filters, setBusqueda, setReposicion, paginate, limpiar } = filtersApi;
	const data = useAccionesReport(context, filters);
	const hasSearch = filters.busqueda.trim() !== '';

	const { lastPageIfOutOfRange } = data;
	useEffect(() => {
		if (lastPageIfOutOfRange !== null) paginate(lastPageIfOutOfRange, filters.perPage);
	}, [lastPageIfOutOfRange, filters.perPage, paginate]);

	/** Sólo con **todo** el `authority` de la ruta destino, la regla de `AuthorityCheck`. */
	const canOpen = (link: IPageLink): boolean => all([...link.authority]);
	const open = (link: IPageLink) =>
		navigate(link.to, { state: { from: `${pathname}${search}` } });

	let emptyTitle = 'No hay nada que reponer';
	let emptyHint = 'Ningún producto con umbral tiene el disponible en o bajo él.';
	if (hasSearch) {
		emptyTitle = 'Ningún producto coincide con la búsqueda';
		emptyHint = 'Prueba con otro nombre, SKU o código de barras.';
	} else if (filters.reposicion) {
		emptyTitle = `Ningún producto en «${REPLENISHMENT_LABELS[filters.reposicion]}»`;
		emptyHint = 'Elige otro estado o «Todos».';
	}

	return (
		<div className='space-y-4'>
			{data.error && <ReportLoadError error={data.error} onRetry={data.refresh} />}
			<InventoryReportFilters
				branches={context.branches}
				busqueda={filters.busqueda}
				onBusqueda={setBusqueda}
				onLimpiar={limpiar}
			/>
			<StatusTabs
				active={filters.reposicion}
				counts={data.statusCounts}
				total={data.totalCount}
				onChange={setReposicion}
			/>
			<ReportTableCard
				title='Qué reponer'
				description='Productos en stock crítico de la empresa, lo más urgente primero, y el proveedor al que conviene comprarle'
				ariaLabel='Reporte de reposición'
				minWidthClass='min-w-[1040px]'
				columnCount={COLUMN_COUNT}
				head={
					<Tr>
						<Th scope='col'>Producto</Th>
						<Th scope='col' className='text-right'>
							Disponible
						</Th>
						<Th scope='col' className='text-right'>
							Umbral
						</Th>
						<Th scope='col'>Proveedor sugerido</Th>
						<Th scope='col' className='text-center'>
							Recomendación
						</Th>
						<Th scope='col' className='text-center'>
							Acciones
						</Th>
					</Tr>
				}
				page={data.page}
				perPage={filters.perPage}
				onPaginate={paginate}
				loading={data.loading}
				hasError={Boolean(data.error)}
				emptyTitle={emptyTitle}
				emptyHint={emptyHint}>
				{data.page.rows.map((row) => {
					const { supplier } = row.recommendation;
					const productLink = inventarioProductoLink(row.product.id);
					const purchasesLink = inventarioProductoComprasLink(row.product.id);
					const supplierLink = supplier ? supplierDetailLink(supplier.id) : null;
					return (
						<Tr key={row.product.id}>
							<Td>
								<ProductCell name={row.product.name} sku={row.product.sku} />
							</Td>
							<Td className='text-right'>
								<AvailableCell value={row.stock.available_quantity} />
							</Td>
							<Td className='text-right'>
								{row.stock.threshold === null ? (
									<EmptyCell />
								) : (
									<UnitsCell value={row.stock.threshold} />
								)}
							</Td>
							<Td>
								<SupplierCell recommendation={row.recommendation} />
							</Td>
							<Td className='text-center'>
								<StatusPill
									color={REPLENISHMENT_COLORS[row.recommendation.status]}
									width={10}>
									{REPLENISHMENT_LABELS[row.recommendation.status]}
								</StatusPill>
							</Td>
							<Td>
								<div className='flex flex-wrap justify-center gap-2'>
									{canOpen(productLink) && (
										<Button
											size='sm'
											variant='outline'
											icon='HeroEye'
											color='violet'
											aria-label={`Ver ficha de ${row.product.name}`}
											onClick={() => open(productLink)}>
											Ficha
										</Button>
									)}
									{canOpen(purchasesLink) && (
										<Button
											size='sm'
											variant='outline'
											icon='HeroShoppingCart'
											aria-label={`Ver compras de ${row.product.name}`}
											onClick={() => open(purchasesLink)}>
											Compras
										</Button>
									)}
									{supplier && supplierLink && canOpen(supplierLink) && (
										<Button
											size='sm'
											variant='outline'
											icon='HeroTruck'
											aria-label={`Ver proveedor ${supplier.display_name}`}
											onClick={() => open(supplierLink)}>
											Proveedor
										</Button>
									)}
								</div>
							</Td>
						</Tr>
					);
				})}
			</ReportTableCard>
		</div>
	);
};

export default AccionesReport;
