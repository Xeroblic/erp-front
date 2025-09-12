import React, { useMemo, useState } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import ReportFilters, { ReportFiltersState } from './components/ReportFilters';
import Chart from '@/components/Chart';

const FinancialReports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFiltersState>({});

  const series = useMemo(() => {
    const income = [30, 45, 42, 60, 58, 62, 75];
    const expenses = [18, 22, 25, 32, 30, 35, 40];
    const factor = filters.subsidiary ? 1.05 : 1;
    return [
      { name: 'Ingresos', data: income.map((v) => Math.round(v * factor)) },
      { name: 'Gastos', data: expenses.map((v) => Math.round(v * factor)) },
    ];
  }, [filters]);

  const categories = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];

  return (
    <div className="space-y-6">
      <Card className="border border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-50/60 dark:from-amber-900/10 dark:to-transparent shadow-sm">
        <CardHeader className="bg-white/60 dark:bg-zinc-900/40 rounded-t-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Icon icon="HeroBanknotes" className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-900">Reportes Financieros</h2>
              <p className="text-sm text-amber-700">Ingresos vs Gastos</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <Chart type="bar" height={320} series={series as any} options={{ xaxis: { categories } }} />
        </CardBody>
      </Card>

      <ReportFilters onApply={setFilters} />
    </div>
  );
};

export default FinancialReports;

