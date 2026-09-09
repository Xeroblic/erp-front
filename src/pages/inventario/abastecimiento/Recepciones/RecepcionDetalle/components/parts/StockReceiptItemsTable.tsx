import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { ProductCard, CostBlock } from '@/components/procurement';
import type { IStockReceiptItem } from '@/interface/procurement.interface';

interface IStockReceiptItemsTableProps {
	items: IStockReceiptItem[];
}

/**
 * Líneas de la recepción (sección 7). `purchase_document_line_id` nulo es
 * el alta sin documento; presente, la línea del documento de la que se
 * derivó producto y costo — nunca sobrescribibles.
 */
const StockReceiptItemsTable: React.FC<IStockReceiptItemsTableProps> = ({ items }) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Líneas</CardTitle>
			<span className='text-sm text-zinc-500'>{items.length} líneas</span>
		</CardHeader>
		<CardBody className='overflow-x-auto p-0'>
			<Table className='min-w-[720px]'>
				<THead>
					<Tr>
						<Th>Producto</Th>
						<Th className='text-right'>Cantidad</Th>
						<Th>Costo</Th>
						<Th>Origen</Th>
					</Tr>
				</THead>
				<TBody>
					{items.map((item) => (
						<Tr key={item.id}>
							<Td>
								<ProductCard
									product={item.product}
									density='compact'
									showCatalogPricing={false}
								/>
							</Td>
							<Td className='text-right tabular-nums'>{item.quantity}</Td>
							<Td>
								<CostBlock cost={item.cost} showBreakdown={false} />
							</Td>
							<Td>
								{item.purchase_document_line_id !== null ? (
									<span className='text-sm text-zinc-500'>
										Línea del documento #{item.purchase_document_line_id}
									</span>
								) : (
									<span className='text-sm text-zinc-500'>
										Declarada sin documento
									</span>
								)}
							</Td>
						</Tr>
					))}
				</TBody>
			</Table>
		</CardBody>
	</Card>
);

export default StockReceiptItemsTable;
