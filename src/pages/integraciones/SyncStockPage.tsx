import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchIntegrations } from '@/store/slices/integrations/integrationsSlice';
import { syncStock } from '@/services/integrationsService';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { toast } from 'react-toastify';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import type { Integration, SyncStockPayload, SyncStockResponse } from '@/types/integrations.types';

const SyncStockPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
    const { integrations, loading } = useAppSelector((state) => state.integrations);

    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
    const [skuList, setSkuList] = useState('');
    const [syncAllProducts, setSyncAllProducts] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState<SyncStockResponse['result'] | null>(null);

    useEffect(() => {
        if (subsidiaryId) {
            dispatch(
                fetchIntegrations({
                    subsidiaryId,
                    params: { provider: 'woocommerce', active: true },
                }),
            );
        }
    }, [dispatch, subsidiaryId]);

    const wooIntegrations = useMemo(
        () =>
            integrations
                .filter((integration) => integration.provider === 'woocommerce' && integration.is_active)
                .sort((a, b) => a.name.localeCompare(b.name)),
        [integrations],
    );

    const selectedIntegration = wooIntegrations.find((integration) => integration.id === selectedIntegrationId);

    const successProducts = useMemo(
        () => lastSyncResult?.products?.filter((product) => product.status === 'success') ?? [],
        [lastSyncResult],
    );
    const failedProducts = useMemo(
        () => lastSyncResult?.products?.filter((product) => product.status === 'failed') ?? [],
        [lastSyncResult],
    );

    const handleSyncStock = async () => {
        if (!subsidiaryId || !selectedIntegrationId) {
            toast.error('Debes seleccionar una integración');
            return;
        }

        let skus: string[] = [];
        if (!syncAllProducts) {
            skus = skuList
                .split('\n')
                .map((sku) => sku.trim())
                .filter((sku) => sku.length > 0);

            if (skus.length === 0) {
                toast.error('Ingresa al menos un SKU o activa la sincronización completa');
                return;
            }
        }

        setSyncing(true);
        setLastSyncResult(null);

        try {
            const payload: SyncStockPayload = skus.length ? { skus } : {};
            const response = await syncStock(subsidiaryId, selectedIntegrationId, payload);
            setLastSyncResult(response.result ?? null);
            toast.success(
                response.message || `Stock sincronizado: ${response.result?.synced || 0} productos actualizados`,
            );
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al sincronizar stock');
            console.error(error);
        } finally {
            setSyncing(false);
        }
    };

    const disableSyncButton =
        syncing ||
        !selectedIntegrationId ||
        selectedIntegration?.mode !== 'read_write' ||
        (!syncAllProducts && !skuList.trim());

    return (
        <PageWrapper name='Sincronizar Stock'>
            <Subheader>
                <SubheaderLeft>
                    <span className='text-2xl font-semibold'>Sincronizar Stock con WooCommerce</span>
                </SubheaderLeft>
            </Subheader>
            <Container>
                {!subsidiaryId && (
                    <Alert icon='HeroInformationCircle' variant='outline' color='amber' className='mb-4'>
                        Selecciona una sucursal para gestionar integraciones.
                    </Alert>
                )}

                {!loading && wooIntegrations.length === 0 && (
                    <Alert icon='HeroExclamationTriangle' color='red' variant='outline' className='mb-4'>
                        No hay integraciones de WooCommerce activas. Crea una integración en modo Lectura/Escritura
                        para usar esta herramienta.
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardHeaderChild>
                            <CardTitle>Configuración de Sincronización</CardTitle>
                        </CardHeaderChild>
                    </CardHeader>
                    <CardBody>
                        <div className='space-y-6'>
                            <div>
                                <Label htmlFor='integration'>Integración de WooCommerce</Label>
                                <Select
                                    name='integration'
                                    value={selectedIntegrationId || ''}
                                    onChange={(event) =>
                                        setSelectedIntegrationId(event.target.value ? event.target.value : null)
                                    }>
                                    <option value=''>Selecciona una integración</option>
                                    {wooIntegrations.map((integration: Integration) => (
                                        <option key={integration.id} value={integration.id}>
                                            {integration.name} · {integration.base_url}
                                        </option>
                                    ))}
                                </Select>
                                {selectedIntegration && (
                                    <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500'>
                                        <Badge color='blue' variant='outline'>Modo: {selectedIntegration.mode}</Badge>
                                        <Badge color={selectedIntegration.is_active ? 'green' : 'red'} variant='outline'>
                                            {selectedIntegration.is_active ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </div>
                                )}
                                {selectedIntegration && selectedIntegration.mode !== 'read_write' && (
                                    <p className='mt-1 text-sm text-red-500'>
                                        ⚠️ Solo las integraciones en modo Lectura/Escritura pueden sincronizar stock.
                                    </p>
                                )}
                            </div>

                            <div className='space-y-2'>
                                <Checkbox
                                    checked={syncAllProducts}
                                    onChange={(checked) => setSyncAllProducts(checked)}
                                    label='Sincronizar todos los productos de la subsidiaria'
                                />
                                {syncAllProducts ? (
                                    <Alert variant='outline' color='emerald'>
                                        Se consultará el stock completo del ERP y se enviará a WooCommerce. Este
                                        proceso puede tardar varios minutos.
                                    </Alert>
                                ) : (
                                    <p className='text-sm text-gray-500'>
                                        Si prefieres sincronizar solo algunos SKU, ingrésalos en el campo inferior.
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor='skus'>SKUs de Productos (uno por línea)</Label>
                                <Textarea
                                    name='skus'
                                    disabled={syncAllProducts}
                                    rows={10}
                                    className='w-full rounded-lg border border-gray-300 p-3 font-mono text-sm'
                                    value={skuList}
                                    onChange={(event) => setSkuList(event.target.value)}
                                    placeholder='SKU-001&#10;SKU-002&#10;SKU-003'
                                />
                                <p className='mt-1 text-xs text-gray-500'>
                                    El sistema consultará el stock actual en el ERP y lo actualizará en WooCommerce.
                                </p>
                            </div>

                            <div className='flex flex-wrap justify-end gap-3'>
                                <Button
                                    variant='outline'
                                    icon='HeroArrowPath'
                                    onClick={() => {
                                        setSkuList('');
                                        setLastSyncResult(null);
                                    }}
                                    isDisable={syncing}>
                                    Limpiar
                                </Button>
                                <Button
                                    variant='solid'
                                    icon='HeroArrowPath'
                                    onClick={handleSyncStock}
                                    disabled={disableSyncButton}>
                                    {syncing ? 'Sincronizando...' : 'Sincronizar Stock'}
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {lastSyncResult && (
                    <Card className='mt-4'>
                        <CardHeader>
                            <CardHeaderChild>
                                <CardTitle>Resultado de la sincronización</CardTitle>
                            </CardHeaderChild>
                        </CardHeader>
                        <CardBody>
                            <div className='space-y-6'>
                                <div className='grid gap-4 md:grid-cols-3'>
                                    <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                                        <div className='text-sm text-green-600'>Sincronizados</div>
                                        <div className='text-2xl font-bold text-green-700'>
                                            {lastSyncResult.synced ?? successProducts.length}
                                        </div>
                                    </div>
                                    <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                                        <div className='text-sm text-red-600'>Errores</div>
                                        <div className='text-2xl font-bold text-red-700'>
                                            {lastSyncResult.failed ?? failedProducts.length}
                                        </div>
                                    </div>
                                    <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                                        <div className='text-sm text-blue-600'>Total procesados</div>
                                        <div className='text-2xl font-bold text-blue-700'>
                                            {lastSyncResult.products?.length || 0}
                                        </div>
                                    </div>
                                </div>

                                {successProducts.length > 0 && (
                                    <div>
                                        <h3 className='mb-2 font-semibold text-green-700'>Productos sincronizados</h3>
                                        <div className='space-y-1'>
                                            {successProducts.map((product, index) => (
                                                <div
                                                    key={`${product.sku}-${index}`}
                                                    className='flex items-center justify-between rounded bg-green-50 p-2'>
                                                    <span className='font-mono text-sm'>{product.sku}</span>
                                                    <Badge color='green'>OK</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {failedProducts.length > 0 && (
                                    <div>
                                        <h3 className='mb-2 font-semibold text-red-700'>Errores detectados</h3>
                                        <div className='space-y-1'>
                                            {failedProducts.map((product, index) => (
                                                <div
                                                    key={`${product.sku}-${index}`}
                                                    className='rounded bg-red-50 p-2 text-sm'>
                                                    <strong>{product.sku}</strong>: {product.message || 'Sin detalle'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {successProducts.length === 0 && failedProducts.length === 0 && (
                                    <p className='text-sm text-gray-500'>
                                        No se recibieron detalles individuales desde el backend.
                                    </p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}
            </Container>
        </PageWrapper>
    );
};

export default SyncStockPage;
