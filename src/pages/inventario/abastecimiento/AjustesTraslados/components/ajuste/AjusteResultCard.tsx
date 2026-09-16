import React, { FC } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { ConditionLabel } from '@/components/procurement';
import type { TStockCondition } from '@/interface/procurement.interface';
import type { IAjusteResult } from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useAjusteInventario';

export interface IAjusteResultCardProps {
	result: IAjusteResult;
	onDismiss: () => void;
}

const units = (count: number): string => `${count} ${count === 1 ? 'unidad' : 'unidades'}`;

/** «unidad apta», «2 unidades no aptas»: concuerda en género y número con «unidad». */
const conditionAdjective = (condition: TStockCondition, count: number): string => {
	const base = condition === 'fit' ? 'apta' : 'no apta';
	return count === 1 ? base : `${base}s`;
};

/** Frase de una línea: «Se restaron 2 unidades aptas de …». */
const lineVerb = (added: boolean, count: number): string => {
	if (added) return count === 1 ? 'Se sumó' : 'Se sumaron';
	return count === 1 ? 'Se restó' : 'Se restaron';
};

/**
 * Confirmación de lo aplicado, con los saldos que devuelve la 201 del contrato
 * (sección 11): se muestran como evidencia de lo que quedó, no recalculados.
 *
 * Se lee de arriba abajo: una frase por producto, el antes/ahora de la
 * condición ajustada y el total de la ubicación, y al final lo que queda
 * disponible para vender en la sucursal frente a las reservas.
 */
