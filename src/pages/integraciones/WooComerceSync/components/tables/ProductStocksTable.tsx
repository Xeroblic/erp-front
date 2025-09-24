import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { formatDate } from '@/utils/format.utils';
import { ProductStock } from '../../types/wooSync.types';
import { SyncStatusBadge } from '../UI/StatusBadges';

export default function ProductStocksTable({
  rows, selectedIds, onToggleAll, onToggleOne,
}:{
  rows: ProductStock[];
  selectedIds: number[];
  onToggleAll: () => void;
  onToggleOne: (id:number)=>void;
}) {
  return (
    <div className='overflow-x-auto'>
      <Table>
        <THead>
          <Tr>
            <Th>
              <input type='checkbox'
                checked={selectedIds.length === rows.length}
                onChange={onToggleAll}/>
            </Th>
            <Th>SKU</Th><Th>Producto</Th><Th>Stock Local</Th><Th>Stock WooCommerce</Th><Th>Estado</Th><Th>Última Sync</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map(p => (
            <Tr key={p.id}>
              <Td>
                <input type='checkbox' checked={selectedIds.includes(p.id)} onChange={()=>onToggleOne(p.id)} />
              </Td>
              <Td className='font-mono text-sm'>{p.sku}</Td>
              <Td>{p.name}</Td>
              <Td className='font-semibold'>{p.local_stock}</Td>
              <Td className={`font-semibold ${p.local_stock !== p.woo_stock ? 'text-amber-600' : ''}`}>{p.woo_stock}</Td>
              <Td><SyncStatusBadge status={p.sync_status} /></Td>
              <Td className='text-sm text-gray-600'>{formatDate(p.last_sync)}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
