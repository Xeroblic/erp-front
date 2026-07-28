import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import type { IDeferredPaymentItem } from '@/interface/deferredPayments.interface';
import { formatDeferredPaymentAmount } from '../../utils';

interface DeferredPaymentItemsSectionProps {
	items: IDeferredPaymentItem[];
}

const DeferredPaymentItemsSection: React.FC<DeferredPaymentItemsSectionProps> = ({ items }) => (
	<Card className='border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
		<CardBody className='space-y-4 p-5'>
			<div>
				<p className='font-semibold'>Ítems del documento</p>
				<p className='text-sm text-zinc-500'>
					Productos y servicios que componen la deuda.
				</p>
			</div>
			<div className='overflow-x-auto'>
				<Table className='min-w-[42rem] text-sm'>
					<THead>
						<Tr>
							<Th>Código y descripción</Th>
							<Th className='text-center'>Cantidad</Th>
							<Th>Seriales</Th>
							<Th className='text-right'>Precio unitario</Th>
							<Th className='text-right'>Subtotal</Th>
						</Tr>
					</THead>
					<TBody>
						{items.map((item) => (
							<Tr key={item.id}>
								<Td>
									<p className='font-semibold'>{item.code}</p>
									<p className='text-zinc-500'>{item.description}</p>
								</Td>
								<Td className='text-center'>{item.quantity}</Td>
								<Td>
									{item.serials.length > 0 ? (
										<div className='flex flex-wrap gap-1'>
											{item.serials.map((serial) => (
												<span
													key={serial}
													className='rounded-full bg-zinc-200 px-2 py-1 text-xs dark:bg-zinc-700'>
													{serial}
												</span>
											))}
										</div>
									) : (
										<span className='text-zinc-400'>—</span>
									)}
								</Td>
								<Td className='text-right'>
									{formatDeferredPaymentAmount(item.unit_price)}
								</Td>
								<Td className='text-right font-semibold'>
									{formatDeferredPaymentAmount(
										item.quantity * Number(item.unit_price),
									)}
								</Td>
							</Tr>
						))}
						{items.length === 0 && (
							<Tr>
								<Td colSpan={5} className='text-center text-zinc-500'>
									Este documento no tiene ítems informados.
								</Td>
							</Tr>
						)}
					</TBody>
				</Table>
			</div>
		</CardBody>
	</Card>
);

export default DeferredPaymentItemsSection;
