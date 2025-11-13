import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchIntegrations } from '@/store/slices/integrations/integrationsSlice';
import { checkOrImportOrder, importMissingOrders } from '@/services/integrationsService';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/Badge';
import { toast } from 'react-toastify';

const ImportOrdersPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const subsidiaryId = useAppSelector(
		(state) =>
			state.auth.user?.subsidiary?.id || state.auth.user?.personalizacion?.subsidiary_id,
	);
	const { integrations } = useAppSelector((state) => state.integrations);

	const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
	const [orderId, setOrderId] = useState('');
	const [importing, setImporting] = useState(false);
	const [importResult, setImportResult] = useState<any>(null);

	// Estados para importación masiva
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [importingBulk, setImportingBulk] = useState(false);
	const [bulkResult, setBulkResult] = useState<any>(null);

	useEffect(() => {
		if (subsidiaryId) {
			dispatch(fetchIntegrations({ subsidiaryId }));
		}
	}, [dispatch, subsidiaryId]);

	const handleCheckOrder = async () => {
		if (!subsidiaryId || !selectedIntegrationId || !orderId.trim()) {
			toast.error('Debes seleccionar una integración e ingresar un ID de orden');
			return;
		}

		setImporting(true);
		setImportResult(null);

		try {
			const result = await checkOrImportOrder(
				subsidiaryId,
				Number(orderId),
				selectedIntegrationId || undefined,
			);
			setImportResult(result);
			if (result.imported) {
				toast.success('Orden importada correctamente');
			} else {
				toast.info('La orden ya existe en el sistema');
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.message || 'Error al verificar/importar la orden');
			console.error(error);
		} finally {
			setImporting(false);
		}
	};

	const handleImportMissing = async () => {
		if (!subsidiaryId || !selectedIntegrationId || !startDate || !endDate) {
			toast.error('Debes seleccionar una integración y un rango de fechas');
			return;
		}

		setImportingBulk(true);
		setBulkResult(null);

		try {
			const result = await importMissingOrders(
				subsidiaryId,
				selectedIntegrationId || undefined,
			);
			setBulkResult(result);
			toast.success(
				`Importación completada: ${result.result?.imported || 0} órdenes importadas`,
			);
		} catch (error: any) {
			toast.error(error?.response?.data?.message || 'Error al importar órdenes faltantes');
			console.error(error);
		} finally {
			setImportingBulk(false);
		}
	};

	return (
		<PageWrapper name='Importar Órdenes'>
			<Subheader>
				<SubheaderLeft>
					<span className='text-2xl font-semibold'>Importar Órdenes de WooCommerce</span>
				</SubheaderLeft>
			</Subheader>
			<Container>
				<div className='grid gap-4 md:grid-cols-2'>
					{/* Importar Orden Individual */}
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Importar Orden Individual</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div>
									<Label htmlFor='integration-select-1'>Integración de WooCommerce</Label>
									<Select
										name='integration-select-1'
										value={selectedIntegrationId || ''}
										onChange={(e) =>
											setSelectedIntegrationId(
												e.target.value ? e.target.value : null,
											)
										}>
										<option value=''>Selecciona una integración</option>
										{integrations
											.filter((i) => i.is_active)
											.map((integration) => (
												<option key={integration.id} value={integration.id}>
													{integration.name} - {integration.base_url}
												</option>
											))}
									</Select>
								</div>

								<div>
									<Label htmlFor='order-id-input'>ID de Orden de WooCommerce</Label>
									<Input
										name='order-id-input'
										type='number'
										value={orderId}
										onChange={(e) => setOrderId(e.target.value)}
										placeholder='12345'
									/>
								</div>

								<Button
									variant='solid'
									icon='HeroArrowDownTray'
									onClick={handleCheckOrder}
									disabled={
										importing || !selectedIntegrationId || !orderId.trim()
									}
									className='w-full'>
									{importing ? 'Verificando...' : 'Verificar e Importar'}
								</Button>

								{importResult && (
									<div
										className={`rounded-lg p-4 ${
											importResult.imported
												? 'border border-green-200 bg-green-50'
												: 'border border-blue-200 bg-blue-50'
										}`}>
										<p className='font-semibold'>
											{importResult.imported
												? '✅ Orden Importada'
												: 'ℹ️ Orden Ya Existe'}
										</p>
										<p className='text-sm'>
											Orden WC: #{importResult.woocommerce_order_id}
										</p>
										{importResult.erp_order_id && (
											<p className='text-sm'>
												Orden ERP: #{importResult.erp_order_id}
											</p>
										)}
									</div>
								)}
							</div>
						</CardBody>
					</Card>

					{/* Importar Órdenes Faltantes */}
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Importar Órdenes Faltantes (Rango de Fechas)</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div>
									<Label htmlFor='integration-select-2'>Integración de WooCommerce</Label>
									<Select
										name='integration-select-2'
										value={selectedIntegrationId || ''}
										onChange={(e) =>
											setSelectedIntegrationId(
												e.target.value ? e.target.value : null,
											)
										}>
										<option value=''>Selecciona una integración</option>
										{integrations
											.filter((i) => i.is_active)
											.map((integration) => (
												<option key={integration.id} value={integration.id}>
													{integration.name} - {integration.base_url}
												</option>
											))}
									</Select>
								</div>

								<div>
									<Label htmlFor='start-date'>Fecha Inicio</Label>
									<Input
										name='start-date'
										type='date'
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
									/>
								</div>

								<div>
									<Label htmlFor='end-date'>Fecha Fin</Label>
									<Input
										name='end-date'
										type='date'
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
									/>
								</div>

								<Button
									variant='solid'
									icon='HeroArrowDownTray'
									onClick={handleImportMissing}
									disabled={
										importingBulk ||
										!selectedIntegrationId ||
										!startDate ||
										!endDate
									}
									className='w-full'>
									{importingBulk ? 'Importando...' : 'Importar Faltantes'}
								</Button>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Resultado de Importación Masiva */}
				{bulkResult && (
					<Card className='mt-4'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Resultado de Importación Masiva</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div className='grid grid-cols-3 gap-4'>
									<div className='rounded-lg border border-green-200 bg-green-50 p-4'>
										<div className='text-sm text-green-600'>Importadas</div>
										<div className='text-2xl font-bold text-green-700'>
											{bulkResult.imported?.length || 0}
										</div>
									</div>
									<div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
										<div className='text-sm text-blue-600'>Ya Existentes</div>
										<div className='text-2xl font-bold text-blue-700'>
											{bulkResult.already_exists?.length || 0}
										</div>
									</div>
									<div className='rounded-lg border border-red-200 bg-red-50 p-4'>
										<div className='text-sm text-red-600'>Errores</div>
										<div className='text-2xl font-bold text-red-700'>
											{bulkResult.errors?.length || 0}
										</div>
									</div>
								</div>

								{bulkResult.imported && bulkResult.imported.length > 0 && (
									<div>
										<h3 className='mb-2 font-semibold text-green-700'>
											Órdenes Importadas:
										</h3>
										<div className='space-y-1'>
											{bulkResult.imported.map((item: any, idx: number) => (
												<div
													key={idx}
													className='flex items-center justify-between rounded bg-green-50 p-2'>
													<span className='text-sm'>
														WC Order #{item.woocommerce_order_id}
													</span>
													<Badge color='green'>
														ERP Order #{item.erp_order_id}
													</Badge>
												</div>
											))}
										</div>
									</div>
								)}

								{bulkResult.errors && bulkResult.errors.length > 0 && (
									<div>
										<h3 className='mb-2 font-semibold text-red-700'>
											Errores:
										</h3>
										<div className='space-y-1'>
											{bulkResult.errors.map((item: any, idx: number) => (
												<div
													key={idx}
													className='rounded bg-red-50 p-2 text-sm'>
													<strong>Order #{item.order_id}</strong>:{' '}
													{item.error}
												</div>
											))}
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

export default ImportOrdersPage;
