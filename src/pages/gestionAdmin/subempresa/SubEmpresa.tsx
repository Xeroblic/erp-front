// src/pages/gestionAdmin/subempresa/SubEmpresaLista.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchSubempresasByEmpresa } from '@/store/slices/subempresa/subEmpresaSlice'
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper'
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader'
import Container from '@/components/layouts/Container/Container'
import Card, { CardBody } from '@/components/ui/Card'
import Table, { Th, THead, Tr, TBody, Td } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Input from '@/components/form/Input'
import Badge from '@/components/ui/Badge'
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table'
import { ISubempresa } from '@/interface/empresas.interface'

const columnHelper = createColumnHelper<ISubempresa>()

export default function SubEmpresaLista() {
  const { empresaId: empresaIdParam } = useParams<{ empresaId: string }>()
  const empresaId = Number(empresaIdParam || 1)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { lista: subempresas, loading } = useAppSelector(state => state.subEmpresa)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    dispatch(fetchSubempresasByEmpresa(empresaId))
  }, [dispatch, empresaId])

  const columns = [
    columnHelper.accessor('nombre', {
      header: 'Subempresa',
      cell: info => info.getValue()
    }),
    columnHelper.display({
      id: 'acciones',
      header: '',
      cell: info => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            icon="HeroEye"
            onClick={() => navigate(`/gestion/empresa/${empresaId}/subempresa/${info.row.original.id}`)}
          />
        </div>
      )
    })
  ]

  const table = useReactTable({
    data: subempresas,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    enableGlobalFilter: true,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } }
  })

  return (
    <PageWrapper isProtectedRoute title="Subempresas" name="Subempresas">
      <Subheader>
        <SubheaderLeft>
          <Badge className="text-xl">Subempresas de la Empresa</Badge>
        </SubheaderLeft>
        <SubheaderRight className="flex items-center gap-2">
          <Input
            name="subempresa-busqueda"
            placeholder="Buscar..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="border rounded w-48"
          />
          <Button
            variant="solid"
            icon="HeroPlus"
            onClick={() => navigate(`/gestion/empresa/${empresaId}/subempresa/nuevo`)}
          >
            Nueva
          </Button>
        </SubheaderRight>
      </Subheader>

      <Container className="pt-4">
        <Card>
          <CardBody className="overflow-auto">
            {loading ? (
              <div className="p-8 text-center">Cargando subempresas…</div>
            ) : subempresas.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No hay subempresas registradas</div>
            ) : (
              <>
                <Table className="table-fixed w-full">
                  <THead>
                    {table.getHeaderGroups().map(hg => (
                      <Tr key={hg.id}>
                        {hg.headers.map(header => (
                          <Th key={header.id} className="text-left">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
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
                <div className="mt-4">
                  <TableCardFooterTemplateV2 table={table} />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </Container>
    </PageWrapper>
  )
}
