import React, { FC } from 'react';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { ConditionLabel } from '@/components/procurement';
import type { ITrasladoResult } from '@/pages/inventario/abastecimiento/TrasladosInternos/hooks/useTrasladoInterno';

export interface ITrasladoResultCardProps {
	result: ITrasladoResult;
	onDismiss: () => void;
}

/**
 * Confirmación de lo aplicado.
 *
 * El encabezado enuncia el **neto cero** con las unidades contadas una vez: el
 * criterio de aceptación de la card es que un traslado de 5 unidades se lea
 * como 5 movidas, nunca como 10, aunque la operación tenga dos efectos.
 */
const TrasladoResultCard: FC<ITrasladoResultCardProps> = ({ result, onDismiss }) => {
	const { movement, products, fromLabel, toLabel } = result;
	const units = movement.items.reduce((total, item) => total + item.quantity, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Traslado registrado</CardTitle>
				<Button type='button' variant='outline' size='sm' onClick={onDismiss}>
					Ocultar
				</Button>
			</CardHeader>
			<CardBody className='space-y-4'>
				<div className='flex flex-wrap items-center gap-x-6 gap-y-2'>
					<p className='text-lg font-semibold'>
						{units} {units === 1 ? 'unidad movida' : 'unidades movidas'}
					</p>
					<p className='text-sm text-zinc-600 dark:text-zinc-300'>
						{fromLabel} → {toLabel}
					</p>
					<p
						data-testid='traslado-neto'
						className='rounded bg-zinc-100 px-2 py-1 text-sm font-semibold tabular-nums dark:bg-zinc-800'>
						Efecto neto en la sucursal: 0 unidades
					</p>
				</div>
				<p className='text-sm text-zinc-600 dark:text-zinc-300'>
					Las unidades cambiaron de ubicación dentro de la misma sucursal: se cuentan una
					vez, aunque la operación tenga dos efectos. La condición y la procedencia no
					cambiaron.
				</p>

				<div className='overflow-x-auto'>
					<Table aria-label='Saldos después del traslado' className='min-w-[640px]'>
						<THead>
							<Tr>
								<Th scope='col'>Producto</Th>
								<Th scope='col'>Condición</Th>
								<Th scope='col'>Movidas</Th>
								<Th scope='col'>Queda en {fromLabel}</Th>
								<Th scope='col'>Queda en {toLabel}</Th>
							</Tr>
						</THead>
						<TBody>
							{movement.items.map((item) => {
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
											{item.quantity}
										</Td>
										<Td className='tabular-nums'>
											{item.origin_quantity_after}
										</Td>
										<Td className='tabular-nums'>
											{item.destination_quantity_after}
										</Td>
									</Tr>
								);
							})}
						</TBody>
					</Table>
				</div>
				<p className='text-xs text-zinc-500'>
					Los saldos «queda en» son de la condición de cada línea, no del físico total de
					la ubicación.
				</p>
			</CardBody>
		</Card>
	);
};

export default TrasladoResultCard;
