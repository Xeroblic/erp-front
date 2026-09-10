import React, { FC } from 'react';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { ConditionLabel } from '@/components/procurement';
import type { IAjusteResult } from '@/pages/inventario/abastecimiento/AjustesInventario/hooks/useAjusteInventario';

export interface IAjusteResultCardProps {
	result: IAjusteResult;
	onDismiss: () => void;
}

const Delta: FC<{ before: number; after: number }> = ({ before, after }) => (
	<span className='tabular-nums'>
		<span className='text-zinc-500'>{before}</span>
		<span aria-hidden='true'> → </span>
		<span className='sr-only'> pasó a </span>
		<span className={after === before ? '' : 'font-semibold'}>{after}</span>
	</span>
);

/**
 * Confirmación de lo aplicado: antes y después de físico, apto y no apto por
 * producto, que es lo que devuelve la 201 del contrato (sección 11). La
 * pantalla los muestra como evidencia de lo que quedó, no como un resumen
 * recalculado en el cliente.
 */
const AjusteResultCard: FC<IAjusteResultCardProps> = ({ result, onDismiss }) => {
	const { adjustment, products, locationLabel, availability } = result;
	const productLabel = (productId: number): string => {
		const product = products[productId];
		return product ? `${product.name} (${product.sku})` : `Producto #${productId}`;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Ajuste aplicado</CardTitle>
				<Button type='button' variant='outline' size='sm' onClick={onDismiss}>
					Ocultar
				</Button>
			</CardHeader>
			<CardBody className='space-y-4'>
				<div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm'>
					<span>
						Ubicación: <strong>{locationLabel}</strong>
					</span>
					<span>
						Motivo: <strong>{adjustment.reason}</strong>
					</span>
					{adjustment.related_stock_receipt_id !== null && (
						<span>
							Recepción enlazada:{' '}
							<strong>#{adjustment.related_stock_receipt_id}</strong>
						</span>
					)}
				</div>

				<div className='overflow-x-auto'>
					<Table aria-label='Saldos antes y después del ajuste' className='min-w-[760px]'>
						<THead>
							<Tr>
								<Th scope='col' rowSpan={2}>
									Producto
								</Th>
								<Th scope='col' rowSpan={2}>
									Condición
								</Th>
								<Th scope='col' rowSpan={2}>
									Diferencia
								</Th>
								<Th scope='colgroup' colSpan={3}>
									Antes → después
								</Th>
							</Tr>
							<Tr>
								<Th scope='col'>Físico</Th>
								<Th scope='col'>Apto</Th>
								<Th scope='col'>No apto</Th>
							</Tr>
						</THead>
						<TBody>
							{adjustment.items.map((item) => {
								const product = products[item.product_id];
								return (
									<Tr key={`${item.product_id}:${item.condition}`}>
										<Td>
											{product ? (
												<span>
													<span className='font-medium'>
														{product.name}
													</span>{' '}
													<span className='text-zinc-500'>
														({product.sku})
													</span>
												</span>
											) : (
												`Producto #${item.product_id}`
											)}
										</Td>
										<Td>
											<ConditionLabel condition={item.condition} />
										</Td>
										<Td className='font-semibold tabular-nums'>
											{item.quantity_delta > 0
												? `+${item.quantity_delta}`
												: item.quantity_delta}
										</Td>
										<Td>
											<Delta
												before={item.physical_quantity_before}
												after={item.physical_quantity_after}
											/>
										</Td>
										<Td>
											<Delta
												before={item.fit_quantity_before}
												after={item.fit_quantity_after}
											/>
										</Td>
										<Td>
											<Delta
												before={item.unfit_quantity_before}
												after={item.unfit_quantity_after}
											/>
										</Td>
									</Tr>
								);
							})}
						</TBody>
					</Table>
				</div>
				<p className='text-xs text-zinc-500'>
					Los saldos son de {locationLabel}. Apto y no apto suman el físico; el ajuste no
					reclasifica unidades entre condiciones.
				</p>

				{/*
				 * Disponible de la sucursal frente a las reservas vigentes. La card
				 * pide explícitamente que un conteo pueda dejarlo negativo y que ese
				 * faltante **se muestre**: truncarlo en cero escondería unidades ya
				 * comprometidas que no existen.
				 */}
				<div className='space-y-2'>
					<h3 className='text-sm font-semibold'>Disponible en la sucursal</h3>
					<div className='overflow-x-auto'>
						<Table
							aria-label='Disponible en la sucursal frente a reservas'
							className='min-w-[620px]'>
							<THead>
								<Tr>
									<Th scope='col'>Producto</Th>
									<Th scope='col'>Físico</Th>
									<Th scope='col'>Apto</Th>
									<Th scope='col'>Reservado</Th>
									<Th scope='col'>Disponible</Th>
								</Tr>
							</THead>
							<TBody>
								{availability.map((row) => (
									<Tr key={row.product_id}>
										<Td>{productLabel(row.product_id)}</Td>
										<Td className='tabular-nums'>{row.physical_quantity}</Td>
										<Td className='tabular-nums'>{row.fit_quantity}</Td>
										<Td className='tabular-nums'>{row.reserved_quantity}</Td>
										<Td className='tabular-nums'>
											<span
												data-testid={`ajuste-disponible-${row.product_id}`}
												className={
													row.available_quantity < 0
														? 'font-semibold text-red-600 dark:text-red-400'
														: 'font-semibold'
												}>
												{row.available_quantity}
											</span>
											{row.available_quantity < 0 && (
												<span
													role='alert'
													className='ml-2 text-xs text-red-600 dark:text-red-400'>
													Faltante: {Math.abs(row.available_quantity)}{' '}
													{Math.abs(row.available_quantity) === 1
														? 'unidad comprometida que no existe'
														: 'unidades comprometidas que no existen'}
												</span>
											)}
										</Td>
									</Tr>
								))}
							</TBody>
						</Table>
					</div>
					<p className='text-xs text-zinc-500'>
						El disponible es de la sucursal completa, no de {locationLabel}: una reserva
						no elige bodega. El ajuste corrige el físico y no libera reservas, así que
						un disponible negativo es un faltante real que hay que resolver, no un error
						de esta pantalla.
					</p>
				</div>
			</CardBody>
		</Card>
	);
};

export default AjusteResultCard;
