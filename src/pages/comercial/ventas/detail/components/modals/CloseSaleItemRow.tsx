import React from 'react';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import Input from '@/components/form/Input'; // Assuming Input component exists, else use standard input
import { ISaleItem } from '@/interface';
import type { ISaleStockShortageItem } from '@/interface/sales.interface';
import { formatShortageQuantities } from '../parts/SaleStockShortageAlert';

export interface ICloseSaleItemProps {
	item: ISaleItem;
	// value is now an array of strings corresponding to each unit
	values: string[];
	onChange: (id: number, index: number, val: string) => void;
	// Errors mapping: index -> errorMessage
	errors?: Record<number, string>;
	// Helper to jump focus
	onEnter: (currentId: number, currentIndex: number) => void;
	/** Faltante de esta línea en el 409 `SALE_STOCK_INSUFFICIENT`. */
	shortage?: ISaleStockShortageItem;
	/** Errores del backend para la línea completa (no para un input). */
	rowErrors?: string[];
}

// Extracted component to prevent re-renders of the whole list when typing in one field
const CloseSaleItemRow = React.memo(
	({
		item,
		values,
		onChange,
		errors = {},
		onEnter,
		shortage,
		rowErrors,
	}: ICloseSaleItemProps) => {
		const sku = item.sku || item.product?.sku || 'S/N';
		const name = item.product?.name || item.name || 'Producto sin nombre';
		const quantity = Math.max(1, Math.round(item.quantity));

		// Generate an array of indices based on quantity
		const iter = Array.from({ length: quantity }, (_, i) => i);

		const hasIssue = Boolean(shortage) || (rowErrors?.length ?? 0) > 0;

		return (
			<div
				role='group'
				aria-label={`${sku} — ${name}`}
				className={`rounded-lg border bg-white/80 p-3 shadow-sm dark:bg-zinc-900/60 ${
					hasIssue
						? 'border-red-400 dark:border-red-700'
						: 'border-zinc-200 dark:border-zinc-700'
				}`}>
				<div className='flex items-start justify-between gap-3'>
					<div className='space-y-1.5'>
						<p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
							{sku} — {name}
						</p>
						<p className='text-xs text-zinc-600 dark:text-zinc-400'>
							Cantidad: <span className='font-semibold'>{quantity}</span>
						</p>
						<Tooltip
							text='Unidades reservadas (apartadas) por esta venta. Al asignar la serie se marcan como vendidas y se libera la retención.'
							placement='top'>
							<Badge
								variant='outline'
								color='amber'
								className='inline-flex items-center gap-1 px-2 text-[11px]'>
								<Icon icon='HeroLockClosed' className='h-3 w-3' />
								<span>
									{quantity} apartada{quantity === 1 ? '' : 's'} por esta venta
								</span>
							</Badge>
						</Tooltip>
					</div>
					<div className='flex flex-col items-end gap-1'>
						<Badge variant='outline' color='gray' className='px-2 py-1 text-[11px]'>
							Ítem #{item.id}
						</Badge>
						{shortage && (
							<Badge
								variant='solid'
								color='red'
								className='inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 text-[11px] text-white'>
								<Icon
									icon='HeroExclamationTriangle'
									color='white'
									className='h-3 w-3'
								/>
								<span>{formatShortageQuantities(shortage)}</span>
							</Badge>
						)}
					</div>
				</div>

				{rowErrors && rowErrors.length > 0 && (
					<ul className='mt-2 space-y-0.5 text-xs text-red-600 dark:text-red-400'>
						{rowErrors.map((message) => (
							<li key={message}>{message}</li>
						))}
					</ul>
				)}

				<div className='mt-3 space-y-2'>
					{iter.map((idx) => {
						const errorMsg = errors[idx];
						const val = values[idx] || '';
						// Unique ID for focus management
						const inputId = `serial-input-${item.id}-${idx}`;

						return (
							<div key={idx} className='relative'>
								<div className='flex items-center gap-2'>
									<div className='flex h-8 w-8 flex-none items-center justify-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
										{idx + 1}
									</div>
									<div className='grow'>
										<input
											id={inputId}
											type='text'
											className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors dark:bg-zinc-950 ${
												errorMsg
													? 'border-red-500 focus:border-red-500'
													: 'border-zinc-300 focus:border-emerald-500 dark:border-zinc-700'
											}`}
											placeholder={`Escanear serie #${idx + 1}...`}
											value={val}
											onChange={(e) => onChange(item.id, idx, e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													onEnter(item.id, idx);
												}
											}}
											autoComplete='off'
										/>
									</div>
								</div>
								{errorMsg && (
									<div className='ml-10 mt-1 text-xs text-red-500'>
										{errorMsg}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	},
);

CloseSaleItemRow.displayName = 'CloseSaleItemRow';

export default CloseSaleItemRow;
