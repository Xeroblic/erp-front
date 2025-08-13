import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchUsers,
  fetchUserDetails,
  toggleUserStatus,
  setFilters,
  type UserWithDetails,
} from '@/store/slices/usersAdmin/usersAdminSlice';

import {
  fetchPermissions,
  fetchRoles,
  assignPermissionToUser,
  revokePermissionFromUser,
  assignRoleToUser,
  revokeRoleFromUser,
} from '@/store/slices/permissions/permissionsSlice';

import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { THead, Tr, Th, TBody, Td } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Icon from '@/components/icon/Icon';
import { toast } from 'react-toastify';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';

const columnHelper = createColumnHelper<UserWithDetails>();

export default function PermissionsAdmin() {
  const dispatch = useAppDispatch();

  // store
  const { users, loading: usersLoading, filters } = useAppSelector((s) => s.usersAdmin);
  const { permissions, roles, loading: permissionsLoading } = useAppSelector((s) => s.permissions);

  // ui state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserWithDetails | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // initial loads
  useEffect(() => {
    dispatch(fetchUsers({}));
    dispatch(fetchPermissions());
    dispatch(fetchRoles());
  }, [dispatch]);

  // maps para preselección/diff
  const permissionNameToId = useMemo(
    () => new Map((permissions || []).map((p) => [p.name, p.id])),
    [permissions]
  );
  const roleNameToId = useMemo(() => new Map((roles || []).map((r) => [r.name, r.id])), [roles]);

  // pre-selección de roles/permisos (usa lo que devuelve el backend en user.details)
  const { preselectedRoleIds, preselectedPermissionIds } = useMemo(() => {
    if (!selectedUserForPermissions || !roles.length || !permissions.length) {
      return { preselectedRoleIds: [], preselectedPermissionIds: [] };
    }

    // ROLES
    const idsFromLegacy = (selectedUserForPermissions.roles || []).map((r) => r.id);
    const roleNames = [
      ...(selectedUserForPermissions.global_roles || []),
      ...(selectedUserForPermissions.contextual_roles?.map((cr) => cr.role) || []),
    ];
    const idsFromNames = roleNames
      .map((name) => roleNameToId.get(name))
      .filter((x): x is number => typeof x === 'number');
    const roleIds = Array.from(new Set([...idsFromLegacy, ...idsFromNames]));

    // PERMISOS (solo directos para que el usuario gestione explícitamente)
    const directNames = selectedUserForPermissions.direct_permissions || [];
    const permIds = directNames
      .map((name) => permissionNameToId.get(name))
      .filter((x): x is number => typeof x === 'number');

    return { preselectedRoleIds: roleIds, preselectedPermissionIds: permIds };
  }, [selectedUserForPermissions, roles, permissions, roleNameToId, permissionNameToId]);

  // sincroniza selección cuando cambie el usuario/modal o catálogos
  useEffect(() => {
    setSelectedRoleIds(preselectedRoleIds);
    setSelectedPermissionIds(preselectedPermissionIds);
  }, [preselectedRoleIds, preselectedPermissionIds]);

  // tabla
  const columns = [
    columnHelper.accessor('first_name', {
      header: 'Nombre',
      cell: (info) => `${info.getValue()} ${info.row.original.last_name}`,
    }),
    columnHelper.accessor('email', { header: 'Email', cell: (info) => info.getValue() }),
    columnHelper.display({
      id: 'cargo',
      header: 'Cargo',
      cell: (info) => {
        const user = info.row.original;
        return user.cargo || user.companies?.[0]?.pivot?.cargo || user.position || '—';
      },
    }),
    columnHelper.display({
      id: 'empresa',
      header: 'Empresa',
      cell: (info) => {
        const user = info.row.original;
        const parts: string[] = [];

        if (user.branch?.subsidiary?.company?.company_name) {
          parts.push(user.branch.subsidiary.company.company_name);
          if (user.branch.subsidiary.name) parts.push(`• ${user.branch.subsidiary.name}`);
          if (user.branch.name) parts.push(`• ${user.branch.name}`);
        } else if (user.companies?.[0]?.name) {
          parts.push(user.companies[0].name);
        } else if (user.company?.name) {
          parts.push(user.company.name);
          if (user.subsidiary?.name) parts.push(`• ${user.subsidiary.name}`);
          if (user.branch?.name) parts.push(`• ${user.branch.name}`);
        }

        return parts.length ? (
          <div className="text-sm">
            {parts.map((p, i) => (
              <div key={i} className={i === 0 ? 'font-medium' : 'text-gray-600 ml-2'}>
                {p}
              </div>
            ))}
          </div>
        ) : (
          '—'
        );
      },
    }),
    columnHelper.accessor('is_active', {
      header: 'Estado',
      cell: (info) => <Badge color={info.getValue() ? 'emerald' : 'red'}>{info.getValue() ? 'Activo' : 'Inactivo'}</Badge>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: (info) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenPermissionsModal(info.row.original)}>
            <Icon icon="HeroShieldCheck" className="w-4 h-4" />
            Permisos
          </Button>
          <Button
            size="sm"
            color={info.row.original.is_active ? 'red' : 'emerald'}
            onClick={() => handleToggleUserStatus(info.row.original)}
          >
            {info.row.original.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: { globalFilter: filters.search, sorting },
    onGlobalFilterChange: (value) => dispatch(setFilters({ search: value })),
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // abrir modal: traigo DETALLES (ya incluye direct_permissions / roles)
  const handleOpenPermissionsModal = useCallback(
    async (user: UserWithDetails) => {
      setSelectedUserForPermissions(user);
      setIsPermissionsModalOpen(true);

      try {
        const res = await dispatch(fetchUserDetails(user.id));
        if (fetchUserDetails.fulfilled.match(res) && res.payload) {
          setSelectedUserForPermissions(res.payload as UserWithDetails);
        }
      } catch {
        /* nop */
      }
    },
    [dispatch]
  );

  const handleToggleUserStatus = useCallback(
    async (user: UserWithDetails) => {
      try {
        await dispatch(
          toggleUserStatus({
            userId: user.id,
            status: !user.is_active,
          })
        ).unwrap();
        toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'} correctamente`);
      } catch (error: any) {
        toast.error(error);
      }
    },
    [dispatch]
  );

  // SELECT options
  const roleOptions = useMemo<TSelectOption[]>(
    () =>
      (roles || []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [roles]
  );

  const permissionOptions = useMemo<TSelectOption[]>(
    () =>
      (permissions || []).map((p) => ({
        value: String(p.id), // usamos ID en el select
        label: p.name || p.name, // y mostramos bonito
      })),
    [permissions]
  );

  // handlers de selects
  const handleRoleChange = useCallback((selected: any) => {
    const ids = Array.isArray(selected) ? selected.map((o: TSelectOption) => parseInt(String(o.value), 10)) : [];
    setSelectedRoleIds(ids);
  }, []);

  const handlePermissionChange = useCallback((selected: any) => {
    const ids = Array.isArray(selected) ? selected.map((o: TSelectOption) => parseInt(String(o.value), 10)) : [];
    setSelectedPermissionIds(ids);
  }, []);

  // valores seleccionados
  const selectedRoleOptions = useMemo(
    () => roleOptions.filter((o) => selectedRoleIds.includes(parseInt(String(o.value), 10))),
    [roleOptions, selectedRoleIds]
  );

  const selectedPermissionOptions = useMemo(
    () => permissionOptions.filter((o) => selectedPermissionIds.includes(parseInt(String(o.value), 10))),
    [permissionOptions, selectedPermissionIds]
  );

  // guardar (diff contra lo que YA traía el user)
  const handleSavePermissions = useCallback(async () => {
    if (!selectedUserForPermissions) return;

    try {
      // permisos actuales directos (nombre → id)
      const currentDirectPermIds =
        (selectedUserForPermissions.direct_permissions || [])
          .map((name) => permissionNameToId.get(name))
          .filter((x): x is number => typeof x === 'number');

      // roles actuales por nombres (global/contextual) + legacy ids
      const currentRoleIdsFromNames =
        [
          ...(selectedUserForPermissions.global_roles || []),
          ...(selectedUserForPermissions.contextual_roles?.map((cr) => cr.role) || []),
        ]
          .map((name) => roleNameToId.get(name))
          .filter((x): x is number => typeof x === 'number');

      const currentRoleIdsLegacy = (selectedUserForPermissions.roles || []).map((r) => r.id);
      const currentRoleIds = Array.from(new Set([...currentRoleIdsFromNames, ...currentRoleIdsLegacy]));

      // diffs
      const toAddPerms = selectedPermissionIds.filter((id) => !currentDirectPermIds.includes(id));
      const toRemovePerms = currentDirectPermIds.filter((id) => !selectedPermissionIds.includes(id));
      const toAddRoles = selectedRoleIds.filter((id) => !currentRoleIds.includes(id));
      const toRemoveRoles = currentRoleIds.filter((id) => !selectedRoleIds.includes(id));

      const permissionPromises = [
        ...toAddPerms.map((id) =>
          dispatch(
            assignPermissionToUser({
              userId: selectedUserForPermissions.id,
              permissionId: id, // tu thunk ya sabe a qué endpoint pegarle
            })
          )
        ),
        ...toRemovePerms.map((id) =>
          dispatch(
            revokePermissionFromUser({
              userId: selectedUserForPermissions.id,
              permissionId: id,
            })
          )
        ),
      ];

      const rolePromises = [
        ...toAddRoles.map((id) =>
          dispatch(
            assignRoleToUser({
              userId: selectedUserForPermissions.id,
              roleId: id,
              companyId: selectedUserForPermissions.company?.id,
            })
          )
        ),
        ...toRemoveRoles.map((id) =>
          dispatch(
            revokeRoleFromUser({
              userId: selectedUserForPermissions.id,
              roleId: id,
            })
          )
        ),
      ];

      await Promise.all([...permissionPromises, ...rolePromises]);

      toast.success('Permisos actualizados correctamente');
      setIsPermissionsModalOpen(false);
      dispatch(fetchUsers({}));
    } catch (error: any) {
      toast.error(error);
    }
  }, [
    selectedUserForPermissions,
    selectedPermissionIds,
    selectedRoleIds,
    permissionNameToId,
    roleNameToId,
    dispatch,
  ]);

  // UI
  return (
    <PageWrapper isProtectedRoute title="Administración de Permisos" name="Permisos">
      <Subheader>
        <SubheaderLeft>
          <Badge className="text-xl">Gestión de Permisos de Usuarios</Badge>
        </SubheaderLeft>
        <SubheaderRight>
          <Input
            name="search"
            placeholder="Buscar usuarios..."
            value={filters.search}
            onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
            className="border rounded w-64"
          />
        </SubheaderRight>
      </Subheader>

      <Container className="pt-4">
        <Card>
          <CardBody className="overflow-auto">
            {usersLoading.users ? (
              <div className="p-8 text-center">Cargando usuarios…</div>
            ) : !users || users.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <p>No hay usuarios registrados</p>
                <p className="text-xs mt-2 text-gray-400">
                  Debug: users.length={users?.length}, loading={String(usersLoading.users)}
                </p>
              </div>
            ) : (
              <>
                <Table className="table-fixed w-full">
                  <THead>
                    {table.getHeaderGroups().map((hg) => (
                      <Tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <Th key={header.id} className="text-left">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.map((row) => (
                      <Tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
                        ))}
                      </Tr>
                    ))}
                  </TBody>
                </Table>
                <div className="mt-4">
                  <TableCardFooterTemplateV2 table={table} />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Modal (solo selects) */}
      <Modal isOpen={isPermissionsModalOpen} setIsOpen={setIsPermissionsModalOpen} size="xl">
        <ModalHeader>
          <div className="flex items-center gap-2">
            <Icon icon="HeroShieldCheck" className="w-5 h-5" />
            Gestionar Permisos — {selectedUserForPermissions?.first_name} {selectedUserForPermissions?.last_name}
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="grid grid-cols-1 gap-6">
            {/* Select de Roles */}
            <Card>
              <CardBody>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles del usuario</label>
                <SelectReact
                  key={`roles-${selectedUserForPermissions?.id || 'none'}`}
                  name="user-roles"
                  options={roleOptions}
                  value={selectedRoleOptions}
                  onChange={handleRoleChange}
                  placeholder="Seleccionar roles..."
                  isMulti
                  isSearchable
                />
              </CardBody>
            </Card>

            {/* Select de Permisos directos */}
            <Card>
              <CardBody>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permisos directos</label>
                <SelectReact
                  key={`permissions-${selectedUserForPermissions?.id || 'none'}`}
                  name="user-permissions"
                  options={permissionOptions}
                  value={selectedPermissionOptions}
                  onChange={handlePermissionChange}
                  placeholder="Seleccionar permisos..."
                  isMulti
                  isSearchable
                />
                <p className="mt-2 text-xs text-gray-500">
                  Los permisos que vienen por rol no se tildan acá; se calculan automáticamente por los roles
                  seleccionados.
                </p>
              </CardBody>
            </Card>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsPermissionsModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="blue"
            onClick={handleSavePermissions}
            isLoading={permissionsLoading.userPermissions || permissionsLoading.userRoles}
          >
            Guardar Cambios
          </Button>
        </ModalFooter>
      </Modal>
    </PageWrapper>
  );
}
