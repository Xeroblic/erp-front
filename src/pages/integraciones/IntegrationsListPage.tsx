import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import type { ColumnDef } from '@tanstack/react-table';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Checkbox from '@/components/form/Checkbox';
import Tooltip from '@/components/ui/Tooltip';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchIntegrations,
	fetchTrashedIntegrations,
	restoreIntegration,
	setSelectedIntegration,
	updateIntegration,
} from '@/store/slices/integrations/integrationsSlice';
import type { Integration } from '@/types/integrations.types';
import type { TIcons } from '@/types/icons.type';
import ModalIntegration from './components/ModalIntegration';
import RestoreConflictModal from './components/RestoreConflictModal';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import DataTable from '@/components/ui/DataTable/DataTable';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

export const IntegrationsListContent: React.FC = () => {
	const dispatch = useAppDispatch();

	const currentUser = useAppSelector((state) => state.auth.user);
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const { branchId } = useCurrentBranch();

	// State desde Redux
	const { integrations, trashedIntegrations, loading, error } = useAppSelector(
		(state) => state.integrations,
	);

	// State local
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
	const [selectedIntegration, setSelectedIntegrationLocal] = useState<Integration | null>(null);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
	const [restoringId, setRestoringId] = useState<string | null>(null);
	const [conflictError, setConflictError] = useState<{
		message: string;
		integrationName: string;
	} | null>(null);

	useEffect(() => {
		if (subsidiaryId) {
			if (viewMode === 'active') {
				dispatch(fetchIntegrations({ subsidiaryId }));
			} else {
				dispatch(fetchTrashedIntegrations({ subsidiaryId }));
			}
		} else {
			console.error('No subsidiaryId found');
			toast.error('No se pudo identificar la subsidiaria actual. Verifica tu sesión.');
		}
	}, [dispatch, subsidiaryId, viewMode]);

	useEffect(() => {
		if (error) {
			toast.error(error);
		}
	}, [error]);

	const handleCreate = () => {
		setSelectedIntegrationLocal(null);
		dispatch(setSelectedIntegration(null));
		setModalMode('create');
		setIsModalOpen(true);
	};

	const handleEdit = (integration: Integration) => {
		setSelectedIntegrationLocal(integration);
		dispatch(setSelectedIntegration(integration));
		setModalMode('edit');
		setIsModalOpen(true);
	};

	const handleView = (integration: Integration) => {
		setSelectedIntegrationLocal(integration);
		dispatch(setSelectedIntegration(integration));
		setModalMode('view');
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedIntegrationLocal(null);
		dispatch(setSelectedIntegration(null));
	};

	const handleSuccess = () => {
		setIsModalOpen(false);
		setSelectedIntegrationLocal(null);
		dispatch(setSelectedIntegration(null));
		if (subsidiaryId) {
			dispatch(fetchIntegrations({ subsidiaryId }));
		}
	};

	const handleRestore = useCallback(
		async (integration: Integration) => {
			if (!subsidiaryId || restoringId) return;
			setRestoringId(integration.id);
			try {
				await dispatch(
					restoreIntegration({
						subsidiaryId,
						integrationId: integration.id,
					}),
				).unwrap();
				toast.success(`"${integration.name}" restaurada correctamente`);
				dispatch(fetchTrashedIntegrations({ subsidiaryId }));
			} catch (err: unknown) {
				const message = typeof err === 'string' ? err : 'Error al restaurar la integración';
				if (
					message.includes('Ya existe una integración') ||
					message.includes('conflicto')
				) {
					setConflictError({
						message,
						integrationName: integration.name,
					});
				} else {
					toast.error(message);
				}
			} finally {
				setRestoringId(null);
			}
		},
		[subsidiaryId, restoringId, dispatch],
	);

	/**
	 * Toggle rápido de activación. Como solo puede haber una integración API REST
	 * activa por proveedor, al activar una se desactivan automáticamente las otras
	 * API REST activas del mismo proveedor (en una sola acción).
	 */
	const handleToggleActive = async (integration: Integration) => {
		if (!subsidiaryId || togglingId) return;
		setTogglingId(integration.id);
		try {
			if (integration.is_active) {
				await dispatch(
					updateIntegration({
						subsidiaryId,
						integrationId: integration.id,
						payload: { is_active: false },
					}),
				).unwrap();
				toast.success(`"${integration.name}" desactivada`);
			} else {
				// 1) Desactivar las otras API REST activas del mismo proveedor.
				const conflicts = integrations.filter(
					(i) =>
						i.id !== integration.id &&
						i.provider === integration.provider &&
						i.mode !== 'webhook' &&
						i.is_active,
				);
				for (const conflict of conflicts) {
					// eslint-disable-next-line no-await-in-loop
					await dispatch(
						updateIntegration({
							subsidiaryId,
							integrationId: conflict.id,
							payload: { is_active: false },
						}),
					).unwrap();
				}
				// 2) Activar la seleccionada.
				await dispatch(
					updateIntegration({
						subsidiaryId,
						integrationId: integration.id,
						payload: { is_active: true },
					}),
				).unwrap();
				toast.success(
					conflicts.length > 0
						? `"${integration.name}" activada (se desactivó "${conflicts[0].name}")`
						: `"${integration.name}" activada`,
				);
			}
			// No hace falta recargar toda la lista: cada `updateIntegration.fulfilled`
			// actualiza el item en el store. Evita el spinner global y el parpadeo.
		} catch (error) {
			toast.error(
				typeof error === 'string'
					? error
					: 'No se pudo cambiar el estado de la integración',
			);
		} finally {
			setTogglingId(null);
		}
	};

	const getModeInfo = useCallback((mode: string) => {
		const modes: Record<string, { label: string; icons: TIcons[] }> = {
			webhook: { label: 'Webhook', icons: ['HeroSignal'] },
			read: { label: 'Solo Lectura', icons: ['DuoBookOpen'] },
			read_write: { label: 'Lectura/Escritura', icons: ['DuoBookOpen', 'DuoWrite'] },
		};
		return modes[mode] || { label: mode, icons: [] };
	}, []);

	const getProviderLabel = useCallback((provider: string) => {
		const providers: Record<string, string> = {
			woocommerce: 'WooCommerce',
		};
		return providers[provider] || provider;
	}, []);

	const formatDate = useCallback((value?: string | null) => {
		if (!value) return null;
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		return date.toLocaleString('es-CL');
	}, []);

	const trashedColumns = useMemo<ColumnDef<Integration, unknown>[]>(
		() => [
			{
				header: 'Nombre',
				accessorKey: 'name',
				cell: ({ row }) => (
					<div>
						<div className='font-medium'>{row.original.name}</div>
						<div className='text-xs text-gray-500'>{row.original.base_url}</div>
					</div>
				),
			},
			{
				header: 'Proveedor',
				accessorKey: 'provider',
				cell: ({ row }) => getProviderLabel(row.original.provider),
			},
			{
				header: 'Modo',
				accessorKey: 'mode',
				cell: ({ row }) => {
					const { label } = getModeInfo(row.original.mode);
					return <Badge variant='outline'>{label}</Badge>;
				},
			},
			{
				header: 'Eliminada el',
				accessorKey: 'deleted_at',
				cell: ({ row }) => {
					const formatted = formatDate(row.original.deleted_at);
					return formatted ? (
						<span className='text-xs'>{formatted}</span>
					) : (
						<span className='text-gray-400'>-</span>
					);
				},
			},
			{
				id: 'acciones',
				header: 'Acciones',
				cell: ({ row }) => {
					const isRestoring = restoringId === row.original.id;
					return (
						<Tooltip text='Restaurar esta integración y sus productos vinculados'>
							<ProtectedButton
								permission="delete-integration"
								branchId={branchId}
								scope="access"
								size='sm'
								variant='outline'
								color='emerald'
								disabled={isRestoring || restoringId !== null}
								onClick={() => handleRestore(row.original)}>
								{isRestoring ? (
									<Icon
										icon='HeroArrowPath'
										className='h-4 w-4 animate-spin text-emerald-500'
									/>
								) : (
									<>
										<Icon
											icon='HeroArrowUturnUp'
											className='me-1 text-emerald-500'
										/>
										Restaurar
									</>
								)}
							</ProtectedButton>
						</Tooltip>
					);
				},
			},
		],
		[getProviderLabel, getModeInfo, handleRestore, restoringId, branchId],
	);

	const columns = useMemo<ColumnDef<Integration, unknown>[]>(
		() => [
			{
				header: 'Nombre',
				accessorKey: 'name',
				cell: ({ row }) => (
					<div>
						<div className='font-medium'>{row.original.name}</div>
						<div className='text-xs text-gray-500'>{row.original.base_url}</div>
					</div>
				),
			},
			{
				header: 'Proveedor',
				accessorKey: 'provider',
				cell: ({ row }) => getProviderLabel(row.original.provider),
			},
			{
				header: 'Modo',
				accessorKey: 'mode',
				cell: ({ row }) => {
					const modeColors: Record<string, string> = {
						webhook: 'blue',
						read: 'amber',
						read_write: 'emerald',
					};
					const { label, icons } = getModeInfo(row.original.mode);
					const webhookEvent =
						row.original.mode === 'webhook' ? row.original.event : null;
					return (
						<div className='flex items-center gap-1.5'>
							<Tooltip text={label}>
								<span className='inline-block'>
									<Badge
										variant='outline'
										rounded='rounded-full'
										color={modeColors[row.original.mode] || 'zinc'}
										className='py-1 px-1.5 flex items-center justify-center shadow-sm w-fit'>
										<span className='flex items-center gap-0.5'>
											{icons.map((ic) => (
												<Icon key={ic} icon={ic} className='text-2xl' />
											))}
										</span>
									</Badge>
								</span>
							</Tooltip>
							{webhookEvent && (
								<Badge
									variant='outline'
									rounded='rounded-full'
									color={webhookEvent.startsWith('product') ? 'violet' : 'blue'}
									className='w-fit px-2 py-0.5'>
									{webhookEvent}
								</Badge>
							)}
						</div>
					);
				},
			},
			{
				header: 'Estado',
				accessorKey: 'is_active',
				cell: ({ row }) =>
					row.original.is_active ? (
						<Badge color='green'>Activa</Badge>
					) : (
						<Badge color='red'>Inactiva</Badge>
					),
			},
			{
				header: 'Último Éxito',
				accessorKey: 'last_success_at',
				cell: ({ row }) => {
					const formatted = formatDate(row.original.last_success_at);
					return formatted ? (
						<span className='text-xs'>{formatted}</span>
					) : (
						<span className='text-gray-400'>-</span>
					);
				},
			},
			{
				header: 'Último Error',
				accessorKey: 'last_error_at',
				cell: ({ row }) => {
					const formatted = formatDate(row.original.last_error_at);
					return formatted ? (
						<div>
							<span className='text-xs text-red-600'>{formatted}</span>
							{row.original.last_error_msg && (
								<div className='max-w-xs truncate text-xs text-gray-500'>
									{row.original.last_error_msg}
								</div>
							)}
						</div>
					) : (
						<span className='text-gray-400'>-</span>
					);
				},
			},
			{
				id: 'acciones',
				header: 'Acciones',
				cell: ({ row }) => {
					const isRest = row.original.mode !== 'webhook';
					const isToggling = togglingId === row.original.id;
					return (
						<div className='flex items-center gap-2'>
							{isRest && (
								<Tooltip
									text={
										row.original.is_active
											? 'Desactivar esta tienda'
											: 'Activar esta tienda (desactiva la otra API REST activa)'
									}>
									<span className='flex items-center'>
										{isToggling ? (
											<Icon
												icon='HeroArrowPath'
												className='h-4 w-4 animate-spin text-neutral-400'
											/>
										) : (
											<Checkbox
												id={`toggle-active-${row.original.id}`}
												name={`toggle-active-${row.original.id}`}
												variant='switch'
												checked={row.original.is_active}
												onChange={() =>
													void handleToggleActive(row.original)
												}
												disabled={togglingId !== null}
											/>
										)}
									</span>
								</Tooltip>
							)}
							<Tooltip text='Ver detalles'>
								<Button
									size='sm'
									variant='outline'
									color='violet'
									className='group bg-violet-500/20 hover:bg-violet-600/20'
									onClick={() => handleView(row.original)}>
									<Icon
										icon='HeroEye'
										className='text-2xl me-1 text-violet-500 group-hover:text-violet-300'
									/>
								</Button>
							</Tooltip>
							<Tooltip text='Editar Integración'>
								<Button
									size='sm'
									variant='outline'
									color='sky'
									className='group bg-sky-600 hover:bg-sky-600/20	'
									onClick={() => handleEdit(row.original)}>
									<Icon
										icon='HeroPencil'
										className='text-2xl me-1 text-sky-500 group-hover:text-sky-300'
									/>
								</Button>
							</Tooltip>
						</div>
					);
				},
			},
		],
		[getProviderLabel, getModeInfo, handleView, handleEdit, handleToggleActive, togglingId],
	);

	if (!subsidiaryId) {
		return (
			<>
				<Container>
					<Card>
						<CardBody>
							<div className='py-8 text-center'>
								<Icon
									icon='HeroExclamationTriangle'
									size='text-6xl'
									className='mx-auto mb-4 text-yellow-500'
								/>
								<h2 className='mb-2 text-2xl font-bold text-gray-800'>
									No se pudo identificar la subsidiaria actual
								</h2>
								<p className='mb-4 text-gray-600'>
									Tu usuario no tiene asignada una subsidiaria. Esto puede deberse
									a:
								</p>
								<ul className='mb-6 inline-block space-y-2 text-left text-sm text-gray-600'>
									<li>✗ Tu cuenta no está vinculada a ninguna subsidiaria</li>
									<li>✗ Necesitas permisos específicos</li>
									<li>✗ La sesión necesita ser actualizada</li>
								</ul>
								<div className='mt-6 space-x-2'>
									<Button
										variant='solid'
										icon='HeroArrowPath'
										onClick={() => window.location.reload()}>
										Recargar Página
									</Button>
									<Button
										variant='outline'
										icon='HeroArrowRightOnRectangle'
										onClick={() => {
											// Implementar logout
											window.location.href = '/login';
										}}>
										Cerrar Sesión
									</Button>
								</div>
								<div className='mt-6 rounded-lg bg-gray-100 p-4 text-left text-xs'>
									<p className='mb-2 font-semibold'>Debug Info:</p>
									<pre className='overflow-auto text-xs'>
										{JSON.stringify(
											{
												hasUser: !!currentUser,
												userId: currentUser?.id,
												subsidiary: currentUser?.subsidiary,
												personalizacion:
													currentUser?.personalizacion?.subsidiary_id,
												branch: currentUser?.branch?.subsidiary,
											},
											null,
											2,
										)}
									</pre>
								</div>
							</div>
						</CardBody>
					</Card>
				</Container>
			</>
		);
	}

	return (
		<>
			<Container>
				<Card className='overflow-hidden border border-neutral-200 shadow-sm dark:border-neutral-700/80'>
					<CardHeader className='flex-col items-start gap-4 border-b border-neutral-200 bg-neutral-50/60 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-700 dark:bg-neutral-800/40'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/25 dark:bg-emerald-500/20 dark:ring-emerald-400/30'>
								<Icon
									icon={viewMode === 'active' ? 'HeroGlobeAlt' : 'HeroTrash'}
									className='h-5 w-5 text-emerald-600 dark:text-emerald-400'
								/>
							</div>
							<div>
								<CardTitle className='text-lg font-bold text-neutral-900 dark:text-neutral-50'>
									{viewMode === 'active'
										? 'Gestión de Integraciones'
										: 'Papelera de Integraciones'}
								</CardTitle>
								<p className='mt-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
									{viewMode === 'active'
										? 'Conecta y administra tus tiendas y marketplaces. Solo una API REST puede estar activa por proveedor.'
										: 'Integraciones eliminadas. Puedes restaurarlas para recuperar todos sus datos y productos vinculados.'}
								</p>
							</div>
						</div>
						<div className='flex items-center gap-2'>
							<div className='flex rounded-lg border border-neutral-200 bg-white p-0.5 dark:border-neutral-700 dark:bg-neutral-800'>
								<button
									type='button'
									className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
										viewMode === 'active'
											? 'bg-emerald-500 text-white shadow-sm'
											: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
									}`}
									onClick={() => setViewMode('active')}>
									Activas
								</button>
								<button
									type='button'
									className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
										viewMode === 'trash'
											? 'bg-emerald-500 text-white shadow-sm'
											: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
									}`}
									onClick={() => setViewMode('trash')}>
									Papelera
									{trashedIntegrations.length > 0 && (
										<Badge
											color='zinc'
											className='ms-1.5 px-1.5 py-0 text-xs'>
											{trashedIntegrations.length}
										</Badge>
									)}
								</button>
							</div>
							{viewMode === 'active' && (
								<ProtectedButton
									permission="create-integration"
									branchId={branchId}
									scope="access"
									variant='solid'
									color='emerald'
									icon='HeroPlus'
									onClick={handleCreate}>
									Nueva Integración
								</ProtectedButton>
							)}
						</div>
					</CardHeader>
					<CardBody>
						{viewMode === 'active' ? (
							loading && integrations.length === 0 ? (
								<div className='flex justify-center py-8'>
									<Icon
										icon='HeroArrowPath'
										className='animate-spin'
										size='text-4xl'
									/>
								</div>
							) : integrations.length === 0 ? (
								<div className='py-8 text-center text-gray-500'>
									<Icon
										icon='HeroGlobeAlt'
										size='text-6xl'
										className='mx-auto mb-4'
									/>
									<p className='text-lg'>No hay integraciones configuradas</p>
									<Button
										variant='outline'
										icon='HeroPlus'
										onClick={handleCreate}
										className='mt-4'>
										Crear Primera Integración
									</Button>
								</div>
							) : (
								<DataTable<Integration>
									columns={columns}
									data={integrations}
									loading={false}
									emptyMessage='No hay integraciones configuradas'
									searchPlaceholder='Buscar integración...'
								/>
							)
						) : loading && trashedIntegrations.length === 0 ? (
							<div className='flex justify-center py-8'>
								<Icon
									icon='HeroArrowPath'
									className='animate-spin'
									size='text-4xl'
								/>
							</div>
						) : trashedIntegrations.length === 0 ? (
							<div className='py-8 text-center text-gray-500'>
								<Icon
									icon='HeroTrash'
									size='text-6xl'
									className='mx-auto mb-4'
								/>
								<p className='text-lg'>La papelera está vacía</p>
								<p className='mt-2 text-sm'>
									Las integraciones eliminadas aparecerán aquí
								</p>
							</div>
						) : (
							<DataTable<Integration>
								columns={trashedColumns}
								data={trashedIntegrations}
								loading={false}
								emptyMessage='No hay integraciones eliminadas'
								searchPlaceholder='Buscar en papelera...'
							/>
						)}
					</CardBody>
				</Card>
			</Container>

			{isModalOpen && (
				<ModalIntegration
					isOpen={isModalOpen}
					onClose={handleCloseModal}
					onSuccess={handleSuccess}
					integration={selectedIntegration}
					mode={modalMode}
				/>
			)}

			{conflictError && (
				<RestoreConflictModal
					isOpen={!!conflictError}
					onClose={() => setConflictError(null)}
					conflictMessage={conflictError.message}
					integrationName={conflictError.integrationName}
				/>
			)}
		</>
	);
};

const IntegrationsListPage: React.FC = () => (
	<PageWrapper name='Integraciones'>
		<IntegrationsListContent />
	</PageWrapper>
);

export default IntegrationsListPage;
