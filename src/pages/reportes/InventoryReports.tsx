import React, { useMemo, useState } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import ReportFilters, { ReportFiltersState } from './components/ReportFilters';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';

type Row = { sku: string; nombre: string; bodega: string; stock: number; precio: number };

const mockData: Row[] = [
  { sku: 'SKU-001', nombre: 'Producto A', bodega: 'Centro', stock: 12, precio: 25 },
  { sku: 'SKU-002', nombre: 'Producto B', bodega: 'Norte', stock: 5, precio: 12 },
  { sku: 'SKU-003', nombre: 'Producto C', bodega: 'Centro', stock: 0, precio: 40 },
  { sku: 'SKU-004', nombre: 'Producto D', bodega: 'Norte', stock: 21, precio: 18 },
];

const InventoryReports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFiltersState>({});

  const rows = useMemo(() => {
    return mockData.filter((r) => {
      const priceMin = filters.priceMin === '' ? 0 : Number(filters.priceMin ?? 0);
      const priceMax = filters.priceMax === '' ? Infinity : Number(filters.priceMax ?? Infinity);
      const okPrice = r.precio >= priceMin && r.precio <= priceMax;
      const okBranch = !filters.branch || r.bodega.toLowerCase().includes('norte') === (filters.branch === 'br-2') || r.bodega.toLowerCase().includes('centro') === (filters.branch === 'br-1');
      return okPrice && okBranch;
    });
  }, [filters]);

  return (
    <div className="space-y-6">
      <Card className="border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-50/60 dark:from-emerald-900/10 dark:to-transparent shadow-sm">
        <CardHeader className="bg-white/60 dark:bg-zinc-900/40 rounded-t-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Icon icon="HeroCubeTransparent" className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-900">Reportes de Inventario</h2>
              <p className="text-sm text-emerald-700">Existencias, SKUs y valoración</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="overflow-auto rounded-lg border border-zinc-200">
            <Table>
              <THead>
                <Tr>
                  <Th>SKU</Th>
                  <Th>Producto</Th>
                  <Th>Bodega</Th>
                  <Th>Stock</Th>
                  <Th>Precio</Th>
                </Tr>
              </THead>
              <TBody>
                {rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} className="text-center text-sm text-zinc-500">
                      Sin resultados para los criterios seleccionados.
                    </Td>
                  </Tr>
                ) : (
                  rows.map((r) => (
                    <Tr key={r.sku}>
                      <Td className="font-mono">{r.sku}</Td>
                      <Td>{r.nombre}</Td>
                      <Td>{r.bodega}</Td>
                      <Td className={r.stock === 0 ? 'text-rose-600 font-semibold' : ''}>{r.stock}</Td>
                      <Td>$ {r.precio}</Td>
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <ReportFilters onApply={setFilters} />
    </div>
  );
};

export default InventoryReports;

