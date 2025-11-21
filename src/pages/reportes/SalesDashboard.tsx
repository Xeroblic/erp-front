import React, { useMemo, useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import ReportFilters, { ReportFiltersState } from './components/ReportFilters';
import Chart from '@/components/Chart';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import { clearResults } from '@/store/slices/reports/reportSlice';
import ReportExportButton from './ReportExportButton';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import SalesAnalytics from './components/SalesAnalytics';

const SalesDashboard: React.FC = () => {
    const apexToolbarMenuStyles = `
        .apexcharts-menu {
            background-color: #0f172a !important;
            border: 1px solid #334155 !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.35) !important;
        }
        .apexcharts-menu-item {
            color: #e2e8f0 !important;
        }
        .apexcharts-menu-item:hover {
            background: #1f2937 !important;
        }
        .apexcharts-menu-item.disabled {
            color: #64748b !important;
        }
    `;
    const [filters, setFilters] = useState<ReportFiltersState>({});
    const dispatch = useAppDispatch();
    const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
    
    const resultsData = useAppSelector((s) => s.reports.results);
    const results = useMemo(() => {
        if (!resultsData) return [];
        if (Array.isArray(resultsData)) return resultsData;
        if (typeof resultsData === 'object' && 'data' in resultsData) {
            const extracted = (resultsData as any).data;
            return Array.isArray(extracted) ? extracted : [];
        }
        return [];
    }, [resultsData]);

    const parseNumeric = (val: unknown) => {
        if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
        if (typeof val === 'string') {
            const num = Number(val.replace(/[^0-9.-]/g, ''));
            return Number.isFinite(num) ? num : undefined;
        }
        return undefined;
    };

    const normalizeDate = (val?: string) => {
        if (!val) return undefined;
        const dashParts = val.split('-');
        if (dashParts.length === 3) {
            const [a, b, c] = dashParts.map((p) => p.trim());
            if (a.length === 4) {
                const iso = new Date(`${a}-${b}-${c}T00:00:00`);
                if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
            }
            if (c.length === 4) {
                const iso = new Date(`${c}-${b}-${a}T00:00:00`);
                if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
            }
        }
        const iso = new Date(val);
        if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10);
        return undefined;
    };

    const mapFilters = (f: ReportFiltersState) => {
        const out: Record<string, any> = {};
        const from = normalizeDate(f.dateFrom);
        const to = normalizeDate(f.dateTo);
        if (from) out.date_from = from;
        if (to) out.date_to = to;
        const priceMin = parseNumeric(f.priceMin);
        const priceMax = parseNumeric(f.priceMax);
        if (priceMin !== undefined) out.price_min = priceMin;
        if (priceMax !== undefined) out.price_max = priceMax;
        if (f.customer) {
            const num = Number(String(f.customer).replace(/\D/g, ''));
            out[(!Number.isNaN(num) && num > 0) ? 'customer_id' : 'q'] = (!Number.isNaN(num) && num > 0) ? num : f.customer;
        }
        if (f.branch) {
            const num = Number(String(f.branch).replace(/\D/g, ''));
            if (!Number.isNaN(num) && num > 0) out.branch_id = num;
        }
        return out;
    };

    useEffect(() => {
        const sid = Number(currentSubsidiaryId ?? 0);
        if (!sid) return;
        dispatch(clearResults());
        dispatch(fetchReportResults({ subsidiaryId: sid, type: 'sales', filters: mapFilters(filters) }) as any);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSubsidiaryId, filters]);

    const filteredResults = useMemo(() => {
        const priceMin = parseNumeric(filters.priceMin);
        const priceMax = parseNumeric(filters.priceMax);
        return results.filter((r: any) => {
            const rawAmt = r?.total_amount ?? r?.total ?? r?.amount ?? 0;
            const amount = typeof rawAmt === 'string' ? parseFloat(rawAmt) : Number(rawAmt) || 0;
            if (priceMin !== undefined && amount < priceMin) return false;
            if (priceMax !== undefined && amount > priceMax) return false;
            return true;
        });
    }, [results, filters.priceMin, filters.priceMax]);

    const { chartSeries, chartCategories, stats } = useMemo(() => {
        const dateMap = new Map<string, { total: number; returns: number }>();
        let totalSales = 0;
        let totalReturns = 0;

        filteredResults.forEach((r: any) => {
            const rawAmt = r?.total_amount ?? r?.total ?? r?.amount ?? 0;
            const amount = typeof rawAmt === 'string' ? parseFloat(rawAmt) : Number(rawAmt) || 0;
            
            const rawRet =
                r?.returns ??
                r?.devoluciones ??
                r?.return_amount ??
                r?.refunded ??
                r?.refunded_amount ??
                0;
            const retVal = typeof rawRet === 'string' ? parseFloat(rawRet) : Number(rawRet) || 0;

            totalSales += amount;
            totalReturns += retVal;

            const rawDate = r?.sale_date || r?.date || r?.created_at;
            if (!rawDate) return;
            
            try {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                    const key = d.toISOString().split('T')[0];
                    if (!dateMap.has(key)) dateMap.set(key, { total: 0, returns: 0 });
                    const entry = dateMap.get(key)!;
                    entry.total += amount;
                    entry.returns += retVal;
                }
            } catch {}
        });

        let keys = Array.from(dateMap.keys()).sort();
        if (filters.dateFrom && filters.dateTo) {
            const start = new Date(filters.dateFrom);
            const end = new Date(filters.dateTo);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const tempKeys = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const k = d.toISOString().split('T')[0];
                    tempKeys.push(k);
                    if (!dateMap.has(k)) dateMap.set(k, { total: 0, returns: 0 });
                }
                keys = tempKeys.sort();
            }
        }

        const dataSales = keys.map(k => dateMap.get(k)?.total || 0);
        const dataReturns = keys.map(k => dateMap.get(k)?.returns || 0);

        return {
            chartSeries: [
                { name: 'Ventas', data: dataSales, color: '#22c55e' },
                { name: 'Devoluciones', data: dataReturns, color: '#f97316' }
            ],
            chartCategories: keys, 
            stats: {
                total: totalSales,
                returns: totalReturns,
                refundedTotal: totalReturns,
                count: results.length,
                avg: filteredResults.length > 0 ? totalSales / filteredResults.length : 0,
                retPct: totalSales > 0 ? (totalReturns / totalSales) * 100 : 0
            }
        };
    }, [filteredResults, filters.dateFrom, filters.dateTo]);

    const chartOptions: any = useMemo(() => ({
        chart: { 
            type: 'area',
            zoom: { 
                enabled: true, 
                type: 'x', 
                autoScaleYaxis: true 
            },
            toolbar: {
                show: true,
                tools: { pan: true, zoom: true, reset: true },
                autoSelected: 'zoom'
            },
            fontFamily: 'inherit',
            animations: { enabled: false }
        },
        stroke: {
            width: [3, 3],
            curve: 'smooth',
            colors: ['#22c55e', '#f97316'],
        },
        markers: {
            size: 0,
            strokeColors: ['#22c55e', '#f97316'],
            hover: { size: 5 }
        },
        dataLabels: { enabled: false },
        grid: { 
            strokeDashArray: 4, 
            borderColor: '#E5E7EB66',
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } }
        },
        xaxis: {
            type: 'datetime',
            categories: chartCategories,
            tickAmount: 6,
            labels: {
                style: { fontSize: '11px', colors: '#64748B' },
                datetimeFormatter: {
                    year: 'yyyy',
                    month: "MMM 'yy",
                    day: 'dd MMM',
                    hour: 'HH:mm'
                }
            },
            tooltip: { enabled: false },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { colors: '#64748B' },
                formatter: (val: number) => `$${val.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`
            }
        },
        legend: { position: 'top', horizontalAlign: 'left' },
        tooltip: {
            theme: 'dark',
            shared: true,
            intersect: false,
            x: { format: 'dd MMM yyyy' },
            y: { formatter: (val: number) => `$${val.toLocaleString('es-CL')}` }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 0.5,
                opacityFrom: 0.16,
                opacityTo: 0.01,
                stops: [0, 100],
                colorStops: [
                    { offset: 0, color: '#22c55e', opacity: 0.16 },
                    { offset: 100, color: '#22c55e', opacity: 0 },
                ],
            }
        }
    }), [chartCategories]);

    return (
        <PageWrapper title='Reporte de Ventas'>
            <style>{apexToolbarMenuStyles}</style>
            <Subheader>
                <SubheaderLeft>
                    <div className='flex gap-2 items-center'>
                        <Icon icon='HeroReceiptPercent' className='h-6 w-6 text-indigo-600' />
                        <Badge className='text-2xl font-bold px-0 bg-transparent text-zinc-800 dark:text-zinc-100'>
                            Dashboard de Ventas
                        </Badge>
                    </div>
                    <p className='text-zinc-500 dark:text-zinc-400 mt-1'>
                        Análisis financiero y control de devoluciones
                    </p>
                </SubheaderLeft>
            </Subheader>

            <Container>
                <Card className='h-full border-indigo-100 dark:border-indigo-900/20 shadow-md'>
                    <CardHeader className='border-b border-zinc-100 dark:border-zinc-800 pb-4'>
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <div>
                                <h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>Resumen General</h2>
                                <p className='text-xs text-zinc-500'>Datos actualizados en tiempo real</p>
                            </div>
                            <ReportExportButton
                                subsidiaryId={Number(currentSubsidiaryId ?? 0)}
                                type='sales'
                                filters={mapFilters(filters)}
                            />
                        </div>
                    </CardHeader>
                    
                    <CardBody className='space-y-6'>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                            <Card className='rounded-2xl border border-emerald-200/70 bg-emerald-50/60 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-900/10'>
                                <CardBody className='flex items-start gap-3 p-4'>
                                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-800/60 dark:text-emerald-200'>
                                        <Icon icon='HeroCubeTransparent' className='h-5 w-5' />
                                    </div>
                                    <div className='space-y-1'>
                                        <p className='text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-200'>
                                            Ventas Totales
                                        </p>
                                        <p className='text-2xl font-bold text-emerald-900 dark:text-white'>
                                            ${stats.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                        </p>
                                        <p className='text-xs text-emerald-700/80 dark:text-emerald-200/80'>
                                            Ingresos acumulados del rango seleccionado
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                            
                            <Card className='rounded-2xl border border-indigo-200/70 bg-indigo-50/60 shadow-sm dark:border-indigo-800/50 dark:bg-indigo-900/10'>
                                <CardBody className='flex items-start gap-3 p-4'>
                                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-800/60 dark:text-indigo-200'>
                                        <Icon icon='HeroChartBarSquare' className='h-5 w-5' />
                                    </div>
                                    <div className='space-y-1'>
                                        <p className='text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-200'>
                                            Ticket Promedio
                                        </p>
                                        <p className='text-2xl font-bold text-indigo-900 dark:text-white'>
                                            ${stats.avg.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                        </p>
                                        <p className='text-xs text-indigo-700/80 dark:text-indigo-200/80'>
                                            Promedio por orden en el periodo
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card className='rounded-2xl border border-amber-200/70 bg-amber-50/60 shadow-sm dark:border-amber-800/50 dark:bg-amber-900/10'>
                                <CardBody className='flex items-start gap-3 p-4'>
                                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-800/60 dark:text-amber-200'>
                                        <Icon icon='HeroArrowPathRoundedSquare' className='h-5 w-5' />
                                    </div>
                                    <div className='space-y-1'>
                                        <p className='text-xs font-semibold uppercase text-amber-700 dark:text-amber-200'>
                                            Reembolsado
                                        </p>
                                        <p className='text-2xl font-bold text-amber-800 dark:text-amber-200'>
                                            ${stats.refundedTotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                        </p>
                                        <p className='text-xs text-amber-700/80 dark:text-amber-200/80'>
                                            Monto total devuelto en el rango
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        <div className='mt-4 min-h-[350px] w-full relative z-0'>
                            {results.length > 0 ? (
                                <Chart
                                    type='area'
                                    height={350}
                                    series={chartSeries}
                                    options={chartOptions}
                                />
                            ) : (
                                <div className='flex h-64 flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl'>
                                    <Icon icon='HeroChartBar' className='h-12 w-12 mb-2 opacity-50' />
                                    <p>Sin datos para mostrar</p>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                <div className="mt-6 relative z-0">
                    {results.length > 0 && <SalesAnalytics data={results} />}
                </div>

                <div className='mt-6'>
                    <ReportFilters onApply={setFilters} />
                </div>
            </Container>
        </PageWrapper>
    );
};

export default SalesDashboard;
