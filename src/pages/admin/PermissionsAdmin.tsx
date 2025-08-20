import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFilters, type UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import { TSelectOption } from '@/components/form/SelectReact';

import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Table, { THead, Tr, Th, TBody, Td } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import {
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';

// Componentes modulares
import { PermissionsModal } from './components/modals/PermissionsModal';
import { createUserTableColumns } from './components/tables/UserTableColumns';
import { usePermissionsManagement } from './hooks/usePermissionsManagement';
import { formatRoleName, formatPermissionName } from './utils/formatters';

export default function PermissionsAdmin() {
  const dispatch = useAppDispatch();

  // Hook personalizado para gestión de permisos
  const {
    users,
    permissions,
    roles,
    usersLoading,
    permissionsLoading,
    filters,
    selectedUserForPermissions,
    selectedPermissionIds,
    selectedRoleIds,
    toggleUserLoading,
    permissionNameToId,
    roleNameToId,
    loadInitialData,
    openPermissionsModal,
    closePermissionsModal,
    toggleUser,
    savePermissions,
    setSelectedUserForPermissions,
    setSelectedPermissionIds,
    setSelectedRoleIds,
  } = usePermissionsManagement();

  // UI state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Pre-selection logic for roles and permissions
  const { preselectedRoleIds, preselectedPermissionIds } = useMemo(() => {
    if (!selectedUserForPermissions || !roles.length || !permissions.length) {
      return { preselectedRoleIds: [], preselectedPermissionIds: [] };
    }

    console.log('🔍 Calculando preselección para:', selectedUserForPermissions.first_name);

    // ROLES: obtener IDs de roles asignados
    const roleNames = [
      ...(selectedUserForPermissions.global_roles || []),
      ...(selectedUserForPermissions.contextual_roles?.map((cr) => cr.role) || []),
    ];

    // Eliminar duplicados de roles
    const uniqueRoleNames = Array.from(new Set(roleNames));
    const roleIds = uniqueRoleNames
      .map((name) => roleNameToId.get(name))
      .filter((id): id is number => typeof id === 'number');

    // PERMISOS: solo mostrar permisos directos en el selector
    const directPermissionNames = selectedUserForPermissions.direct_permissions || [];
    const permissionIds = directPermissionNames
      .map((name) => permissionNameToId.get(name))
      .filter((id): id is number => typeof id === 'number');

    return {
      preselectedRoleIds: roleIds,
      preselectedPermissionIds: permissionIds
    };
  }, [selectedUserForPermissions, roles, permissions, roleNameToId, permissionNameToId]);

  // Sync selections when user or preselected values change
  useEffect(() => {
    setSelectedRoleIds(preselectedRoleIds);
    setSelectedPermissionIds(preselectedPermissionIds);
  }, [preselectedRoleIds, preselectedPermissionIds, setSelectedRoleIds, setSelectedPermissionIds]);

  // Handle opening permissions modal
  const handleOpenPermissionsModal = useCallback(
    async (user: UserWithDetails) => {
      await openPermissionsModal(user);
      setIsPermissionsModalOpen(true);
    },
    [openPermissionsModal]
  );

  // Handle closing permissions modal
  const handleClosePermissionsModal = useCallback(() => {
    setIsPermissionsModalOpen(false);
    closePermissionsModal(); // Esto limpia el estado y refresca los datos
  }, [closePermissionsModal]);

  // Handle save permissions
  const handleSavePermissions = useCallback(async () => {
    await savePermissions();
    setIsPermissionsModalOpen(false);
    closePermissionsModal(); // Asegurar limpieza del estado
  }, [savePermissions, closePermissionsModal]);

  // Table columns
  const columns = createUserTableColumns(handleOpenPermissionsModal, toggleUser, toggleUserLoading);

  // Table configuration
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

  // SELECT options with better formatting
  const roleOptions = useMemo<TSelectOption[]>(
    () =>
      (roles || []).map((r) => ({
        value: String(r.id),
        label: formatRoleName(r.name),
      })),
    [roles]
  );

  const permissionOptions = useMemo<TSelectOption[]>(
    () =>
      (permissions || []).map((p) => ({
        value: String(p.id),
        label: formatPermissionName(p.name || p.code),
      })),
    [permissions]
  );

  // Select change handlers
  const handleRoleChange = useCallback((selected: any) => {
    const ids = Array.isArray(selected) ? selected.map((o: TSelectOption) => parseInt(String(o.value), 10)) : [];
    console.log('🔄 Roles seleccionados:', ids);
    setSelectedRoleIds(ids);
  }, [setSelectedRoleIds]);

  const handlePermissionChange = useCallback((selected: any) => {
    const ids = Array.isArray(selected) ? selected.map((o: TSelectOption) => parseInt(String(o.value), 10)) : [];
    console.log('🔄 Permisos seleccionados:', ids);
    setSelectedPermissionIds(ids);
  }, [setSelectedPermissionIds]);

  // Selected values for the selects
  const selectedRoleOptions = useMemo(
    () => roleOptions.filter((o) => selectedRoleIds.includes(parseInt(String(o.value), 10))),
    [roleOptions, selectedRoleIds]
  );

  const selectedPermissionOptions = useMemo(
    () => permissionOptions.filter((o) => selectedPermissionIds.includes(parseInt(String(o.value), 10))),
    [permissionOptions, selectedPermissionIds]
  );

  // Main UI component
  return (
    <PageWrapper isProtectedRoute title="Administración de Permisos" name="Permisos">
      <Subheader>
        <SubheaderLeft>
          <div className="flex items-center gap-3">
            <Icon icon="HeroShieldCheck" className="w-8 h-8" />
            <div>
              <Badge className="text-lg font-semibold">
                Gestión de Permisos de Usuarios
              </Badge>
              <p className="text-sm text-zinc-600 mt-1">
                Administra roles y permisos de {users?.length || 0} usuarios
              </p>
            </div>
          </div>
        </SubheaderLeft>
        <SubheaderRight>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-zinc-600">
              <Icon icon="HeroMagnifyingGlass" className="w-4 h-4" />
              <span>Buscar:</span>
            </div>
            <Input
              name="search"
              placeholder="Buscar por nombre, email..."
              value={filters.search}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
              className="border rounded w-64 md:w-80"
            />
          </div>
        </SubheaderRight>
      </Subheader>

      <Container className="pt-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="HeroUsers" className="w-6 h-6" />
                <h2 className="text-lg font-semibold">Lista de Usuarios</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Icon icon="HeroUserGroup" className="w-4 h-4" />
                <span>{users?.length || 0} usuarios encontrados</span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="overflow-auto p-0">
            {usersLoading.users ? (
              <div className="p-12 text-center">
                <Icon icon="HeroArrowPath" className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-zinc-600">Cargando usuarios...</p>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="p-12 text-center text-zinc-600">
                <Icon icon="HeroUsers" className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
                <p className="text-lg font-medium">No hay usuarios registrados</p>
                <p className="text-sm mt-2 text-zinc-400">
                  Los usuarios aparecerán aquí cuando estén disponibles
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <THead>
                      {table.getHeaderGroups().map((hg) => (
                        <Tr key={hg.id}>
                          {hg.headers.map((header) => (
                            <Th key={header.id} className="text-left font-semibold p-4">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </Th>
                          ))}
                        </Tr>
                      ))}
                    </THead>
                    <TBody>
                      {table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className={`border-b transition-colors `}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td key={cell.id} className="p-4">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                          ))}
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
                <div className="border-t p-4">
                  <TableCardFooterTemplateV2 table={table} />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Modal de Gestión de Permisos */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={handleClosePermissionsModal}
        selectedUser={selectedUserForPermissions}
        permissions={permissions}
        roles={roles}
        selectedPermissionIds={selectedPermissionIds}
        selectedRoleIds={selectedRoleIds}
        onPermissionChange={handlePermissionChange}
        onRoleChange={handleRoleChange}
        onSave={handleSavePermissions}
        isLoading={permissionsLoading.userPermissions || permissionsLoading.userRoles}
      />
    </PageWrapper>
  );
}
