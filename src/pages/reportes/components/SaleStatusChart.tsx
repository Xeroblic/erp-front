import React, { useMemo } from 'react';
import Chart from '@/components/Chart';

interface Props {
    data: any[];
}

const SalesStatusChart: React.FC<Props> = ({ data }) => {
    const { series, labels } = useMemo(() => {
        // Agrupar y contar por status
        const counts: Record<string, number> = {};
        data.forEach(r => {
            const status = r.status || 'Desconocido';
            counts[status] = (counts[status] || 0) + 1;
        });

        return {
            labels: Object.keys(counts),
            series: Object.values(counts)
        };
    }, [data]);

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold mb-4 text-zinc-700 dark:text-zinc-200">Distribución por Estado</h3>
            <Chart
                type="donut"
                height={300}
                series={series}
                options={{
                    labels: labels,
                    colors: ['#10B981', '#F59E0B', '#EF4444', '#6366F1'], // Colores flaites pero bonitos
                    legend: { position: 'bottom' },
                    plotOptions: { pie: { donut: { size: '65%' } } }
                }}
            />
        </div>
    );
};

export default SalesStatusChart;