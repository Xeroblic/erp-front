import React, { useMemo, useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { fetchReportResults } from '@/store/slices/reports/reportsThunks';
import useDarkMode from '@/hooks/useDarkMode';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { toast } from 'react-toastify';

const WeeklySalesChart: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isDarkTheme } = useDarkMode();
    const currentSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
    const resultsData = useAppSelector((s) => s.reports.results);

    // State for toggle
    const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');

    // Normalize data
    const results = useMemo(() => {
        if (!resultsData) return [];
        if (Array.isArray(resultsData)) return resultsData;
        if (typeof resultsData === 'object' && 'data' in resultsData) {
            const extracted = (resultsData as any).data;
            return Array.isArray(extracted) ? extracted : [];
        }
        return [];
    }, [resultsData]);

    // Fetching is handled by DashboardContainer now to share data with StatsCards
    // useEffect(() => { ... });

    // Filter Data & Prepare Chart
    const { chartSeries, chartCategories, totalAmount } = useMemo(() => {
        const dateMap = new Map<string, number>();
        const today = new Date();
        const days = dateRange === '7d' ? 7 : 30;
        const categories: string[] = [];

        // Generate date keys
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            categories.push(key);
            dateMap.set(key, 0);
        }

        let total = 0;

        results.forEach((r: any) => {
            const rawAmt = r?.total_amount ?? r?.total ?? r?.amount ?? 0;
            const amount = typeof rawAmt === 'string' ? parseFloat(rawAmt) : Number(rawAmt) || 0;

            const rawDate = r?.sale_date || r?.date || r?.created_at || r?.updated_at || r?.createdAt || r?.period || r?.fecha;
            if (!rawDate) return;

             // Parse date
            let d: Date | null = null;
            if (rawDate instanceof Date) d = rawDate;
            else {
                const parsed = new Date(rawDate);
                if (!Number.isNaN(parsed.getTime())) d = parsed;
            }

            if (d) {
                const key = d.toISOString().split('T')[0];
                if (dateMap.has(key)) {
                    dateMap.set(key, (dateMap.get(key) || 0) + amount);
                    total += amount;
                }
            }
        });

        const dataSales = categories.map(key => dateMap.get(key) || 0);

        return {
            chartSeries: [{ name: 'Ventas', data: dataSales }],
            chartCategories: categories,
            totalAmount: total
        };

    }, [results, dateRange]);

    
    const handleDownloadXml = () => {
        try {
            if (results.length === 0) {
                toast.warning('No hay datos para exportar');
                return;
            }

            let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<sales>\n';
            results.forEach((sale: any) => {
                xmlContent += `  <sale>\n`;
                xmlContent += `    <date>${sale.sale_date || sale.date || 'N/A'}</date>\n`;
                xmlContent += `    <amount>${sale.total_amount || sale.amount || 0}</amount>\n`;
                xmlContent += `    <id>${sale.id || ''}</id>\n`;
                xmlContent += `  </sale>\n`;
            });
            xmlContent += '</sales>';

            const blob = new Blob([xmlContent], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales_report_${new Date().toISOString().split('T')[0]}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Reporte XML descargado');
        } catch (error) {
            console.error('Error generating XML', error);
            toast.error('Error al generar XML');
        }
    };


    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'area',
            fontFamily: 'inherit',
            toolbar: { show: false },
            background: 'transparent',
            animations: { enabled: true },
        },
        stroke: {
            width: 3,
            curve: 'smooth',
            colors: ['#22c55e'],
        },
        dataLabels: { enabled: false },
        xaxis: {
			categories: chartCategories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: isDarkTheme ? '#9ca3af' : '#6b7280',
                },
                formatter: (val) => {
                    const d = new Date(val);
                    // Show day/month. If 30 days, maybe show less labels? ApexCharts handles density usually.
                     return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: isDarkTheme ? '#9ca3af' : '#6b7280',
                },
                formatter: (val: number) => `$${val > 1000 ? (val/1000).toFixed(1) + 'k' : val}`
            }
        },
        grid: {
            borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
            strokeDashArray: 4,
            yaxis: { lines: { show: true } },
			xaxis: { lines: { show: false } },
        },
        colors: ['#22c55e'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 0.5,
                opacityFrom: 0.2,
                opacityTo: 0.05,
                stops: [0, 100],
                colorStops: [
                    { offset: 0, color: '#22c55e', opacity: 0.2 },
                    { offset: 100, color: '#22c55e', opacity: 0 },
                ],
            },
        },
        tooltip: {
            theme: isDarkTheme ? 'dark' : 'light',
            y: {
                formatter: (val: number) => `$${val.toLocaleString('es-CL')}`
            }
        },
    };

    return (
        <Card className='h-full border-none shadow-sm'>
            <CardHeader className='flex flex-wrap items-center justify-between gap-4'>
                <CardHeaderChild>
                   <div>
                        <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>Ventas</h3>
                        <p className='text-xs text-gray-500'>
                            {dateRange === '7d' ? 'Últimos 7 días' : 'Últimos 30 días'}
                        </p>
                   </div>
                </CardHeaderChild>
                <CardHeaderChild>
                    <div className='flex items-center gap-2'>
                        <div className='flex rounded-md bg-gray-100 p-1 dark:bg-gray-800'>
                            <button
                                onClick={() => setDateRange('7d')}
                                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                                    dateRange === '7d' 
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                7D
                            </button>
                            <button
                                onClick={() => setDateRange('30d')}
                                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                                    dateRange === '30d' 
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                30D
                            </button>
                        </div>
                        <Button 
                            variant='outline' 
                            size='sm' 
                            onClick={handleDownloadXml}
                            title="Descargar XML"
                            className='dark:border-gray-700 dark:text-gray-300'
                        >
                            <Icon icon='HeroDocumentArrowDown' className='h-4 w-4' />
                        </Button>
                    </div>
                </CardHeaderChild>
            </CardHeader>
            <CardBody>
                <div className='mb-4'>
                     <span className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                        ${totalAmount.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <Chart options={chartOptions} series={chartSeries} type='area' height={280} />
            </CardBody>
        </Card>
    );
};

export default WeeklySalesChart;
