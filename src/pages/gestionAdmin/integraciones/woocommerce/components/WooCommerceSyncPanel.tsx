import React, { useMemo, useState } from 'react';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { useWooCommerceSync } from '../hooks/useWooCommerceSync';

const WooCommerceSyncPanel: React.FC = () => {
    const { loading, result, syncProductosStock } = useWooCommerceSync();
    const [showLog, setShowLog] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

    // Update last sync time when a new result arrives
    React.useEffect(() => {
        if (result) {
            setLastSyncAt(new Date().toLocaleString());
        }
    }, [result]);

    const status = useMemo(() => {
        const estado = result?.estado ?? 'inicial';
        switch (estado) {
            case 'exitoso':
                return { label: 'Exitoso', color: 'emerald', icon: 'HeroCheckCircle' as const };
            case 'desfasado':
                return { label: 'Desfasado', color: 'amber', icon: 'HeroExclamationTriangle' as const };
            case 'desactivado':
                return { label: 'Desactivado', color: 'zinc', icon: 'HeroNoSymbol' as const };
            case 'error':
                return { label: 'Error', color: 'rose', icon: 'HeroXCircle' as const };
            case 'inicial':
            default:
                return { label: 'Sin ejecución', color: 'gray', icon: 'HeroClock' as const };
        }
    }, [result]);

    return (
        <Card className="mb-6 border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-50/60 dark:from-emerald-900/10 dark:to-transparent shadow-sm">
            <CardHeader className="bg-white/60 dark:bg-zinc-900/40 rounded-t-md">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                            <Icon icon="HeroArrowPath" className="h-6 w-6 text-emerald-700" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900">Sincronizar productos y stock</h2>
                            <p className="text-sm text-emerald-700">Actualiza productos y existencias desde WooCommerce</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge color={status.color as any} variant="outline" className="font-medium">
                            <span className="inline-flex items-center gap-1">
                                <Icon icon={status.icon} className="h-4 w-4" />
                                {status.label}
                            </span>
                        </Badge>
                        {lastSyncAt && (
                            <span className="text-xs text-zinc-500">Última sincronización: {lastSyncAt}</span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardBody>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            color="emerald"
                            variant="solid"
                            onClick={syncProductosStock}
                            isLoading={loading}
                            icon="HeroArrowPath"
                            className="shadow-sm"
                        >
                            {loading ? 'Sincronizando…' : 'Sincronizar ahora'}
                        </Button>
                        <Button
                            variant="outline"
                            color="emerald"
                            onClick={() => setShowLog((v) => !v)}
                            rightIcon={showLog ? 'HeroChevronUp' : 'HeroChevronDown'}
                        >
                            {showLog ? 'Ocultar log' : 'Ver log'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
                            <div className="text-xs text-zinc-500">Estado</div>
                            <div className="mt-1 inline-flex items-center gap-2">
                                <Icon icon={status.icon} className={`h-5 w-5 text-${status.color}-600`} />
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{status.label}</span>
                            </div>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
                            <div className="text-xs text-zinc-500">Productos procesados</div>
                            <div className="mt-1 font-mono text-lg text-zinc-800 dark:text-zinc-100">
                                {result?.productosProcesados ?? 0}
                            </div>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 p-4">
                            <div className="text-xs text-zinc-500">Advertencias</div>
                            <div className="mt-1 font-mono text-lg text-zinc-800 dark:text-zinc-100">
                                {result?.advertencias.length ?? 0}
                            </div>
                        </div>
                    </div>

                    {result?.advertencias.length ? (
                        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-amber-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon icon="HeroExclamationTriangle" className="h-4 w-4 text-amber-600" />
                                <strong>Advertencias detectadas</strong>
                            </div>
                            <ul className="list-disc pl-6 text-sm">
                                {result.advertencias.map((a, idx) => (
                                    <li key={idx}>{a}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {showLog && (
                        <div>
                            <span className="font-semibold text-zinc-700">Log del proceso</span>
                            <div className="mt-2 rounded border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-700 max-h-60 overflow-auto whitespace-pre-wrap">
                                {result?.log ?? 'Sin registros aún.'}
                            </div>
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default WooCommerceSyncPanel;
