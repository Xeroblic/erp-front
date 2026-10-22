import React, { useMemo } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Icon from '@/components/icon/Icon';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import { ILockerInternal, IServiceOrder } from '@/interface/lockers.interface';
import {
	getAvailableActions,
	getStatusConfig,
	LOCKER_PERMISSIONS,
	TLockerAction,
} from '../../types';

interface IListLockersProps {
	lockers: ILockerInternal[];
	serviceOrders: IServiceOrder[];
	isLoading: boolean;
	error: string | null;
	openAction: (locker: ILockerInternal, type: TLockerAction) => void;
	subsidiaryId: number | null;
	setDetailLocker: (locker: ILockerInternal) => void;
}

const columnHelper = createColumnHelper<ILockerInternal>();

const ListLockers: React.FC<IListLockersProps> = ({
	lockers,
	serviceOrders,
	isLoading,
	error,
	openAction,
	subsidiaryId,
	setDetailLocker,
}) => {
	// Mapa de órdenes para cruzar datos rápido
	const orderByLockerId = useMemo(() => {
		const map: Record<number, IServiceOrder> = {};
		serviceOrders.forEach((order) => {
			if (order.locker_id) map[order.locker_id] = order;
		});
		return map;
	}, [serviceOrders]);

	const StatusBadge = ({ status }: { status: string }) => {
		const config = getStatusConfig(status);
		return (
			<Badge color={config.color} variant='solid' className='text-xs'>
				<span className='flex items-center gap-1'>
					<Icon icon={config.icon} className='h-3 w-3' />
					{config.label}
				</span>
			</Badge>
		);
	};

	const columns = useMemo(
		() => [
			columnHelper.accessor('number', {
				id: 'numero',
				header: 'Nº',
				cell: (info) => (
					<span className='font-mono font-semibold text-zinc-800 dark:text-zinc-200'>
						{info.getValue()}
					</span>
				),
			}),
			columnHelper.accessor('status', {
				header: 'Estado',
				cell: (info) => <StatusBadge status={info.getValue()} />,
			}),
			columnHelper.display({
				id: 'cliente',
				header: 'Cliente',
				cell: (info) => {
					const locker = info.row.original;
					const order = locker.active_service_order || orderByLockerId[locker.id];
					const clientName = order?.customer_name ?? '—';
					const clientEmail = order?.customer_email;
					return (
						<div>
							<p className='font-medium text-zinc-800 dark:text-zinc-200'>
								{clientName}
							</p>
							{clientEmail && <p className='text-xs text-zinc-400'>{clientEmail}</p>}
						</div>
					);
				},
			}),
			columnHelper.display({
				id: 'equipo',
				header: 'Equipo',
				cell: (info) => {
					const locker = info.row.original;
					const order = locker.active_service_order || orderByLockerId[locker.id];
					const deviceInfo =
						order?.device_brand && order?.device_model
							? `${order.device_brand} ${order.device_model}`
							: order?.device_description || '—';
					return (
						<div
							className='max-w-[180px] truncate text-zinc-600 dark:text-zinc-400'
							title={deviceInfo}>
							{deviceInfo}
						</div>
					);
				},
			}),
			columnHelper.display({
				id: 'servicio',
				header: 'Servicio',
				cell: (info) => {
					const locker = info.row.original;
					const order = locker.active_service_order || orderByLockerId[locker.id];
					const serviceType = order?.service_type || '—';
					return <span className='text-zinc-600 dark:text-zinc-400'>{serviceType}</span>;
				},
			}),
			columnHelper.display({
				id: 'ingreso',
				header: 'Ingreso',
				cell: (info) => {
					const locker = info.row.original;
					const order = locker.active_service_order || orderByLockerId[locker.id];
					const checkInDate = order?.checked_in_at;
					return (
						<span className='text-xs text-zinc-500'>
							{checkInDate ? new Date(checkInDate).toLocaleString('es-CL') : '—'}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: 'acciones',
				header: 'Acciones',
				cell: (info) => {
					const locker = info.row.original;
					const actions = getAvailableActions(locker.status);

					return (
						<div className='flex flex-wrap items-center justify-end gap-1'>
							{actions.includes('withdraw') && (
								<ProtectedButton
									permission={LOCKER_PERMISSIONS.operate}
									subsidiaryId={subsidiaryId}
									scope='access'
									size='xs'
									color='blue'
									variant='outline'
									icon='HeroArrowDownTray'
									onClick={() => openAction(locker, 'withdraw')}>
									Retirar
								</ProtectedButton>
							)}
							{actions.includes('dropoff') && (
								<ProtectedButton
									permission={LOCKER_PERMISSIONS.operate}
									subsidiaryId={subsidiaryId}
									scope='access'
									size='xs'
									color='emerald'
									variant='outline'
									icon='HeroArrowUpTray'
									onClick={() => openAction(locker, 'dropoff')}>
									Depositar
								</ProtectedButton>
							)}
							{actions.includes('reset') && (
								<ProtectedButton
									permission={LOCKER_PERMISSIONS.operate}
									subsidiaryId={subsidiaryId}
									scope='access'
									size='xs'
									color='red'
									variant='outline'
									icon='HeroArrowPath'
									onClick={() => openAction(locker, 'reset')}>
									Reset
								</ProtectedButton>
							)}
							{actions.includes('detail') && (
								<Button
									size='xs'
									color='zinc'
									variant='outline'
									icon='HeroEye'
									onClick={() => setDetailLocker(locker)}>
									Detalle
								</Button>
							)}
						</div>
					);
				},
			}),
		],
		[orderByLockerId, openAction, subsidiaryId, setDetailLocker],
	);

	const table = useReactTable({
		data: lockers,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (isLoading && lockers.length === 0) {
		return <p className='p-8 text-center'>Cargando casilleros...</p>;
	}
	if (error) {
		return <p className='p-8 text-center text-red-500'>{error}</p>;
	}

	return (
		<div className='overflow-x-auto'>
			<Table className='w-full text-left text-sm'>
				<THead className='border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'>
					{table.getHeaderGroups().map((headerGroup) => (
						<Tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<Th
									key={header.id}
									className={`px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300 ${header.id === 'acciones' ? 'text-right' : ''}`}>
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
				<TBody className='divide-y divide-zinc-100 dark:divide-zinc-700'>
					{lockers.length === 0 ? (
						<Tr>
							<Td
								colSpan={columns.length}
								className='px-4 py-12 text-center text-zinc-400'>
								No hay casilleros en esta ubicación.
							</Td>
						</Tr>
					) : (
						table.getRowModel().rows.map((row) => (
							<Tr
								key={row.id}
								className='transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
								{row.getVisibleCells().map((cell) => (
									<Td
										key={cell.id}
										className={`px-4 py-3 ${cell.column.id === 'acciones' ? 'text-right' : ''}`}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</Td>
								))}
							</Tr>
						))
					)}
				</TBody>
			</Table>
		</div>
	);
};

export default ListLockers;
