import React from 'react';
import type { SaleItem } from '@/services/salesService';
import { formatCLP } from '../utils';

interface Props {
  items: SaleItem[];
}

const SaleItemsTable: React.FC<Props> = ({ items }) => {
  return (
    <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
        <thead className="bg-zinc-50 dark:bg-zinc-800/60">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">SKU</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">Nombre</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300">Cantidad</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300">Precio</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300">Total</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {items?.map((it) => {
            const sku = it.sku ?? it.product?.sku ?? '';
            const name = it.name ?? it.product?.name ?? '';
            const total = it.total ?? (Number(it.unit_price || 0) * Number(it.quantity || 0));
            return (
              <tr key={it.id} className="bg-white dark:bg-zinc-900">
                <td className="px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100">{sku}</td>
                <td className="px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100">{name}</td>
                <td className="px-4 py-2 text-sm text-right text-zinc-800 dark:text-zinc-100">{it.quantity}</td>
                <td className="px-4 py-2 text-sm text-right text-zinc-800 dark:text-zinc-100">{formatCLP(it.unit_price || 0)}</td>
                <td className="px-4 py-2 text-sm text-right text-zinc-800 dark:text-zinc-100">{formatCLP(total || 0)}</td>
                <td className="px-4 py-2 text-sm text-right">
                  {it.status ? (
                    <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {it.status}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
          {(!items || items.length === 0) && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Sin ítems
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SaleItemsTable;

