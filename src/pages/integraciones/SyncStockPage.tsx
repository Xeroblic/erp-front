import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchIntegrations } from '@/store/slices/integrations/integrationsSlice';
import { syncStock } from '@/services/integrationsService';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import Badge from '@/components/ui/Badge';
import { toast } from 'react-toastify';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';

const SyncStockPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const { integrations } = useAppSelector((state) => state.integrations);

	const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
	const [skuList, setSkuList] = useState('');
	const [syncing, setSyncing] = useState(false);
	const [lastSyncResult, setLastSyncResult] = useState<any>(null);

	useEffect(() => {
		if (subsidiaryId) {
			dispatch(fetchIntegrations({ subsidiaryId }));
		}
	}, [dispatch, subsidiaryId]);

	const handleSyncStock = async () => {
		if (!subsidiaryId || !selectedIntegrationId) {
			toast.error('Debes seleccionar una integración');
			return;
		}

		const skus = skuList
			.split('\n')
			.map((sku) => sku.trim())
			.filter((sku) => sku.length > 0);

		if (skus.length === 0) {
			toast.error('Debes ingresar al menos un SKU');
			return;
		}

		setSyncing(true);
		setLastSyncResult(null);

		try {
			const result = await syncStock(subsidiaryId, selectedIntegrationId, { skus });
			setLastSyncResult(result);
			toast.success(
				`Stock sincronizado: ${result.result?.synced || 0} productos actualizados`,
			);
		} catch (error: any) {
			toast.error(error?.response?.data?.message || 'Error al sincronizar stock');
			console.error(error);
		} finally {
			setSyncing(false);
		}
	};

	const selectedIntegration = integrations.find((i) => i.id === selectedIntegrationId);

	return (
		<PageWrapper name='Sincronizar Stock'>
			<Subheader>
				<SubheaderLeft>
					<span className='text-2xl font-semibold'>
						Sincronizar Stock con WooCommerce
					</span>
				</SubheaderLeft>
			</Subheader>
			<Container>
				<Card>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle>Configuración de Sincronización</CardTitle>
						</CardHeaderChild>
					</CardHeader>
					<CardBody>
						<div className='space-y-4'>
							<div>
								<Label htmlFor='integration'>Integración de WooCommerce</Label>
								<Select
									name='integration'
									value={selectedIntegrationId || ''}
									onChange={(e) =>
										setSelectedIntegrationId(
											e.target.value ? e.target.value : null,
										)
									}>
									<option value=''>Selecciona una integración</option>
									{integrations
										.filter((i) => i.is_active && i.mode === 'read_write')
										.map((integration) => (
											<option key={integration.id} value={integration.id}>
												{integration.name} - {integration.base_url}
											</option>
										))}
								</Select>
								{selectedIntegration &&
									selectedIntegration.mode !== 'read_write' && (
										<p className='mt-1 text-sm text-red-500'>
											⚠️ Esta integración debe estar en modo
											"Lectura/Escritura" para sincronizar stock
										</p>
									)}
							</div>

							<div>
								<Label htmlFor='skus'>SKUs de Productos (uno por línea)</Label>
								<Textarea
									name='skus'
									className='w-full rounded-lg border border-gray-300 p-3 font-mono text-sm'
									rows={10}
									value={skuList}
									onChange={(e) => setSkuList(e.target.value)}
									placeholder='SKU-001&#10;SKU-002&#10;SKU-003'
								/>
								<p className='mt-1 text-xs text-gray-500'>
									Ingresa los SKUs de los productos que deseas sincronizar. El
									sistema consultará el stock actual en el ERP y lo actualizará en
									WooCommerce.
								</p>
							</div>

							<div className='flex justify-end'>
								<Button
									variant='solid'
									icon='HeroArrowPath'
									onClick={handleSyncStock}
									disabled={
										syncing ||
										!selectedIntegrationId ||
										!skuList.trim() ||
										selectedIntegration?.mode !== 'read_write'
									}>
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
								<CardTitle>Resultado de la Sincronización</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div className='grid grid-cols-3 gap-4'>
									<div className='rounded-lg border border-green-200 bg-green-50 p-4'>
										<div className='text-sm text-green-600'>Sincronizados</div>
										<div className='text-2xl font-bold text-green-700'>
											{lastSyncResult.synced?.length || 0}
										</div>
									</div>
									<div className='rounded-lg border border-red-200 bg-red-50 p-4'>
										<div className='text-sm text-red-600'>Errores</div>
										<div className='text-2xl font-bold text-red-700'>
											{lastSyncResult.errors?.length || 0}
										</div>
									</div>
									<div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
										<div className='text-sm text-yellow-600'>
											No Encontrados
										</div>
										<div className='text-2xl font-bold text-yellow-700'>
											{lastSyncResult.not_found?.length || 0}
										</div>
									</div>
								</div>

								{lastSyncResult.synced && lastSyncResult.synced.length > 0 && (
									<div>
										<h3 className='mb-2 font-semibold text-green-700'>
											Productos Sincronizados:
										</h3>
										<div className='space-y-1'>
											{lastSyncResult.synced.map((item: any, idx: number) => (
												<div
													key={idx}
													className='flex items-center justify-between rounded bg-green-50 p-2'>
													<span className='font-mono text-sm'>
														{item.sku}
													</span>
													<Badge color='green'>
														Stock: {item.stock_quantity}
													</Badge>
												</div>
											))}
										</div>
									</div>
								)}

								{lastSyncResult.errors && lastSyncResult.errors.length > 0 && (
									<div>
										<h3 className='mb-2 font-semibold text-red-700'>
											Errores:
										</h3>
										<div className='space-y-1'>
											{lastSyncResult.errors.map((item: any, idx: number) => (
												<div
													key={idx}
													className='rounded bg-red-50 p-2 text-sm'>
													<strong>{item.sku}</strong>: {item.error}
												</div>
											))}
										</div>
									</div>
								)}

								{lastSyncResult.not_found &&
									lastSyncResult.not_found.length > 0 && (
										<div>
											<h3 className='mb-2 font-semibold text-yellow-700'>
												No Encontrados:
											</h3>
											<div className='space-y-1'>
												{lastSyncResult.not_found.map(
													(sku: string, idx: number) => (
														<div
															key={idx}
															className='rounded bg-yellow-50 p-2 font-mono text-sm'>
															{sku}
														</div>
													),
												)}
											</div>
										</div>
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
