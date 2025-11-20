import React from 'react';
import type { IReportResult } from '@/interface/reports.interface';

interface Props<T = any> {
	type: string;
	results: IReportResult<T> | null;
}

const ReportResultsTable = <T,>({ type, results }: Props<T>) => {
	const rows = results?.data ?? [];

	if (!rows.length) return <div className='p-4 text-zinc-500'>Sin resultados</div>;

	if (type === 'sales') {
		return (
			<div className='overflow-auto rounded-lg border border-zinc-200'>
				<table className='w-full table-auto'>
					<thead>
						<tr className='bg-zinc-50 dark:bg-zinc-800'>
							<th className='px-4 py-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								ID
							</th>
							<th className='px-4 py-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								Nº VENTA
							</th>
							<th className='px-4 py-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								FECHA
							</th>
							<th className='px-4 py-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								CLIENTE
							</th>
							<th className='px-4 py-2 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								SUBTOTAL
							</th>
							<th className='px-4 py-2 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								IVA
							</th>
							<th className='px-4 py-2 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								TOTAL
							</th>
							<th className='px-4 py-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								ESTADO
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r: any, i: number) => {
							// soporta varias formas: r.sale_number, r.wc_order_number, r.number
							const saleNum = r.sale_number ?? r.wc_order_number ?? r.number ?? r.id;
							const dateRaw = r.sale_date ?? r.date ?? r.created_at ?? r.updated_at;
							let dateStr = '';
							if (dateRaw) {
								try {
									const dt = new Date(dateRaw);
									dateStr = isNaN(dt.getTime())
										? String(dateRaw)
										: dt.toLocaleDateString('es-ES', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
											});
								} catch (_e) {
									dateStr = String(dateRaw);
								}
							}

							// Extraer nombre del cliente - el JSON muestra customer como objeto con id, pero el nombre puede estar en billing_snapshot
							const snapshotName =
								r.billing_snapshot?.company ||
								(r.billing_snapshot?.first_name && r.billing_snapshot?.last_name
									? `${r.billing_snapshot.first_name} ${r.billing_snapshot.last_name}`
									: r.billing_snapshot?.first_name ||
										r.billing_snapshot?.last_name);

							const customerName =
								snapshotName ??
								r.customer?.billing_company ??
								r.customer?.contact_name ??
								r.customer_name ??
								(typeof r.customer === 'string' ? r.customer : null) ??
								'—';

							const subtotal =
								parseFloat(
									r.subtotal ??
										r.subtotal_amount ??
										r.subtotal_amount ??
										r.subtotal ??
										0,
								) ||
								parseFloat(r.subtotal ?? '0') ||
								0;
							const tax = parseFloat(r.tax_amount ?? r.tax ?? '0') || 0;
							const total =
								parseFloat(r.total_amount ?? r.total ?? r.amount ?? '0') || 0;

							// Mapear estado a español según documentación
							const statusMap: Record<string, string> = {
								partially_paid: 'Parcialmente Pagada',
								paid: 'Pagada',
								pending: 'Pendiente',
								completed: 'Completada',
								confirmed: 'Confirmada',
								cancelled: 'Cancelada',
								refunded: 'Reembolsada',
							};
							const statusDisplay = statusMap[r.status] || r.status || '—';

							return (
								<tr
									key={i}
									className='border-t border-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
									<td className='px-4 py-2 text-sm'>{r.id}</td>
									<td className='px-4 py-2 font-mono text-sm'>{saleNum}</td>
									<td className='px-4 py-2 text-sm'>{dateStr}</td>
									<td className='px-4 py-2 text-sm'>{customerName}</td>
									<td className='px-4 py-2 text-right text-sm font-medium'>
										${' '}
										{subtotal.toLocaleString('es-CL', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</td>
									<td className='px-4 py-2 text-right text-sm font-medium'>
										${' '}
										{tax.toLocaleString('es-CL', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</td>
									<td className='px-4 py-2 text-right text-sm font-bold'>
										${' '}
										{total.toLocaleString('es-CL', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</td>
									<td className='px-4 py-2 text-sm'>
										<span
											className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
												statusDisplay === 'Pagada' ||
												statusDisplay === 'Completada'
													? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
													: statusDisplay === 'Parcialmente Pagada'
														? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
														: statusDisplay === 'Pendiente'
															? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
															: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
											}`}>
											{statusDisplay}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		);
	}

	if (type === 'stock') {
		return (
			<table className='w-full table-auto'>
				<thead>
					<tr>
						<th>SKU</th>
						<th>PRODUCTO</th>
						<th>SUCURSAL</th>
						<th>CANTIDAD</th>
						<th>ACTUALIZADO</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r: any, i: number) => (
						<tr key={i} className='border-t'>
							<td>{r.sku}</td>
							<td>{r.name ?? r.product}</td>
							<td>{r.branch_name ?? r.branch}</td>
							<td>{r.quantity ?? r.qty}</td>
							<td>{r.updated_at ?? r.updated}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	if (type === 'users') {
		return (
			<table className='w-full table-auto'>
				<thead>
					<tr>
						<th>ID</th>
						<th>NOMBRE</th>
						<th>EMAIL</th>
						<th>ROLES</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r: any, i: number) => (
						<tr key={i} className='border-t'>
							<td>{r.id}</td>
							<td>{r.name}</td>
							<td>{r.email}</td>
							<td>
								{(r.roles || []).join
									? (r.roles || []).join(', ')
									: String(r.roles ?? '')}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	if (type === 'movements') {
		return (
			<table className='w-full table-auto'>
				<thead>
					<tr>
						<th>ID</th>
						<th>TIPO</th>
						<th>SERIE</th>
						<th>CANTIDAD</th>
						<th>FECHA</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r: any, i: number) => (
						<tr key={i} className='border-t'>
							<td>{r.id}</td>
							<td>{r.type}</td>
							<td>{r.serial}</td>
							<td>{r.quantity ?? 1}</td>
							<td>{r.date}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	// Fallback: render keys
	return (
		<table className='w-full table-auto'>
			<thead>
				<tr>
					{Object.keys(rows[0] as Record<string, unknown>).map((k) => (
						<th key={k}>{k}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map((r: any, i: number) => (
					<tr key={i} className='border-t'>
						{Object.keys(rows[0] as Record<string, unknown>).map((k) => (
							<td key={k}>{String((r as Record<string, unknown>)[k] ?? '')}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default ReportResultsTable;
