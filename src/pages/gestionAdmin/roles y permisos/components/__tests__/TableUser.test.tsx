import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import TableUser from '../TableUser';

const mocks = vi.hoisted(() => ({
	dispatch: vi.fn(),
	navigate: vi.fn(),
	getRoleLabel: vi.fn((role: string) => role),
}));

vi.mock('@/store', () => ({
	useAppDispatch: () => mocks.dispatch,
	useAppSelector: <T,>(selector: (state: { auth: { user: unknown } }) => T) =>
		selector({ auth: { user: { roles: ['super-admin'], authority: [] } } }),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/hooks/usePermissionLabels', () => ({
	usePermissionLabels: () => ({ getRoleLabel: mocks.getRoleLabel }),
}));
vi.mock('@/components/authorization/PermissionGuard', () => ({
	default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/ui/Tooltip', () => ({
	default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/Badge', () => ({
	default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/icon/Icon', () => ({ default: () => <span aria-hidden='true' /> }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/components/ui/DataTable', () => ({
	default: ({
		columns,
		data,
	}: {
		columns: Array<{ id?: string; cell?: unknown }>;
		data: unknown[];
	}) => {
		const actionsColumn = columns.find((column) => column.id === 'acciones');
		if (!actionsColumn || typeof actionsColumn.cell !== 'function') return null;

		const renderCell = actionsColumn.cell as (context: unknown) => React.ReactNode;
		return <>{renderCell({ row: { original: data[0] } })}</>;
	},
}));

const user: UserWithDetails = {
	id: 16,
	pk: 16,
	first_name: 'Usuario',
	second_name: null,
	last_name: 'Dieciséis',
	second_last_name: null,
	email: 'usuario16@example.com',
	rut: null,
	celular: null,
	cargo: null,
	fecha_nacimiento: null,
	is_staff: false,
	is_active: true,
	can_edit: true,
	is_super_admin: true,
	image_url: null,
	companies: [],
	global_roles: [],
	invited_role: null,
	contextual_roles: [],
	direct_permissions: [],
	role_permissions: [],
	all_permissions: [],
	created_at: '2026-08-27T00:00:00.000Z',
	updated_at: '2026-08-27T00:00:00.000Z',
};

const tableData = [
	{
		...user,
		displayName: 'Usuario Dieciséis',
		cargoResolved: '—',
		companyResolved: '—',
		uniqueRoles: [],
		directPermissionsCount: 0,
		totalPermissionsCount: 0,
	},
];

const renderTable = (onRefresh: () => void) =>
	render(
		<TableUser
			tableData={tableData}
			status='idle'
			globalFilter=''
			setGlobalFilter={vi.fn()}
			pagination={{ pageIndex: 2, pageSize: 10 }}
			onPaginationChange={vi.fn()}
			pageCount={3}
			totalResults={30}
			onRefresh={onRefresh}
		/>,
	);

describe('TableUser', () => {
	beforeEach(() => {
		mocks.dispatch.mockReset();
		mocks.dispatch.mockResolvedValue({
			type: 'usersAdmin/toggleUserStatus/fulfilled',
			payload: { userId: user.id, is_active: false },
		});
	});

	it('refresca con el callback vigente al cambiar el estado de un usuario', async () => {
		const firstRefresh = vi.fn();
		const secondRefresh = vi.fn();
		const view = renderTable(firstRefresh);

		view.rerender(
			<TableUser
				tableData={tableData}
				status='idle'
				globalFilter=''
				setGlobalFilter={vi.fn()}
				pagination={{ pageIndex: 2, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				pageCount={3}
				totalResults={30}
				onRefresh={secondRefresh}
			/>,
		);

		fireEvent.click(screen.getAllByRole('button')[1]);

		expect(firstRefresh).not.toHaveBeenCalled();
		await waitFor(() => expect(secondRefresh).toHaveBeenCalledOnce());
	});
});
