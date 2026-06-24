import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
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
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Icon from '@/components/icon/Icon';

export const ImportOrdersContent: React.FC = () => {
	const dispatch = useAppDispatch();
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const { integrations } = useAppSelector((state) => state.integrations);

	const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
	const [orderId, setOrderId] = useState('');
	const [importing, setImporting] = useState(false);
	const [importResult, setImportResult] = useState<any>(null);

	// Estados para importación masiva
	const [importingBulk, setImportingBulk] = useState(false);
	const [bulkResult, setBulkResult] = useState<any>(null);
	const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
	const [confirmationText, setConfirmationText] = useState('');

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

	const performImportMissing = async () => {
		if (!subsidiaryId || !selectedIntegrationId) {
			toast.error('Debes seleccionar una integración válida');
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
			toast.success(`Importación iniciada`);
		} catch (error: any) {
			toast.error(error?.response?.data?.message || 'Error al importar órdenes faltantes');
			console.error(error);
		} finally {
			setImportingBulk(false);
		}
	};

	const handleOpenConfirmationModal = () => {
		if (!subsidiaryId || !selectedIntegrationId) {
			toast.error('Debes seleccionar una integración para importar órdenes faltantes');
			return;
		}
		setConfirmationText('');
		setIsConfirmationModalOpen(true);
	};

	const selectedIntegration = integrations.find(
		(integration) => integration.id === selectedIntegrationId,
	);
	const confirmationIsValid = confirmationText.trim().toLowerCase() === 'confirmar';

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<span className='text-2xl font-semibold'>Importar Órdenes de WooCommerce</span>
				</SubheaderLeft>
			</Subheader>
			<Container>
				<div className='grid gap-4 md:grid-cols-2'>
					{/* Importar Orden Individual */}
					<Card className='border border-neutral-100/70 bg-white/95 shadow-lg shadow-black/10 dark:border-white/5 dark:bg-neutral-900/80'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Importar Orden Individual</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-5'>
								<div>
									<Label htmlFor='integration-select-1'>
										Integración de WooCommerce
									</Label>
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
									<Label htmlFor='order-id-input'>
										ID de Orden de WooCommerce
									</Label>
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
										className={`rounded-lg border p-4 text-sm ${
											importResult.imported
												? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-100'
												: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-950/20 dark:text-sky-100'
										}`}>
										<p className='text-base font-semibold'>
											{importResult.imported
												? '✅ Orden importada con éxito'
												: 'ℹ️ La orden ya estaba en ERP'}
										</p>
										<p className='mt-1'>
											Orden WC: #{importResult.woocommerce_order_id}
										</p>
										{importResult.erp_order_id && (
											<p>Orden ERP: #{importResult.erp_order_id}</p>
										)}
										{importResult.sale && (
											<div className='mt-3 grid gap-1 text-xs opacity-80 md:grid-cols-2'>
												<span>Total: {importResult.sale.total_amount}</span>
												<span>Estado: {importResult.sale.status}</span>
											</div>
										)}
									</div>
								)}
							</div>
						</CardBody>
					</Card>

					{/* Importar Órdenes Faltantes */}
					<Card className='border border-neutral-100/70 bg-white/95 shadow-lg shadow-black/10 dark:border-white/5 dark:bg-neutral-900/80'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Importar Órdenes Faltantes</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-5'>
								<p className='rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-950/30 dark:text-yellow-100'>
									Esta acción intentará importar todas las órdenes pendientes
									detectadas en WooCommerce para la integración seleccionada.
									Úsala únicamente cuando estés seguro de que es necesario, pues
									requiere escribir <strong>CONFIRMAR</strong> para continuar.
								</p>
								<div>
									<Label htmlFor='integration-select-2'>
										Integración de WooCommerce
									</Label>
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

								<Button
									variant='solid'
									icon='HeroArrowDownTray'
									onClick={handleOpenConfirmationModal}
									disabled={importingBulk || !selectedIntegrationId}
									className='w-full'>
									{importingBulk ? 'Importando...' : 'Importar Faltantes'}
								</Button>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Resultado de Importación Masiva */}
				{bulkResult && (
					<Card className='mt-4 border border-neutral-100/70 bg-white/95 shadow-lg shadow-black/10 dark:border-white/5 dark:bg-neutral-900/80'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Resultado de Importación Masiva</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<div className='grid grid-cols-3 gap-4'>
									<div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20'>
										<div className='text-sm text-emerald-700 dark:text-emerald-200'>
											Importadas
										</div>
										<div className='text-2xl font-bold text-emerald-800 dark:text-emerald-100'>
											{bulkResult.imported?.length || 0}
										</div>
									</div>
									<div className='rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/30 dark:bg-sky-950/20'>
										<div className='text-sm text-sky-700 dark:text-sky-200'>
											Ya Existentes
										</div>
										<div className='text-2xl font-bold text-sky-800 dark:text-sky-100'>
											{bulkResult.already_exists?.length || 0}
										</div>
									</div>
									<div className='rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/40 dark:bg-rose-950/30'>
										<div className='text-sm text-rose-700 dark:text-rose-200'>
											Errores
										</div>
										<div className='text-2xl font-bold text-rose-800 dark:text-rose-100'>
											{bulkResult.errors?.length || 0}
										</div>
									</div>
								</div>

								{bulkResult.imported && bulkResult.imported.length > 0 && (
									<div>
										<h3 className='mb-2 font-semibold text-emerald-700 dark:text-emerald-200'>
											Órdenes Importadas:
										</h3>
										<div className='space-y-1'>
											{bulkResult.imported.map((item: any, idx: number) => (
												<div
													key={idx}
													className='flex items-center justify-between rounded bg-emerald-50 p-2 dark:bg-emerald-950/20'>
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
										<h3 className='mb-2 font-semibold text-rose-700 dark:text-rose-200'>
											Errores:
										</h3>
										<div className='space-y-1'>
											{bulkResult.errors.map((item: any, idx: number) => (
												<div
													key={idx}
													className='rounded bg-rose-50 p-2 text-sm dark:bg-rose-950/20'>
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
			<Modal
				isOpen={isConfirmationModalOpen}
				setIsOpen={(open) => {
					if (!importingBulk) {
						setIsConfirmationModalOpen(open);
					}
				}}
				size='sm'
				isStaticBackdrop>
				<ModalHeader>
					<Icon icon='HeroExclamationTriangle' className='text-yellow-500' />
					<span>Confirmar importación masiva</span>
				</ModalHeader>
				<ModalBody className='space-y-4'>
					<p className='text-sm text-zinc-600 dark:text-zinc-300'>
						Se importarán todas las órdenes faltantes detectadas en WooCommerce para la
						integración seleccionada. Esta operación puede tardar varios minutos.
					</p>
					{selectedIntegration && (
						<div className='rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-800'>
							<strong>Integración:</strong> {selectedIntegration.name} -{' '}
							<span className='break-all'>{selectedIntegration.base_url}</span>
						</div>
					)}
					<div>
						<Label htmlFor='confirm-import-input'>
							Escribe CONFIRMAR para continuar
						</Label>
						<Input
							name='confirm'
							id='confirm-import-input'
							value={confirmationText}
							onChange={(event) => setConfirmationText(event.target.value)}
							placeholder='CONFIRMAR'
						/>
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							icon='HeroXMark'
							onClick={() => setIsConfirmationModalOpen(false)}
							disabled={importingBulk}>
							Cancelar
						</Button>
					</ModalFooterChild>
					<ModalFooterChild>
						<Button
							variant='solid'
							color='yellow'
							icon='HeroArrowDownTray'
							onClick={() => {
								setIsConfirmationModalOpen(false);
								setConfirmationText('');
								void performImportMissing();
							}}
							disabled={!confirmationIsValid || importingBulk}>
							Importar
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

const ImportOrdersPage: React.FC = () => (
	<PageWrapper name='Importar Órdenes'>
		<ImportOrdersContent />
	</PageWrapper>
);

export default ImportOrdersPage;
