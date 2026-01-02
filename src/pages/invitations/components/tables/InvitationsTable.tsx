import React, { useState } from 'react';
import {
	OnChangeFn,
	PaginationState,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';

import { useInvitationsManagement } from '../../hooks/useInvitationsManagement';
import { InvitationDetailsModal, DeleteConfirmationModal, ResendInvitationModal } from '../modals';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import { Invitation } from '@/interface/invitacion.interface';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import { TColors } from '@/types/colors.type';

interface InvitationsTableProps {
	invitations: Invitation[];
	isLoading: boolean;
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	openCreateModal: () => void;
}
const QUOTE_STATUS_OPTIONS: Record<string, { label: string; color: TColors; icon: string }> = {
	pending: { label: 'Pendiente', color: 'amber', icon: 'HeroClock' },
	sent: { label: 'Enviada', color: 'blue', icon: 'HeroPaperAirplane' },
	accepted: { label: 'Aceptada', color: 'emerald', icon: 'HeroCheckCircle' },
	expired: { label: 'Expirada', color: 'red', icon: 'HeroXCircle' },
	cancelled: { label: 'Cancelada', color: 'zinc', icon: 'HeroXMark' },
};

const columnHelper = createColumnHelper<Invitation>();

const InvitationsTable: React.FC<InvitationsTableProps> = ({
	invitations,
	isLoading,
	pagination,
	onPageChange,
	onPageSizeChange,
	openCreateModal,
}) => {
	const { handleResendInvitation, handleCancelInvitation, isActionLoading } =
		useInvitationsManagement();

	// Estados para los modales
	const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
	const [modals, setModals] = useState({
		details: false,
		delete: false,
		resend: false,
	});

	// Funciones para manejar modales
	const openModal = (type: 'details' | 'delete' | 'resend', invitation: Invitation) => {
		setSelectedInvitation(invitation);
		setModals((prev) => ({ ...prev, [type]: true }));
	};

	const closeModal = (type: 'details' | 'delete' | 'resend') => {
		setModals((prev) => ({ ...prev, [type]: false }));
		setSelectedInvitation(null);
	};

	// Handlers para las acciones
	const handleDeleteConfirm = async () => {
		if (selectedInvitation) {
			await handleCancelInvitation(selectedInvitation.id);
			closeModal('delete');
		}
	};

	const handleResendConfirm = async () => {
		if (selectedInvitation) {
			await handleResendInvitation(selectedInvitation.id);
			closeModal('resend');
		}
	};

	const columns = [
		columnHelper.accessor('email', {
			header: 'Email',
			cell: (info) => {
				const invitation = info.row.original;
				const email = info.getValue();
				const firstName = invitation.first_name || '';
				const lastName = invitation.last_name || '';
				const fullName = `${firstName} ${lastName}`.trim();

				return (
					<div className='flex flex-col space-y-1'>
						<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
							{email}
						</span>
						{fullName && (
							<span className='text-xs font-normal text-zinc-500 dark:text-zinc-400'>
								{fullName}
							</span>
						)}
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'role',
			header: 'Rol',
			cell: (info) => {
				const invitation = info.row.original;
				// Usar solo las propiedades que existen en el interface
				const role = invitation.role || invitation.role_name || '';

				const roleLabels: Record<string, string> = {
					admin: 'Administrador',
					hr: 'Recursos Humanos',
					employee: 'Empleado',
					manager: 'Gerente',
					supervisor: 'Supervisor',
				};

				const roleColors: Record<string, { color: any; variant: any }> = {
					admin: { color: 'purple', variant: 'solid' },
					hr: { color: 'blue', variant: 'solid' },
					employee: { color: 'zinc', variant: 'outline' },
					manager: { color: 'emerald', variant: 'solid' },
					supervisor: { color: 'amber', variant: 'solid' },
				};

				const config = roleColors[role] || { color: 'zinc', variant: 'outline' };
				const label = roleLabels[role] || role || '-';

				if (!role) {
					return <span className='text-zinc-500 dark:text-zinc-400'>-</span>;
				}

				return (
					<Badge color={config.color} variant={config.variant} className='px-2 text-xs'>
						{label}
					</Badge>
				);
			},
		}),
		columnHelper.accessor('status', {
			header: 'Estado',
			cell: (info) => {
				const val = info.getValue();
				const config = QUOTE_STATUS_OPTIONS[val as keyof typeof QUOTE_STATUS_OPTIONS] || {
					label: val,
					color: 'zinc',
					icon: 'HeroQuestionMarkCircle',
				};

				return (
					<Badge
						color={config.color}
						variant='outline' // 'light' es el que mejor queda en tablas ERP para no cansar la vista
						className='flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-tight'>
						<Icon icon={config.icon} className='mr-1.5 h-3.5 w-3.5' />
						{config.label}
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: 'invited_at',
			header: 'Fecha de Invitación',
			cell: (info) => {
				const invitation = info.row.original;
				const value = invitation.invited_at || invitation.created_at;
				if (!value) {
					return <span className='text-zinc-500 dark:text-zinc-400'>-</span>;
				}
				const date = new Date(value);
				return (
					<div className='flex flex-col'>
						<span className='text-sm font-medium'>
							{date.toLocaleDateString('es-ES')}
						</span>
						<span className='text-xs text-zinc-500 dark:text-zinc-400'>
							{date.toLocaleTimeString('es-ES', {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</span>
					</div>
				);
			},
		}),
		columnHelper.accessor('expires_at', {
			header: 'Fecha de Expiración',
			cell: (info) => {
				const expiresAt = info.getValue();
				if (!expiresAt) return <span className='text-zinc-500'>-</span>;

				const date = new Date(expiresAt);
				const now = new Date();
				const isExpired = date < now;

				return (
					<div className='flex flex-col'>
						<span
							className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : ''}`}>
							{date.toLocaleDateString('es-ES')}
						</span>
						<span
							className={`text-xs ${isExpired ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
							{date.toLocaleTimeString('es-ES', {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</span>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'sent_by_user',
			header: 'Enviado por',
			cell: (info) => {
				const invitation = info.row.original;
				// Usar solo sent_by_user que está definido en el interface
				const sentBy = invitation.sent_by_user;
				const invitedBy = invitation.invited_by;

				if (!sentBy && !invitedBy) {
					return <span className='text-zinc-500 dark:text-zinc-400'>-</span>;
				}

				const firstName = sentBy?.first_name || '';
				const lastName = sentBy?.last_name || '';
				const email = sentBy?.email || '';
				const fullName =
					invitedBy || `${firstName} ${lastName}`.trim() || email || 'Usuario';

				return (
					<div className='flex items-center space-x-2'>
						{/* <div className='flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700'>
							<Icon
								icon='HeroUser'
								size='text-2xl'
								className='h-5 w-5 text-zinc-600 dark:text-zinc-300'
							/>
						</div> */}
						<div className='flex flex-col'>
							<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
								{fullName}
							</span>
							{email && (
								<span className='text-xs text-zinc-500 dark:text-zinc-400'>
									{email}
								</span>
							)}
						</div>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Acciones',
			cell: (info) => {
				const invitation = info.row.original;
				const canResend =
					invitation.status === 'pending' || invitation.status === 'expired';
				const canDelete =
					invitation.status === 'pending' || invitation.status === 'cancelled';
				const isLoading = isActionLoading(invitation.id);

				return (
					<div className='flex items-center justify-end space-x-2'>
						{/* Ver Detalles */}
						<Button
							variant='outline'
							size='sm'
							color='blue'
							onClick={() => openModal('details', invitation)}
							className='flex items-center justify-center p-0 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20'
							title='Ver detalles'>
							<Icon icon='HeroEye' color='blue'/>
						</Button>

						{/* Reenviar */}
						{canResend && (
							<Button
								variant='outline'
								size='sm'
								color='emerald'
								onClick={() => openModal('resend', invitation)}
								isDisable={isLoading}
								className='flex items-center justify-center p-0 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
								title='Reenviar invitación'>
								{isLoading ? (
									<Icon icon='HeroArrowPath' className='animate-spin' />
								) : (
									<Icon icon='HeroPaperAirplane' color='emerald'/>
								)}
							</Button>
						)}

						{/* Eliminar/Cancelar */}
						{canDelete && (
							<Button
								variant='outline'
								size='sm'
								color='red'
								onClick={() => openModal('delete', invitation)}
								isDisable={isLoading}
								className='flex items-center justify-center p-0 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20'
								title={
									invitation.status === 'pending'
										? 'Cancelar invitación'
										: 'Eliminar invitación'
								}>
								{isLoading ? (
									<Icon icon='HeroArrowPath' className='animate-spin' color='sky' />
								) : (
									<Icon icon='HeroTrash' color='red'/>
								)}
							</Button>
						)}
					</div>
				);
			},
		}),
	];

	const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
		const current: PaginationState = {
			pageIndex: Math.max(pagination.page - 1, 0),
			pageSize: pagination.pageSize,
		};
		const next = typeof updater === 'function' ? updater(current) : updater;

		if (next.pageSize !== current.pageSize) {
			onPageSizeChange(next.pageSize);
			return;
		}

		if (next.pageIndex !== current.pageIndex) {
			onPageChange(next.pageIndex + 1);
		}
	};

	const table = useReactTable({
		data: invitations,
		columns,
		getCoreRowModel: getCoreRowModel(),
		state: {
			pagination: {
				pageIndex: Math.max(pagination.page - 1, 0),
				pageSize: pagination.pageSize,
			},
		},
		onPaginationChange: handlePaginationChange,
		manualPagination: true,
		pageCount: pagination.totalPages,
	});

	if (isLoading && invitations.length === 0) {
		return (
			<Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
				<CardBody className='p-12 text-center'>
					<div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
						<Icon
							icon='HeroArrowPath'
							className='h-10 w-10 animate-spin text-blue-600 dark:text-blue-400'
						/>
					</div>
					<h3 className='mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
						Cargando invitaciones...
					</h3>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>
						Por favor espera mientras cargamos la información.
					</p>
				</CardBody>
			</Card>
		);
	}

	if (!isLoading && invitations.length === 0) {
		return (
			<Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
				<CardBody className='p-12 text-center'>
					<div className='justify-centermb-4 inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
						<Icon icon='HeroPaperAirplane' className='h-10 w-10 text-zinc-400' />
					</div>
					<h3 className='mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
						No hay invitaciones
					</h3>
					<p className='mb-4 text-sm text-zinc-500 dark:text-zinc-400'>
						No se encontraron invitaciones con los filtros aplicados.
					</p>
					<Button variant='outline' color='red' icon='HeroPlus' onClick={openCreateModal}>
						Crear nueva invitación
					</Button>
				</CardBody>
			</Card>
		);
	}

	return (
		<>
			<Card className='border border-zinc-200 shadow-sm dark:border-zinc-700'>
				<CardBody className='overflow-x-auto p-0'>
					<Table className='w-full'>
						<THead className='bg-zinc-50 dark:bg-zinc-800/50'>
							{table.getHeaderGroups().map((headerGroup) => (
								<Tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<Th
											key={header.id}
											className='border-b border-zinc-200 p-4 text-left font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</Th>
									))}
								</Tr>
							))}
						</THead>
						<TBody>
							{table.getRowModel().rows.map((row, index) => (
								<Tr
									key={row.id}
									className={`transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/30 dark:bg-zinc-800/20'} border-b border-zinc-100 dark:border-zinc-800`}>
									{row.getVisibleCells().map((cell) => (
										<Td key={cell.id} className='p-4'>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</Td>
									))}
								</Tr>
							))}
						</TBody>
					</Table>

					<div className='mt-4'>
						<TableCardFooterTemplateV2 table={table} />
					</div>
				</CardBody>
			</Card>

			{/* Modales */}
			<InvitationDetailsModal
				isOpen={modals.details}
				onClose={() => closeModal('details')}
				invitation={selectedInvitation}
			/>

			<DeleteConfirmationModal
				isOpen={modals.delete}
				onClose={() => closeModal('delete')}
				onConfirm={handleDeleteConfirm}
				invitation={selectedInvitation}
				isDeleting={selectedInvitation ? isActionLoading(selectedInvitation.id) : false}
			/>

			<ResendInvitationModal
				isOpen={modals.resend}
				onClose={() => closeModal('resend')}
				onConfirm={handleResendConfirm}
				invitation={selectedInvitation}
				isResending={selectedInvitation ? isActionLoading(selectedInvitation.id) : false}
			/>
		</>
	);
};

export default InvitationsTable;
