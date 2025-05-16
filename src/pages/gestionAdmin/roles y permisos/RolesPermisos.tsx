import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper'
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader'
import Badge from '@/components/ui/Badge'
import Container from '@/components/layouts/Container/Container'
import Card, { CardBody } from '@/components/ui/Card'
import Table, { Th, THead, Tr, TBody, Td } from '@/components/ui/Table'
import Input from '@/components/form/Input'
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import Button from '@/components/ui/Button'
import { useFormik } from 'formik'
import { fetchUsuariosConRolesPerms, updateUsuarioRolesPerms } from '@/store/slices/rolesPermisos/rolesPermisosSlice'
import * as Yup from 'yup'
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal'
import SelectReact, { TSelectOption } from '@/components/form/SelectReact'
import Label from '@/components/form/Label'

// Definimos la interfaz de usuario según la respuesta del backend
interface IUsuario {
  id: number
  nombre: string
  email: string
  roles: { slug: string }[]
  permisos: { clave: string }[]
}

const columnHelper = createColumnHelper<IUsuario>()

const RolesPermisos: React.FC = () => {
  const dispatch = useAppDispatch()
  const { data: usuarios, status, error } = useAppSelector(s => s.rolesPermisos)

  // Ordenamiento y filtro global
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState<string>('')

  useEffect(() => {
    dispatch(fetchUsuariosConRolesPerms())
  }, [dispatch])

  // Tabla
  const columns = [
    columnHelper.accessor('nombre', {
      header: 'Nombre',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('roles', {
      header: 'Roles',
      cell: info => info.getValue().map(r => r.slug).join(', '),
    }),
    columnHelper.accessor('permisos', {
      header: 'Permisos',
      cell: info => info.getValue().map(p => p.clave).join(', '),
    }),
    columnHelper.display({
      id: 'acciones',
      header: 'Acciones',
      cell: info => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditor(info.row.original)}
        >
          Editar
        </Button>
      ),
    }),
  ]

  const table = useReactTable({
    data: usuarios,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
    enableGlobalFilter: true,
  })

  // Estado para el modal de edición
  const [editingUser, setEditingUser] = useState<IUsuario | null>(null)

  // Formik para editar roles/permisos
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      roles: editingUser?.roles.map(r => r.slug) || [],
      permisos: editingUser?.permisos.map(p => p.clave) || [],
    },
    validationSchema: Yup.object({
      roles: Yup.array().min(1, 'Seleccione al menos un rol'),
      permisos: Yup.array(),
    }),
    onSubmit: values => {
      if (editingUser) {
        dispatch(updateUsuarioRolesPerms({ id: editingUser.id, ...values }))
          .then(() => {
            dispatch(fetchUsuariosConRolesPerms())
            setEditingUser(null)
          })
      }
    },
  })

  const openEditor = (u: IUsuario) => setEditingUser(u)

  return (
    <PageWrapper isProtectedRoute title="Roles y Permisos" name="Roles y Permisos">
      <Subheader>
        <SubheaderLeft>
          <h1 className="text-2xl font-semibold">Roles y Permisos</h1>
          <Badge className="ml-4">
            {status === 'loading'
              ? 'Cargando…'
              : `${table.getPrePaginationRowModel().rows.length} usuarios`}
          </Badge>
        </SubheaderLeft>
        <SubheaderRight>
          <Input
            name="globalFilter"
            type="text"
            placeholder="Buscar..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="border rounded w-full max-w-xs"
          />
        </SubheaderRight>
      </Subheader>

      <Container className="pt-4">
        {status === 'loading' && <div className="text-center py-8">Cargando usuarios…</div>}
        {status === 'failed' && <div className="text-red-600 py-8">Error: {error}</div>}
        {status === 'idle' && (
          <Card>
            <CardBody className="overflow-auto">
              <Table className="table-fixed min-w-full">
                <THead>
                  {table.getHeaderGroups().map(hg => (
                    <Tr key={hg.id}>
                      {hg.headers.map(header => (
                        <Th key={header.id} className="text-left">
                          {header.isPlaceholder ? null : (
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? 'cursor-pointer select-none flex items-center'
                                  : '',
                                onClick: header.column.getToggleSortingHandler(),
                              }}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: <span className="ml-1">▲</span>,
                                desc: <span className="ml-1">▼</span>,
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          )}
                        </Th>
                      ))}
                    </Tr>
                  ))}
                </THead>
                <TBody>
                  {table.getRowModel().rows.map(row => (
                    <Tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <Td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </TBody>
              </Table>
              <div className="mt-2">
                <TableCardFooterTemplateV2 table={table} />
              </div>
            </CardBody>
          </Card>
        )}
      </Container>

      {/* Modal de edición */}
      <Modal
        isOpen={!!editingUser}
        setIsOpen={open => {
          if (!open) setEditingUser(null)
        }}
      >
        <ModalHeader>{`Editar ${editingUser?.nombre}`}</ModalHeader>
        <ModalBody>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <Label htmlFor="roles">Roles</Label>
            <SelectReact
              id="roles"
              name="roles"
              isMulti
              options={[]}
              value={formik.values.roles.map(slug => ({ label: slug, value: slug }))}
              onChange={(newValue) =>
                formik.setFieldValue(
                  'roles',
                  Array.isArray(newValue) ? newValue.map(o => o.value) : []
                )
              }
            />
            {formik.touched.roles && formik.errors.roles && (
              <div className="text-red-600 text-sm">{formik.errors.roles}</div>
            )}

            <Label htmlFor="permisos">Permisos</Label>
            <SelectReact
              id="permisos"
              name="permisos"
              isMulti
              options={[]}
              value={formik.values.permisos.map(clave => ({ label: clave, value: clave }))}
              onChange={(newValue) => {
                if (Array.isArray(newValue)) {
                  formik.setFieldValue('permisos', newValue.map(o => o.value))
                } else if (newValue && typeof newValue === 'object' && 'value' in newValue) {
                  formik.setFieldValue('permisos', [newValue.value])
                } else {
                  formik.setFieldValue('permisos', [])
                }
              }}
            />
          </form>
        </ModalBody>
        <ModalFooter>
          <ModalFooterChild>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
          </ModalFooterChild>
          <ModalFooterChild>
            <Button variant="solid" onClick={() => formik.handleSubmit()}>
              Guardar
            </Button>
          </ModalFooterChild>
        </ModalFooter>
      </Modal>
    </PageWrapper>
  )
}

export default RolesPermisos
