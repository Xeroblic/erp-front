import { createColumnHelper } from '@tanstack/react-table';
import { type UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { formatRoleName } from '../../utils/formatters';

const columnHelper = createColumnHelper<UserWithDetails>();

export const createUserTableColumns = (
	onOpenPermissionsModal: (user: UserWithDetails) => void,
	onToggleUserStatus: (user: UserWithDetails) => void,
	toggleUserLoading: Set<number>,
) => [
	columnHelper.accessor('first_name', {
		header: 'Usuario',
		cell: (info) => {
			const user = info.row.original;
			return (
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-900 font-semibold text-white'>
						{info.getValue().charAt(0)}
						{user.last_name?.charAt(0)}
					</div>
					<div>
						<div className='font-medium'>
							{info.getValue()} {user.last_name}
						</div>
						<div className='text-sm text-zinc-500'>{user.email}</div>
					</div>
				</div>
			);
		},
	}),
	columnHelper.display({
		id: 'cargo_empresa',
		header: 'Cargo y Empresa',
		cell: (info) => {
			const user = info.row.original;
			const cargo = user.cargo || user.companies?.[0]?.position || user.position || '—';

			let empresa = '—';
			if (user.branch?.subsidiary?.company?.company_name) {
				empresa = user.branch.subsidiary.company.company_name;
			} else if (user.companies?.[0]?.name) {
				empresa = user.companies[0].name;
			}

			return (
				<div>
					<div className='font-medium'>{cargo}</div>
					<div className='text-sm text-zinc-500'>{empresa}</div>
				</div>
			);
		},
	}),
	columnHelper.display({
		id: 'roles',
		header: 'Roles Asignados',
		cell: (info) => {
			const user = info.row.original;
			const allRoles = [
				...(user.global_roles || []),
				...(user.contextual_roles?.map((cr) => cr.role) || []),
			];

			// Eliminar duplicados
			const uniqueRoles = Array.from(new Set(allRoles));

			if (uniqueRoles.length === 0) {
				return <span className='text-zinc-400'>Sin roles asignados</span>;
			}

			return (
				<div className='flex flex-wrap gap-1'>
					{uniqueRoles.slice(0, 3).map((role, index) => (
						<Badge key={index} color='blue' className='text-xs'>
							{formatRoleName(role)}
						</Badge>
					))}
					{uniqueRoles.length > 3 && (
						<Badge color='zinc' className='text-xs'>
							+{uniqueRoles.length - 3} más
						</Badge>
					)}
				</div>
			);
		},
	}),
	columnHelper.display({
		id: 'permisos_count',
		header: 'Permisos',
		cell: (info) => {
			const user = info.row.original;
			const directCount = user.direct_permissions?.length || 0;
			const totalCount = user.all_permissions?.length || 0;

			return (
				<div className='text-center'>
					<div className='text-lg font-semibold'>{totalCount}</div>
					<div className='text-xs text-zinc-500'>
						{directCount} directo{directCount !== 1 ? 's' : ''}
					</div>
				</div>
			);
		},
	}),
	columnHelper.accessor('is_active', {
		header: 'Estado',
		cell: (info) => (
			<Badge
				color={info.getValue() ? 'emerald' : 'red'}
				className='inline-flex items-center gap-1'>
				<div
					className={`h-2 w-2 rounded-full ${info.getValue() ? 'bg-emerald-300' : 'bg-red-300'}`}
				/>
				{info.getValue() ? 'Activo' : 'Inactivo'}
			</Badge>
		),
	}),
	columnHelper.display({
		id: 'actions',
		header: 'Acciones',
		cell: (info) => (
			<div className='flex gap-2'>
				<Button
					size='sm'
					variant='outline'
					onClick={() => onOpenPermissionsModal(info.row.original)}
					className='flex items-center gap-1'>
					<Icon icon='HeroShieldCheck' className='h-4 w-4' />
					Gestionar
				</Button>
				<Button
					size='sm'
					color={info.row.original.is_active ? 'red' : 'emerald'}
					variant='outline'
					onClick={() => onToggleUserStatus(info.row.original)}
					className='flex items-center gap-1'
					isDisable={toggleUserLoading.has(info.row.original.id)}>
					<Icon
						icon={
							toggleUserLoading.has(info.row.original.id)
								? 'HeroArrowPath'
								: info.row.original.is_active
									? 'HeroXMark'
									: 'HeroCheck'
						}
						className={`h-4 w-4 ${toggleUserLoading.has(info.row.original.id) ? 'animate-spin' : ''}`}
					/>
					{toggleUserLoading.has(info.row.original.id)
						? 'Procesando...'
						: info.row.original.is_active
							? 'Desactivar'
							: 'Activar'}
				</Button>
			</div>
		),
	}),
];
