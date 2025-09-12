import React, { useMemo, useState } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

type LogItem = {
  type: 'success' | 'error' | 'warning';
  message: string;
};

const WooCommerceOrdersImportPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ total: number; errores: number; warnings: number; fecha: string } | null>(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [showLog, setShowLog] = useState(false);

  const status = useMemo(() => {
    if (!summary) return { label: 'Sin ejecución', color: 'gray', icon: 'HeroClock' as const };
    if (summary.errores > 0) return { label: 'Con errores', color: 'rose', icon: 'HeroXCircle' as const };
    if (summary.warnings > 0) return { label: 'Parcial', color: 'amber', icon: 'HeroExclamationTriangle' as const };
    return { label: 'Exitoso', color: 'emerald', icon: 'HeroCheckCircle' as const };
  }, [summary]);

  const handleImport = () => {
    setLoading(true);
    // Simulación de importación y resultados
    setTimeout(() => {
      const now = new Date().toLocaleString();
      setSummary({
        total: 12,
        errores: 2,
        warnings: 1,
        fecha: now,
      });
      setLog([
        { type: 'success', message: '10 pedidos importados correctamente.' },
        { type: 'warning', message: '1 pedido con cliente no vinculado, requiere revisión.' },
        { type: 'error', message: '1 pedido duplicado omitido.' },
        { type: 'error', message: 'Integración inactiva: no se pudo importar 2 pedidos.' },
      ]);
      setShowLog(true);
      setLoading(false);
    }, 1500);
  };

  return (
    <Card className="border border-sky-200/60 bg-gradient-to-br from-sky-50 to-sky-50/60 dark:from-sky-900/10 dark:to-transparent shadow-sm">
      <CardHeader className="bg-white/60 dark:bg-zinc-900/40 rounded-t-md">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
              <Icon icon="HeroCloudArrowDown" className="h-6 w-6 text-sky-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-900">Importar pedidos WooCommerce</h2>
              <p className="text-sm text-sky-700">Descarga pedidos pendientes desde la tienda</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge color={status.color as any} variant="outline" className="font-medium">
              <span className="inline-flex items-center gap-1">
                <Icon icon={status.icon} className="h-4 w-4" />
                {status.label}
              </span>
            </Badge>
            {summary?.fecha && (
              <span className="text-xs text-zinc-500">Última importación: {summary.fecha}</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              color="sky"
              variant="solid"
              onClick={handleImport}
              isLoading={loading}
              icon="HeroCloudArrowDown"
              className="shadow-sm"
            >
              {loading ? 'Importando…' : 'Importar pedidos'}
            </Button>
            <Button
              variant="outline"
              color="sky"
              onClick={() => setShowLog((v) => !v)}
              rightIcon={showLog ? 'HeroChevronUp' : 'HeroChevronDown'}
            >
              {showLog ? 'Ocultar log' : 'Ver log'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Estado</div>
              <div className="mt-1 inline-flex items-center gap-2">
                <Icon icon={status.icon} className={`h-5 w-5 text-${status.color}-600`} />
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{status.label}</span>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Pedidos importados</div>
              <div className="mt-1 font-mono text-lg text-zinc-800 dark:text-zinc-100">
                {summary?.total ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Errores</div>
              <div className="mt-1 font-mono text-lg text-rose-600">
                {summary?.errores ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Advertencias</div>
              <div className="mt-1 font-mono text-lg text-amber-600">
                {summary?.warnings ?? 0}
              </div>
            </div>
          </div>

          {showLog && (
            <div>
              <span className="font-semibold text-zinc-700">Log de incidencias</span>
              {log.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Sin eventos aún.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {log.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 p-2 text-sm">
                      {item.type === 'success' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-semibold">Éxito</span>
                      )}
                      {item.type === 'error' && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-xs font-semibold">Error</span>
                      )}
                      {item.type === 'warning' && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-semibold">Advertencia</span>
                      )}
                      <span className="text-zinc-700">{item.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default WooCommerceOrdersImportPanel;
