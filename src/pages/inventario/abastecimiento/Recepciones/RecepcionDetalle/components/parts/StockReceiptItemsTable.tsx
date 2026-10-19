import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { CostBlock, DetailLink, ProductCard } from '@/components/procurement';
import type { IPageLink } from '@/config/procurementLinks';
import type { IStockReceiptItem } from '@/interface/procurement.interface';

interface IStockReceiptItemsTableProps {
	items: IStockReceiptItem[];
	/** Número del documento vinculado, para nombrar el origen de cada línea. */
	documentNumber: string | null;
	/** Ficha del documento vinculado, o `null` si no hay una real a la que ir. */
	documentLink: IPageLink | null;
}

/**
 * Líneas de la recepción (sección 7). `purchase_document_line_id` nulo es
 * el alta sin documento; presente, la línea del documento de la que se
 * derivó producto y costo — nunca sobrescribibles. Se nombra por el número
 * del documento: el id interno de la línea no le dice nada a quien recibe.
 */
const StockReceiptItemsTable: React.FC<IStockReceiptItemsTableProps> = ({
	items,
	documentNumber,
	documentLink,
}) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Productos recibidos</CardTitle>
			<span className='text-sm text-zinc-500'>
				{items.length} línea{items.length === 1 ? '' : 's'}
			</span>
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
										<DetailLink
											link={documentLink}
											srLabel='Ficha del documento de compra'>
											{documentNumber
												? `Documento ${documentNumber}`
												: 'Documento de compra'}
										</DetailLink>
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
