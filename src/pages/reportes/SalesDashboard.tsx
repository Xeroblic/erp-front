import React, { useMemo, useState } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import ReportFilters, { ReportFiltersState } from './components/ReportFilters';
import Chart from '@/components/Chart';

const SalesDashboard: React.FC = () => {
  const [filters, setFilters] = useState<ReportFiltersState>({});

  // Mock de datos derivados de filtros
  const series = useMemo(() => {
    // Genera valores simples para la demo (en producción, llamar API)
    const base = [12, 18, 15, 22, 19, 27, 30];
    const factor = filters.customer ? 1.1 : 1;
    const adjusted = base.map((v, i) => Math.round(v * factor + (filters.priceMin ? 0.1 * i : 0)));
    return [
      { name: 'Ventas', data: adjusted },
      { name: 'Devoluciones', data: adjusted.map((x) => Math.max(0, Math.round(x * 0.12 - 1))) },
    ];
  }, [filters]);

  const categories = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      <Card className="border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-indigo-50/60 dark:from-indigo-900/10 dark:to-transparent shadow-sm">
        <CardHeader className="bg-white/60 dark:bg-zinc-900/40 rounded-t-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Icon icon="HeroReceiptPercent" className="h-6 w-6 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900">Dashboard de Ventas</h2>
              <p className="text-sm text-indigo-700">Tendencia de ventas y devoluciones</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Ventas totales</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">$ {series[0].data.reduce((a,b)=>a+b,0)}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Ticket promedio</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">$ {Math.round((series[0].data.reduce((a,b)=>a+b,0) / series[0].data.length) * 10)/10}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Devoluciones (%)</div>
              <div className="mt-1 text-2xl font-bold text-rose-600">{Math.round((series[1].data.reduce((a,b)=>a+b,0) / Math.max(1, series[0].data.reduce((a,b)=>a+b,0))) * 100)}%</div>
            </div>
          </div>

          <div className="mt-6">
            <Chart
              type="line"
              height={320}
              series={series as any}
              options={{ xaxis: { categories }, stroke: { width: 3 } }}
            />
          </div>
        </CardBody>
      </Card>

      <ReportFilters onApply={setFilters} />
    </div>
  );
};

export default SalesDashboard;

