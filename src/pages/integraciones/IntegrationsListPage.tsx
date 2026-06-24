import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import type { ColumnDef } from '@tanstack/react-table';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchIntegrations,
	setSelectedIntegration,
} from '@/store/slices/integrations/integrationsSlice';
import type { Integration } from '@/types/integrations.types';
import ModalIntegration from './components/ModalIntegration';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import DataTable from '@/components/ui/DataTable/DataTable';

export const IntegrationsListContent: React.FC = () => {
	const dispatch = useAppDispatch();

	// Obtener subsidiary_id del usuario autenticado
	const currentUser = useAppSelector((state) => state.auth.user);
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	// Debug: Ver qué hay en el usuario
	useEffect(() => {}, [currentUser, subsidiaryId]);

	// State desde Redux
	const { integrations, loading, error } = useAppSelector((state) => state.integrations);

	// State local
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
	const [selectedIntegration, setSelectedIntegrationLocal] = useState<Integration | null>(null);

	useEffect(() => {
		if (subsidiaryId) {
			dispatch(fetchIntegrations({ subsidiaryId }));
		} else {
			console.error('No subsidiaryId found in user:', currentUser);
			toast.error('No se pudo identificar la subsidiaria actual. Verifica tu sesión.');
		}
	}, [dispatch, subsidiaryId, currentUser]);

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

	const getModeLabel = (mode: string) => {
		const modes: Record<string, string> = {
			webhook: 'Webhook',
			read: 'Solo Lectura',
			read_write: 'Lectura/Escritura',
		};
		return modes[mode] || mode;
	};

	const getProviderLabel = (provider: string) => {
		const providers: Record<string, string> = {
			woocommerce: 'WooCommerce',
		};
		return providers[provider] || provider;
	};

	const formatDate = (value?: string | null) => {
		if (!value) return null;
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		return date.toLocaleString('es-CL');
	};

	const columns = useMemo<ColumnDef<Integration, any>[]>(
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
				cell: ({ row }) => (
					<Badge
						variant='outline'
						color={
							row.original.mode === 'webhook'
								? 'blue'
								: row.original.mode === 'read_write'
									? 'green'
									: 'zinc'
						}>
						{getModeLabel(row.original.mode)}
					</Badge>
				),
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
				cell: ({ row }) => (
					<div className='flex gap-2'>
						<Button
							size='xs'
							variant='outline'
							icon='HeroEye'
							onClick={() => handleView(row.original)}>
							Ver
						</Button>
						<Button
							size='xs'
							variant='outline'
							icon='HeroPencil'
							onClick={() => handleEdit(row.original)}>
							Editar
						</Button>
					</div>
				),
			},
		],
		[getProviderLabel, getModeLabel, handleView, handleEdit],
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
				<Card>
					<CardHeader>
						<CardTitle>Gestión de Integraciones</CardTitle>
						<Button variant='solid' icon='HeroPlus' onClick={handleCreate}>
							Nueva Integración
						</Button>
					</CardHeader>
					<CardBody>
						{loading ? (
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
								loading={loading}
								emptyMessage='No hay integraciones configuradas'
								searchPlaceholder='Buscar integración...'
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
		</>
	);
};

const IntegrationsListPage: React.FC = () => (
	<PageWrapper name='Integraciones'>
		<IntegrationsListContent />
	</PageWrapper>
);

export default IntegrationsListPage;
