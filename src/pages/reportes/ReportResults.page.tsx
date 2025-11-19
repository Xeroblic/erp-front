import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import type { IReportFilters } from '@/interface/reports.interface';
import ReportFilters from './components/ReportFilters';
import ReportResultsTable from './ReportResultsTable';
import ReportExportButton from './ReportExportButton';
import SalesDashboard from './SalesDashboard';
import FinancialReports from './FinancialReports';
import InventoryReports from './InventoryReports';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';

const ReportResultsPage: React.FC = () => {
	const { subsidiaryId, type } = useParams<{ subsidiaryId: string; type: string }>();
	const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const [searchParams, setSearchParams] = useSearchParams();
	const [filters, setFilters] = useState<IReportFilters>({});
	const [filterState, setFilterState] = useState<any>({});
	const dispatch = useAppDispatch();
	const loading = useAppSelector((s) => s.reports.loading);
	const results = useAppSelector((s) => s.reports.results);

	// Inicializar filtros desde querystring
	useEffect(() => {
		const next: IReportFilters = {};
		for (const [k, v] of searchParams.entries()) {
			if (v === '') continue;
			// intentar parsear números
			const num = Number(v);
			(next as any)[k] = Number.isNaN(num) ? v : num;
		}
		setFilters(next);
	}, [searchParams]);

	// Mapear tipos de reporte de la URL a los tipos que espera el backend
	// Según la documentación, los tipos válidos son: sales, stock, users, movements
	const mapReportType = (urlType: string): string => {
		const typeMap: Record<string, string> = {
			inventory: 'stock', // 'inventory' en URL -> 'stock' en API
			financial: 'sales', // 'financial' no existe en backend, usar 'sales' como fallback
			sales: 'sales',
			stock: 'stock',
			users: 'users',
			movements: 'movements',
		};
		return typeMap[urlType] || urlType;
	};

	// Cuando cambia subsidiaryId o type, disparar fetch via thunk
	useEffect(() => {
		const sid = Number(subsidiaryId ?? currentSubsidiaryId ?? 0);
		if (!sid || !type) return;
		const apiType = mapReportType(type);
		// El thunk obtendrá todas las páginas automáticamente
		dispatch(fetchReportResults({ subsidiaryId: sid, type: apiType, filters }) as any);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subsidiaryId, type, currentSubsidiaryId]);

	const applyFilters = () => {
		// reflejar en query string
		const next = new URLSearchParams();
		Object.entries(filters).forEach(([k, v]) => {
			if (v === undefined || v === null) return;
			next.set(k, String(v));
		});
		setSearchParams(next);
		const sid = Number(subsidiaryId ?? currentSubsidiaryId ?? 0);
		if (!sid || !type) return;
		const apiType = mapReportType(type);
		// El thunk obtendrá todas las páginas automáticamente
		dispatch(fetchReportResults({ subsidiaryId: sid, type: apiType, filters }) as any);
	};

	// Renderizar componente específico según el tipo de reporte
	const renderReportContent = () => {
		if (!type) return null;

		// Reportes con dashboard especial
		if (type === 'sales') {
			return <SalesDashboard />;
		}

		if (type === 'financial') {
			return <FinancialReports />;
		}

		if (type === 'inventory' || type === 'stock') {
			return <InventoryReports />;
		}

		// Para otros tipos de reporte, mostrar tabla genérica
		return (
			<>
				<div className='mb-4 flex items-center justify-between'>
					<h1 className='text-2xl font-semibold'>Reporte: {type}</h1>
					<div>
						<ReportExportButton
							subsidiaryId={Number(subsidiaryId ?? currentSubsidiaryId ?? 0)}
							type={mapReportType(type)}
							filters={filters}
						/>
					</div>
				</div>

				<ReportFilters
					initial={filterState}
					onApply={(newFilters) => {
						// Convertir ReportFiltersState a IReportFilters
						const converted: IReportFilters = {};
						if (newFilters.dateFrom) converted.date_from = newFilters.dateFrom;
						if (newFilters.dateTo) converted.date_to = newFilters.dateTo;
						if (typeof newFilters.priceMin === 'number') converted.price_min = newFilters.priceMin;
						if (typeof newFilters.priceMax === 'number') converted.price_max = newFilters.priceMax;
						if (newFilters.customer) {
							const num = Number(String(newFilters.customer).replace(/\D/g, ''));
							if (!Number.isNaN(num) && num > 0) converted.customer_id = num;
							else converted.q = newFilters.customer;
						}
						if (newFilters.branch) {
							const num = Number(String(newFilters.branch).replace(/\D/g, ''));
							if (!Number.isNaN(num) && num > 0) converted.branch_id = num;
						}
						setFilterState(newFilters);
						setFilters(converted);
						// Aplicar filtros después de un pequeño delay para asegurar que el estado se actualice
						setTimeout(() => applyFilters(), 0);
					}}
				/>

				{loading ? (
					<div className='p-4 text-center text-zinc-500'>Cargando...</div>
				) : (
					<>
						<ReportResultsTable type={type} results={results} />
						{/* Paginación simple basada en meta */}
						{results?.meta && (
							<div className='mt-4 flex items-center gap-2'>
								<div>
									Página {results.meta.current_page} / {results.meta.last_page}
								</div>
							</div>
						)}
					</>
				)}
			</>
		);
	};

	return (
		<PageWrapper>
			<Container>
				<div className='p-4'>{renderReportContent()}</div>
			</Container>
		</PageWrapper>
	);
};

export default ReportResultsPage;
