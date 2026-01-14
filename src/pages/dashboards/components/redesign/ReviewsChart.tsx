import React from 'react';
import Chart from 'react-apexcharts';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import useDarkMode from '@/hooks/useDarkMode';

const ReviewsChart: React.FC = () => {
    const { isDarkTheme } = useDarkMode();

    // Configuración del gráfico (simulando "Revisiones por Semana")
    // En el futuro, esto debería recibir datos reales vía props o store.
    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            fontFamily: 'inherit',
            toolbar: { show: false },
            background: 'transparent',
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '40%',
                distributed: true,
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            axisBorder: { show: false },
            axisTicks: { show: false },
             labels: {
                style: {
                    colors: isDarkTheme ? '#9ca3af' : '#6b7280',
                }
             }
        },
         yaxis: {
            labels: {
                style: {
                    colors: isDarkTheme ? '#9ca3af' : '#6b7280',
                }
            }
        },
        grid: {
            borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
            strokeDashArray: 4,
        },
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'],
        legend: { show: false },
        tooltip: {
            theme: isDarkTheme ? 'dark' : 'light',
        },
    };

    const series = [
        {
            name: 'Revisiones',
            data: [12, 19, 3, 5, 2, 3, 15], // Mock data
        },
    ];

    return (
        <Card className='h-full border-none shadow-sm'>
            <CardHeader>
                <CardHeaderChild>
                    <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>Actividad Semanal</h3>
                </CardHeaderChild>
            </CardHeader>
            <CardBody>
                <Chart options={chartOptions} series={series} type='bar' height={250} />
            </CardBody>
        </Card>
    );
};

export default ReviewsChart;
