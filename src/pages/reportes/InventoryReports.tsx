import React, { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import ReportFilters, { ReportFiltersState } from './components/ReportFilters';
import DataTable from '@/components/ui/DataTable';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import { clearResults } from '@/store/slices/reports/reportSlice';
import ReportExportButton from './ReportExportButton';

type Row = { sku: string; nombre: string; bodega: string; stock: number; precio: number };

const InventoryReports: React.FC = () => {
	const [filters, setFilters] = useState<ReportFiltersState>({});
	const dispatch = useAppDispatch();
	const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const resultsData = useAppSelector((s) => s.reports.results);
	// Extraer datos: resultsData puede ser { data: [...], meta: {...} } o directamente un array
	const results = (() => {
		if (!resultsData) return [];
		if (Array.isArray(resultsData)) return resultsData;
		// Si es un objeto, intentar extraer data
		if (resultsData && typeof resultsData === 'object' && 'data' in resultsData) {
			const extracted = (resultsData as any).data;
			return Array.isArray(extracted) ? extracted : [];
		}
		return [];
	})();
	const reportsLoading = useAppSelector((s) => s.reports.loading);
	const reportsError = useAppSelector((s) => s.reports.error);

	const mapFilters = (f: ReportFiltersState) => {
		const out: Record<string, any> = {
			// No incluir per_page - el thunk obtendrá todas las páginas automáticamente
		};
		if (f.dateFrom) out.date_from = f.dateFrom;
		if (f.dateTo) out.date_to = f.dateTo;
		if (typeof f.priceMin === 'number') out.price_min = f.priceMin;
		if (typeof f.priceMax === 'number') out.price_max = f.priceMax;
		if (f.customer) {
			const num = Number(String(f.customer).replace(/\D/g, ''));
			if (!Number.isNaN(num) && num > 0) out.customer_id = num;
			else out.q = f.customer;
		}
		if (f.branch) {
			const num = Number(String(f.branch).replace(/\D/g, ''));
			if (!Number.isNaN(num) && num > 0) out.branch_id = num;
		}
		return out;
	};

	// Limpiar resultados cuando se monta el componente o cambia el subsidiary
	useEffect(() => {
		dispatch(clearResults());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return;
		const mapped = mapFilters(filters);
		// Usar 'stock' como tipo de API (inventory en URL se mapea a stock en API)
		dispatch(fetchReportResults({ subsidiaryId: sid, type: 'stock', filters: mapped }) as any);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentSubsidiaryId, filters]);

	const rows = useMemo(() => {
		if (!results) return [] as Row[];

		const mapped = results.map((r: any) => {
			const sku = r?.sku ?? r?.code ?? r?.product_sku ?? '—';
			const nombre = r?.name ?? r?.product_name ?? r?.descripcion ?? '—';
			const bodega = r?.warehouse ?? r?.bodega ?? r?.branch ?? '—';
			const stock = Number(r?.stock ?? r?.qty ?? 0) || 0;
			const precio = Number(r?.price ?? r?.precio ?? 0) || 0;
			return { sku, nombre, bodega, stock, precio } as Row;
		});

		// aplicar filtros de precio / branch si existen
		return mapped.filter((r: Row) => {
			const priceMin = filters.priceMin === '' ? 0 : Number(filters.priceMin ?? 0);
			const priceMax =
				filters.priceMax === '' ? Infinity : Number(filters.priceMax ?? Infinity);
			const okPrice = r.precio >= priceMin && r.precio <= priceMax;
			const okBranch =
				!filters.branch ||
				r.bodega.toLowerCase().includes('norte') === (filters.branch === 'br-2') ||
				r.bodega.toLowerCase().includes('centro') === (filters.branch === 'br-1');
			return okPrice && okBranch;
		});
	}, [results, filters]);

	// Definir columnas para DataTable
	const columns = useMemo<ColumnDef<Row>[]>(
		() => [
			{
				accessorKey: 'sku',
				header: 'SKU',
				cell: (info) => (
					<span className='font-mono text-sm'>{info.getValue() as string}</span>
				),
				enableSorting: true,
			},
			{
				accessorKey: 'nombre',
				header: 'Producto',
				cell: (info) => <span className='text-sm'>{info.getValue() as string}</span>,
				enableSorting: true,
			},
			{
				accessorKey: 'bodega',
				header: 'Bodega',
				cell: (info) => <span className='text-sm'>{info.getValue() as string}</span>,
				enableSorting: true,
			},
			{
				accessorKey: 'stock',
				header: 'Stock',
				cell: (info) => {
					const stock = info.getValue() as number;
					return (
						<span className={stock === 0 ? 'font-semibold text-rose-600' : 'text-sm'}>
							{stock}
						</span>
					);
				},
				enableSorting: true,
			},
			{
				accessorKey: 'precio',
				header: 'Precio',
				cell: (info) => {
					const precio = info.getValue() as number;
					return (
						<span className='text-sm'>
							${' '}
							{precio.toLocaleString('es-CL', {
								minimumFractionDigits: 0,
								maximumFractionDigits: 0,
							})}
						</span>
					);
				},
				enableSorting: true,
			},
		],
		[],
	);

	return (
		<div className='space-y-6'>
			{reportsLoading && (
				<div className='p-4 text-sm text-zinc-500'>Cargando datos de inventario...</div>
			)}
			{reportsError && (
				<Card className='border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20'>
					<CardBody>
						<div className='flex items-center justify-between'>
							<div className='text-rose-700 dark:text-rose-400'>
								<strong>Error cargando inventario:</strong>{' '}
								{typeof reportsError === 'object' && reportsError !== null
									? JSON.stringify(reportsError)
									: String(reportsError)}
							</div>
							<Button
								variant='outline'
								color='rose'
								size='sm'
								onClick={() => {
									const sid = Number(currentSubsidiaryId ?? 0);
									if (!sid) return;
									dispatch(
										fetchReportResults({
											subsidiaryId: sid,
											type: 'stock',
											filters: mapFilters(filters),
										}) as any,
									);
								}}>
								Reintentar
							</Button>
						</div>
					</CardBody>
				</Card>
			)}
			<Card className='border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-50/60 shadow-sm dark:from-emerald-900/10 dark:to-transparent'>
				<CardHeader className='rounded-t-md bg-white/60 dark:bg-zinc-900/40'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100'>
								<Icon
									icon='HeroCubeTransparent'
									className='h-6 w-6 text-emerald-700'
								/>
							</div>
							<div>
								<h2 className='text-lg font-bold text-emerald-900'>
									Reportes de Inventario
								</h2>
								<p className='text-sm text-emerald-700'>
									Existencias, SKUs y valoración
								</p>
							</div>
						</div>
						<div>
							<ReportExportButton
								subsidiaryId={Number(currentSubsidiaryId ?? 0)}
								type='stock'
								filters={mapFilters(filters)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardBody>
					<DataTable
						columns={columns}
						data={rows}
						loading={reportsLoading}
						searchPlaceholder='Buscar por SKU, producto o bodega...'
						emptyMessage='Sin resultados para los criterios seleccionados.'
						pageSize={10}
					/>
				</CardBody>
			</Card>

			<ReportFilters onApply={setFilters} />
		</div>
	);
};

export default InventoryReports;
