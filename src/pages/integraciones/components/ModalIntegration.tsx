import React, { useState, useEffect, useId, memo } from 'react';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { useAppSelector, useAppDispatch } from '@/store';
import {
	createIntegration,
	updateIntegration,
	deleteIntegration,
	fetchIntegrations,
} from '@/store/slices/integrations/integrationsSlice';
import type {
	Integration,
	CreateIntegrationPayload,
	IntegrationMode,
} from '@/types/integrations.types';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import classNames from 'classnames';
import WebhookCatalogPanel from './WebhookCatalogPanel';

interface ModalIntegrationProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	integration: Integration | null;
	mode: 'create' | 'edit' | 'view';
}

const ModalIntegration: React.FC<ModalIntegrationProps> = ({
	isOpen,
	onClose,
	onSuccess,
	integration,
	mode,
}) => {
	const dispatch = useAppDispatch();
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const { loading } = useAppSelector((state) => state.integrations);

	const [showSecrets, setShowSecrets] = useState(false);
	const [secrets, setSecrets] = useState<{
		api_key?: string;
		webhook_secret?: string;
	}>({});
	const apiKeyInputId = useId();
	const webhookInputId = useId();

	// Form state
	const [formData, setFormData] = useState<Partial<CreateIntegrationPayload>>({
		name: '',
		provider: 'woocommerce',
		base_url: '',
		mode: 'webhook',
		is_active: true,
		consumer_key: '',
		consumer_secret: '',
	});

	useEffect(() => {
		if (integration && mode !== 'create') {
			setFormData({
				name: integration.name,
				provider: integration.provider,
				base_url: integration.base_url,
				mode: integration.mode,
				is_active: integration.is_active,
			});
		} else if (mode === 'create') {
			// Reset form for create mode
			setFormData({
				name: '',
				provider: 'woocommerce',
				base_url: '',
				mode: 'webhook',
				is_active: true,
				consumer_key: '',
				consumer_secret: '',
			});
		}
	}, [integration, mode, isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!subsidiaryId) {
			toast.error('No se pudo obtener el ID de la subsidiaria');
			return;
		}

		// El backend exige HTTPS en la URL base: validar antes de enviar.
		const baseUrl = formData.base_url?.trim() ?? '';
		if (mode === 'create' && baseUrl && !/^https:\/\//i.test(baseUrl)) {
			toast.error('La URL base debe usar HTTPS (https://…)');
			return;
		}

		try {
			if (mode === 'create') {
				const resultAction = await dispatch(
					createIntegration({
						subsidiaryId,
						payload: formData as CreateIntegrationPayload,
					}),
				);

				if (createIntegration.fulfilled.match(resultAction)) {
					const response = resultAction.payload;

					// Mostrar secretos solo una vez
					if (response.api_key || response.webhook_secret) {
						setSecrets({
							api_key: response.api_key,
							webhook_secret: response.webhook_secret,
						});
						setShowSecrets(true);
					} else {
						toast.success('Integración creada correctamente');
						await dispatch(fetchIntegrations({ subsidiaryId }));
						onSuccess();
					}
				} else {
					// `payload` trae el mensaje real del backend (HTTPS, "ya existe
					// una integración activa de este tipo", etc.).
					toast.error(
						(resultAction.payload as string) || 'Error al crear la integración',
					);
				}
			} else if (mode === 'edit' && integration) {
				const resultAction = await dispatch(
					updateIntegration({
						subsidiaryId,
						integrationId: integration.id,
						payload: {
							name: formData.name,
							is_active: formData.is_active,
						},
					}),
				);

				if (updateIntegration.fulfilled.match(resultAction)) {
					toast.success('Integración actualizada correctamente');
					await dispatch(fetchIntegrations({ subsidiaryId }));
					onSuccess();
				} else {
					toast.error(
						(resultAction.payload as string) || 'Error al actualizar la integración',
					);
				}
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Error al guardar la integración';
			toast.error(message);
		}
	};

	const [ModalDeleteisOpen, setModalDeleteIsOpen] = useState(false);

	const openModalDelete = () => {
		if (!subsidiaryId || !integration?.id) return;
		setModalDeleteIsOpen(true);
	};

	const handleDelete = async () => {
		setModalDeleteIsOpen(false);
		if (!subsidiaryId || !integration?.id) return;
		try {
			const resultAction = await dispatch(
				deleteIntegration({
					subsidiaryId,
					integrationId: integration?.id,
				}),
			);
			if (deleteIntegration.fulfilled.match(resultAction)) {
				toast.success('Integracion eliminada correctamente');
				await dispatch(
					fetchIntegrations({
						subsidiaryId: subsidiaryId ?? 0,
					}),
				);
				onSuccess();
				onClose();
			} else {
				toast.error(`Error al eliminar la integracion`);
			}
		} catch (error: string | any) {
			toast.error(error?.mensage || 'Error al eliminar la integración');
		}
	};

	const ModalDelete = memo(function ModalDelete({
		isOpen,
		onClose,
		onConfirm,
	}: {
		isOpen: boolean;
		onClose: () => void;
		onConfirm: () => void;
	}) {
		return (
			<Modal
				isOpen={isOpen}
				setIsOpen={onClose}
				size='md'
				>
				<ModalHeader>
					<Badge>Eliminar Integración</Badge>
				</ModalHeader>
				<ModalBody>
					<p>
						¿Estás seguro de que deseas eliminar esta integración? Esta acción no se
						puede deshacer.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						color='red'
						onClick={onClose}
						icon='HeroX'
						title='Cancelar'>
						Cancelar
					</Button>
					<Button
						variant='solid'
						onClick={onConfirm}
						icon='HeroTrash'
						color='red'
						title='Eliminar esta integración de forma permanente'
					>Eliminar</Button>
				</ModalFooter>
			</Modal>
		);
	});

	const handleRotateKey = async (type: 'api_key' | 'webhook_secret') => {
		if (!subsidiaryId || !integration) return;
		if (
			!confirm(
				`¿Estás seguro de rotar el ${type === 'api_key' ? 'API Key' : 'Webhook Secret'}? El anterior dejará de funcionar.`,
			)
		)
			return;

		try {
			const payload =
				type === 'api_key' ? { rotate_api_key: true } : { rotate_webhook_secret: true };

			const resultAction = await dispatch(
				updateIntegration({
					subsidiaryId,
					integrationId: integration.id,
					payload,
				}),
			);

			if (updateIntegration.fulfilled.match(resultAction)) {
				const response = resultAction.payload;

				if (response.api_key || response.webhook_secret) {
					setSecrets({
						api_key: response.api_key,
						webhook_secret: response.webhook_secret,
					});
					setShowSecrets(true);
				}

				toast.success('Clave rotada correctamente');
				await dispatch(fetchIntegrations({ subsidiaryId }));
			} else {
				toast.error('Error al rotar la clave');
			}
		} catch (error: any) {
			toast.error(error?.message || 'Error al rotar');
			console.error(error);
		}
	};

	const handleCopySecret = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copiado al portapapeles`);
	};

	const getModeLabel = (m: string) => {
		const modes: Record<string, string> = {
			webhook: 'Webhook',
			read: 'Solo Lectura',
			read_write: 'Lectura/Escritura',
		};
		return modes[m] || m;
	};

	

	if (showSecrets) {
		return (
			<Modal
				isOpen={isOpen}
				setIsOpen={onClose}
				size='xl'
				isStaticBackdrop
				isStaticBackdropAnimation>
				<ModalHeader>
					<Icon icon='HeroExclamationTriangle' className='mr-2 text-yellow-500' />
					Credenciales de Integración (Solo se mostrarán una vez)
				</ModalHeader>
				<ModalBody>
					<div className='space-y-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-500/30 dark:bg-yellow-950/30'>
						<p className='text-sm font-semibold text-yellow-800 dark:text-yellow-100'>
							⚠️ Guarda estas credenciales ahora. No podrás volver a verlas.
						</p>

						{secrets.api_key && (
							<div>
								<Label htmlFor={apiKeyInputId}>API Key</Label>
								<div className='flex gap-2'>
									<Input
										id={apiKeyInputId}
										name='api_key'
										type='text'
										value={secrets.api_key}
										readOnly
										className='font-mono text-sm dark:bg-neutral-900 dark:text-white'
									/>
									<Button
										size='sm'
										icon='HeroClipboard'
										onClick={() =>
											handleCopySecret(secrets.api_key!, 'API Key')
										}>
										Copiar
									</Button>
								</div>
								{formData.mode === 'webhook' && (
									<p className='mt-2 text-xs text-gray-600 dark:text-gray-300'>
										URL del Webhook:{' '}
										<code className='rounded bg-gray-100 px-2 py-1'>
											{window.location.origin}
											/api/integrations/woocommerce/webhooks/{secrets.api_key}
											/orders
										</code>
									</p>
								)}
							</div>
						)}

						{secrets.webhook_secret && (
							<div>
								<Label htmlFor={webhookInputId}>Webhook Secret</Label>
								<div className='flex gap-2'>
									<Input
										id={webhookInputId}
										name='webhook_secret'
										type='text'
										value={secrets.webhook_secret}
										readOnly
										className='font-mono text-sm dark:bg-neutral-900 dark:text-white'
									/>
									<Button
										size='sm'
										icon='HeroClipboard'
										onClick={() =>
											handleCopySecret(
												secrets.webhook_secret!,
												'Webhook Secret',
											)
										}>
										Copiar
									</Button>
								</div>
								<p className='mt-2 text-xs text-gray-600 dark:text-gray-300'>
									Usa este secret en la configuración del Webhook en WooCommerce
								</p>
							</div>
						)}
					</div>

					<div className='mt-4 flex justify-end'>
						<Button
							variant='solid'
							onClick={async () => {
								setShowSecrets(false);
								setSecrets({});
								if (subsidiaryId) {
									await dispatch(fetchIntegrations({ subsidiaryId }));
								}
								onSuccess();
							}}>
							Entendido, continuar
						</Button>
					</div>
				</ModalBody>
			</Modal>
		);
	}

	// Vista normal
	return (
		<>
			<Modal isOpen={isOpen} setIsOpen={onClose} size='xl' isStaticBackdrop isStaticBackdropAnimation>
				<ModalHeader>
					{mode === 'create' && 'Nueva Integración'}
					{mode === 'edit' && 'Editar Integración'}
					{mode === 'view' && 'Detalle de Integración'}
				</ModalHeader>
				<ModalBody>
					<form onSubmit={handleSubmit} className='space-y-4'>
						{/* Nombre */}
						<div>
							<Label htmlFor='name'>Nombre de la Integración</Label>
							<Input
								id='name'
								name='name'
								type='text'
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								disabled={mode === 'view'}
								required
							/>
						</div>

						{/* Proveedor */}
						<div>
							<Label htmlFor='provider'>Proveedor</Label>
							<Select
								id='provider'
								name='provider'
								value={formData.provider}
								onChange={(e) =>
									setFormData({
										...formData,
										provider: e.target.value as 'woocommerce',
									})
								}
								disabled={mode !== 'create'}
								required>
								<option value='woocommerce'>WooCommerce</option>
							</Select>
						</div>

						{/* Base URL */}
						<div>
							<Label htmlFor='base_url'>URL Base</Label>
							<Input
								id='base_url'
								name='base_url'
								type='url'
								value={formData.base_url}
								onChange={(e) =>
									setFormData({ ...formData, base_url: e.target.value })
								}
								disabled={mode !== 'create'}
								placeholder='https://mitienda.cl'
								required
							/>
						</div>

						{/* Modo */}
						<div>
							<Label htmlFor='mode'>Modo de Conexión</Label>
							<Select
								id='mode'
								name='mode'
								value={formData.mode}
								onChange={(e) =>
									setFormData({
										...formData,
										mode: e.target.value as IntegrationMode,
									})
								}
								disabled={mode !== 'create'}
								required>
								<option value='webhook'>Webhook (Solo recibir órdenes)</option>
								<option value='read'>API REST - Solo Lectura</option>
								<option value='read_write'>API REST - Lectura/Escritura</option>
							</Select>
							<p className='mt-1 text-xs text-gray-500'>
								{formData.mode === 'webhook' &&
									'Webhook: WooCommerce enviará las órdenes automáticamente'}
								{formData.mode === 'read' &&
									'Solo Lectura: Consultar órdenes de WooCommerce'}
								{formData.mode === 'read_write' &&
									'Lectura/Escritura: Consultar y sincronizar stock'}
							</p>
						</div>

						{/* Catálogo dinámico de eventos soportados (solo aplica a webhooks) */}
						{formData.mode === 'webhook' && (
							<WebhookCatalogPanel provider={formData.provider} />
						)}

						<div className='grid gap-4 md:grid-cols-2'>
							<div>
								<Label htmlFor='consumer_key'>Consumer Key</Label>
								<Input
									id='consumer_key'
									name='consumer_key'
									type='text'
									value={formData.consumer_key}
									onChange={(e) =>
										setFormData({ ...formData, consumer_key: e.target.value })
									}
									placeholder={
										formData.mode === 'webhook'
											? 'Se generará automáticamente'
											: 'ck_...'
									}
									disabled={formData.mode === 'webhook'}
									required={formData.mode !== 'webhook'}
								/>
								{formData.mode === 'webhook' && (
									<p className='mt-1 text-xs text-gray-500'>
										Esta integración es solo webhook, la clave se generará y se
										mostrará una vez al guardar.
									</p>
								)}
							</div>
							<div>
								<Label htmlFor='consumer_secret'>Consumer Secret</Label>
								<Input
									id='consumer_secret'
									name='consumer_secret'
									type='password'
									value={formData.consumer_secret}
									onChange={(e) =>
										setFormData({
											...formData,
											consumer_secret: e.target.value,
										})
									}
									placeholder={
										formData.mode === 'webhook'
											? 'Se generará automáticamente'
											: 'cs_...'
									}
									disabled={formData.mode === 'webhook'}
									required={formData.mode !== 'webhook'}
								/>
								{formData.mode === 'webhook' && (
									<p className='mt-1 text-xs text-gray-500'>
										El secret también se mostrará al finalizar la creación.
									</p>
								)}
							</div>
						</div>

						{/* Estado */}
						<div className='flex items-center gap-2'>
							<input
								id='is_active'
								type='checkbox'
								checked={formData.is_active}
								onChange={(e) =>
									setFormData({ ...formData, is_active: e.target.checked })
								}
								disabled={mode === 'view'}
								className='h-4 w-4'
							/>
							<Label htmlFor='is_active' className='mb-0'>
								Integración Activa
							</Label>
						</div>

						{/* Información adicional en modo ver/editar */}
						{integration && mode !== 'create' && (
							<div className='space-y-3 border-t pt-4'>
								<h3 className='text-sm font-semibold'>Información de Seguridad</h3>
								<div className='grid grid-cols-2 gap-3 text-sm'>
									<div>
										<span className='text-gray-600'>API Key Prefix:</span>
										<code className='ml-2 rounded bg-gray-100 px-2 py-1'>
											{integration.api_key_prefix}
										</code>
									</div>
									<div>
										<span className='text-gray-600'>Tiene API Key:</span>
										<Badge
											color={integration.has_api_key ? 'green' : 'red'}
											className='ml-2'>
											{integration.has_api_key ? 'Sí' : 'No'}
										</Badge>
									</div>
									<div>
										<span className='text-gray-600'>Tiene Webhook Secret:</span>
										<Badge
											color={integration.has_webhook_secret ? 'green' : 'red'}
											className='ml-2'>
											{integration.has_webhook_secret ? 'Sí' : 'No'}
										</Badge>
									</div>
									<div>
										<span className='text-gray-600'>
											Tiene Consumer Secret:
										</span>
										<Badge
											color={
												integration.has_consumer_secret ? 'green' : 'red'
											}
											className='ml-2'>
											{integration.has_consumer_secret ? 'Sí' : 'No'}
										</Badge>
									</div>
								</div>

								{mode === 'edit' && (
									<div className='flex gap-2 pt-2'>
										<Button
											type='button'
											size='sm'
											variant='outline'
											onClick={() => handleRotateKey('api_key')}
											disabled={loading}>
											Rotar API Key
										</Button>
										{integration.mode === 'webhook' && (
											<Button
												type='button'
												size='sm'
												variant='outline'
												onClick={() => handleRotateKey('webhook_secret')}
												disabled={loading}>
												Rotar Webhook Secret
											</Button>
										)}
									</div>
								)}
							</div>
						)}

						{/* Botones */}
						<div className='flex justify-between border-t pt-4'>
							<div>
								{mode === 'edit' && (
									<Button
										type='button'
										variant='solid'
										color='red'
										onClick={() => openModalDelete()}
										disabled={loading}>
										Eliminar
									</Button>
								)}
							</div>
							<div className='flex gap-2'>
								<Button
									type='button'
									variant='outline'
									color='red'
									onClick={onClose}>
									{mode === 'view' ? 'Cerrar' : 'Cancelar'}
								</Button>
								{mode !== 'view' && (
									<Button type='submit' variant='solid' disabled={loading}>
										{loading ? 'Guardando...' : 'Guardar'}
									</Button>
								)}
							</div>
						</div>
					</form>
				</ModalBody>
			</Modal>
			<ModalDelete
				isOpen={ModalDeleteisOpen}
				onClose={() => setModalDeleteIsOpen(false)}
				onConfirm={handleDelete}
			/>
		</>
	);
};

export default ModalIntegration;