const AjusteResultCard: FC<IAjusteResultCardProps> = ({ result, onDismiss }) => {
	const { adjustment, products, locationLabel, availability } = result;
	const productName = (productId: number): string =>
		products[productId]?.name ?? `Producto #${productId}`;
	const shortages = availability.filter((row) => row.available_quantity < 0);

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center gap-3'>
					<span className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40'>
						<Icon icon='HeroCheckCircle' className='h-6 w-6 text-emerald-600' />
					</span>
					<div>
						<CardTitle className='text-xl'>Ajuste aplicado</CardTitle>
						<p className='text-sm text-zinc-500 dark:text-zinc-400'>
							{locationLabel} · {adjustment.reason}
							{adjustment.related_stock_receipt_id !== null &&
								` · Recepción #${adjustment.related_stock_receipt_id}`}
						</p>
					</div>
				</div>
				<Button
					type='button'
					variant='solid'
					color='blue'
					icon='HeroPlus'
					onClick={onDismiss}>
					Nuevo ajuste
				</Button>
			</CardHeader>
			<CardBody className='space-y-6'>
				<ul className='space-y-1 text-sm' aria-label='Resumen del ajuste'>
					{adjustment.items.map((item) => {
						const added = item.quantity_delta > 0;
						const count = Math.abs(item.quantity_delta);
						return (
							<li
								key={`${item.product_id}:${item.condition}`}
								className='flex items-center gap-2'>
								<Icon
									icon={added ? 'HeroPlusCircle' : 'HeroMinusCircle'}
									className={classNames(
										'h-5 w-5',
										added ? 'text-emerald-600' : 'text-red-600',
									)}
								/>
								<span>
									{lineVerb(added, count)}{' '}
									<strong>
										{units(count)} {conditionAdjective(item.condition, count)}
									</strong>{' '}
									de <strong>{productName(item.product_id)}</strong>.
								</span>
							</li>
						);
					})}
				</ul>

				<section className='space-y-2'>
					<h3 className='text-sm font-semibold'>Stock en {locationLabel}</h3>
					<div className='overflow-x-auto'>
						<Table
							aria-label='Saldos antes y después del ajuste'
							className='min-w-[720px]'>
							<THead>
								<Tr>
									<Th scope='col'>Producto</Th>
									<Th scope='col'>Condición</Th>
									<Th scope='col'>Cambio</Th>
									<Th scope='col'>Antes</Th>
									<Th scope='col'>Ahora</Th>
									<Th scope='col'>Total en la ubicación</Th>
								</Tr>
							</THead>
							<TBody>
								{adjustment.items.map((item) => {
									const product = products[item.product_id];
									const isFit = item.condition === 'fit';
									const before = isFit
										? item.fit_quantity_before
										: item.unfit_quantity_before;
									const after = isFit
										? item.fit_quantity_after
										: item.unfit_quantity_after;
									return (
										<Tr key={`${item.product_id}:${item.condition}`}>
											<Td>
												<span className='font-medium'>
													{productName(item.product_id)}
												</span>
												{product && (
													<span className='block text-xs text-zinc-500'>
														{product.sku}
													</span>
												)}
											</Td>
											<Td>
												<ConditionLabel condition={item.condition} />
											</Td>
											<Td
												className={classNames(
													'font-semibold tabular-nums',
													item.quantity_delta > 0
														? 'text-emerald-600 dark:text-emerald-400'
														: 'text-red-600 dark:text-red-400',
												)}>
												{item.quantity_delta > 0
													? `+${item.quantity_delta}`
													: item.quantity_delta}
											</Td>
											<Td className='tabular-nums text-zinc-500'>{before}</Td>
											<Td className='font-semibold tabular-nums'>{after}</Td>
											<Td className='tabular-nums'>
												<span className='text-zinc-500'>
													{item.physical_quantity_before}
												</span>
												<span aria-hidden='true'> → </span>
												<span className='sr-only'> pasó a </span>
												<span className='font-semibold'>
													{item.physical_quantity_after}
												</span>
											</Td>
										</Tr>
									);
								})}
							</TBody>
						</Table>
					</div>
					<p className='text-xs text-zinc-500'>
						«Antes» y «Ahora» son de la condición ajustada. El total suma apto y no
						apto.
					</p>
				</section>

				{/*
				 * Disponible de la sucursal frente a las reservas vigentes. La card
				 * pide explícitamente que un conteo pueda dejarlo negativo y que ese
				 * faltante **se muestre**: truncarlo en cero escondería unidades ya
				 * comprometidas que no existen.
				 */}
				<section className='space-y-2'>
					<h3 className='text-sm font-semibold'>Disponible para vender en la sucursal</h3>
					{shortages.length > 0 && (
						<Alert
							color='red'
							icon='HeroExclamationTriangle'
							title='Faltan unidades reservadas'>
							<ul className='list-disc pl-5'>
								{shortages.map((row) => (
									<li key={row.product_id} role='alert'>
										{productName(row.product_id)}:{' '}
										{Math.abs(row.available_quantity) === 1
											? '1 unidad reservada no tiene stock que la respalde.'
											: `${Math.abs(row.available_quantity)} unidades reservadas no tienen stock que las respalde.`}{' '}
										Hay que reponer stock o liberar la reserva.
									</li>
								))}
							</ul>
						</Alert>
					)}
					<div className='overflow-x-auto'>
						<Table
							aria-label='Disponible en la sucursal frente a reservas'
							className='min-w-[520px]'>
							<THead>
								<Tr>
									<Th scope='col'>Producto</Th>
									<Th scope='col'>Stock apto</Th>
									<Th scope='col'>Reservado</Th>
									<Th scope='col'>Disponible</Th>
								</Tr>
							</THead>
							<TBody>
								{availability.map((row) => (
									<Tr key={row.product_id}>
										<Td className='font-medium'>
											{productName(row.product_id)}
										</Td>
										<Td className='tabular-nums'>{row.fit_quantity}</Td>
										<Td className='tabular-nums'>{row.reserved_quantity}</Td>
										<Td className='tabular-nums'>
											<span
												data-testid={`ajuste-disponible-${row.product_id}`}
												className={classNames('font-semibold', {
													'text-red-600 dark:text-red-400':
														row.available_quantity < 0,
												})}>
												{row.available_quantity}
											</span>
										</Td>
									</Tr>
								))}
							</TBody>
						</Table>
					</div>
					<p className='text-xs text-zinc-500'>
						Disponible = stock apto de toda la sucursal − unidades reservadas.
					</p>
				</section>
			</CardBody>
		</Card>
	);
};

export default AjusteResultCard;
