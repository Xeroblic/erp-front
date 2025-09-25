import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { formatDate } from '@/utils/format.utils';
import { ProductStock } from '../../types/wooSync.types';
import { SyncStatusBadge } from '../UI/StatusBadges';

type Props = {
	rows: ProductStock[];
	selectedIds: number[];
	onToggleAll: () => void;
	onToggleOne: (id: number) => void;
	disabled?: boolean;
};

export default function ProductStocksTable({ rows, selectedIds, onToggleAll, onToggleOne, disabled }: Props) {
	const isAllSelected = rows.length > 0 && selectedIds.length === rows.length;

	return (
		<div className='overflow-x-auto'>
			<Table>
				<THead>
					<Tr>
						<Th>
							<input
								type='checkbox'
								checked={isAllSelected}
								onChange={onToggleAll}
								disabled={disabled || !rows.length}
							/>
						</Th>
						<Th>SKU</Th>
						<Th>Producto</Th>
						<Th>Stock local</Th>
						<Th>Stock WooCommerce</Th>
						<Th>Estado</Th>
						<Th>Última sync</Th>
					</Tr>
				</THead>
				<TBody>
					{rows.map((product) => {
						const checked = selectedIds.includes(product.id);
						return (
							<Tr key={product.id}>
								<Td>
									<input
										type='checkbox'
										checked={checked}
										onChange={() => onToggleOne(product.id)}
										disabled={disabled}
									/>
								</Td>
								<Td className='font-mono text-sm'>{product.sku}</Td>
								<Td>{product.name}</Td>
								<Td className='font-semibold'>{product.local_stock}</Td>
								<Td className={`font-semibold ${product.local_stock !== product.woo_stock ? 'text-amber-600' : ''}`}>
									{product.woo_stock}
								</Td>
								<Td>
									<SyncStatusBadge status={product.sync_status} />
								</Td>
								<Td className='text-sm text-gray-600'>{formatDate(product.last_sync)}</Td>
							</Tr>
						);
					})}
				</TBody>
			</Table>
		</div>
	);
}
