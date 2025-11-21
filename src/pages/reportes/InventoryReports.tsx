import React, { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import ReportFilters, { ReportFiltersState } from './components/ReportFilters';
import DataTable from '@/components/ui/DataTable';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import { clearResults } from '@/store/slices/reports/reportSlice';
import ReportExportButton from './ReportExportButton';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';

type Row = {
	sku: string;
	nombre: string;
	bodega: string;
	stock: number;
};

const InventoryReports: React.FC = () => {
	const [filters, setFilters] = useState<ReportFiltersState>({});
	const dispatch = useAppDispatch();
	const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const resultsData = useAppSelector((s) => s.reports.results);

	// NORMALIZAR DATOS DEL API
	const results = (() => {
		if (!resultsData) return [];
		if (Array.isArray(resultsData)) return resultsData;

		if (resultsData && typeof resultsData === 'object' && 'data' in resultsData) {
			const extracted = (resultsData as any).data;
			return Array.isArray(extracted) ? extracted : [];
		}

		return [];
	})();

	const reportsLoading = useAppSelector((s) => s.reports.loading);
	const reportsError = useAppSelector((s) => s.reports.error);

	// FILTROS → API
	const mapFilters = (f: ReportFiltersState) => {
		const out: Record<string, any> = {};

		if (f.dateFrom) out.date_from = f.dateFrom;
		if (f.dateTo) out.date_to = f.dateTo;

		if (f.branch) {
			const num = Number(String(f.branch).replace(/\D/g, ''));
			if (!Number.isNaN(num) && num > 0) out.branch_id = num;
		}

		return out;
	};

	// LIMPIAR RESULTADOS AL DESMONTAR
	useEffect(() => {
		return () => {
			dispatch(clearResults());
		};
	}, [dispatch]);

	// CARGAR REPORTES (CON FIX DE DOBLE LLAMADA)
	useEffect(() => {
		const sid = Number(currentSubsidiaryId ?? 0);
		if (!sid) return;

		// 1. Guardamos la promesa que devuelve el dispatch
		const promise = dispatch(
			fetchReportResults({
				subsidiaryId: sid,
				type: 'stock',
				filters: mapFilters(filters),
			}) as any,
		);

		// 2. Función de limpieza: Si el componente se desmonta o los filtros cambian rápido,
		// cancelamos la petición anterior. Esto detiene el bucle while en el Thunk.
		return () => {
			promise.abort();
		};
	}, [currentSubsidiaryId, filters, dispatch]);

	// MAPEO REAL DEL API
	const rows = useMemo(() => {
		return results.map((r: any) => ({
			sku: r.sku ?? '—',
			nombre: r.product_name ?? '—',
			bodega: r.warehouse_name ?? r.branch_name ?? '—',
			stock: Number(r.quantity ?? 0),
		})) as Row[];
	}, [results]);

	// **SOLO ESTAS COLUMNAS** (SKU, Producto, Bodega, Stock)
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
		],
		[],
	);

	return (
		<PageWrapper title='Reportes de inventario'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<div className='flex items-center gap-2 text-emerald-800 dark:text-emerald-200'>
							<Icon icon='HeroCubeTransparent' className='h-5 w-5' />
							<Badge className='text-3xl font-semibold'>Reportes de inventario</Badge>
						</div>
						<p>Existencias, SKUs y valoración</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<ReportExportButton
						subsidiaryId={Number(currentSubsidiaryId ?? 0)}
						type='stock'
						filters={mapFilters(filters)}
					/>
				</SubheaderRight>
			</Subheader>
			<Container>
				<div className='space-y-6'>
					{reportsLoading && (
						<div className='p-4 text-sm text-zinc-500'>
							Cargando datos de inventario...
						</div>
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
			</Container>
		</PageWrapper>
	);
};

export default InventoryReports;
