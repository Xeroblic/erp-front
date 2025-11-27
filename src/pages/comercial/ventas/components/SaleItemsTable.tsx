import React from 'react';
import { ISaleItem } from '@/interface/sales.interface';
import { formatCLP } from '../utils';

interface SaleItemsTableProps {
  items: ISaleItem[];
}

const SaleItemsTable: React.FC<SaleItemsTableProps> = ({ items }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              SKU
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400 w-1/3">
              Producto / Detalles
            </th>
            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Cant.
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Precio Unit.
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {items?.map((item) => {
            // Fallbacks de seguridad
            const sku = item.sku || 'S/N';
            const name = item.product_name || 'Producto sin nombre';
            // Usar strings para precisión o number según venga del backend
            const unitPrice = Number(item.price || 0);
            const totalLine = Number(item.total || (item.quantity * unitPrice));

            return (
              <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                {/* SKU */}
                <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400 align-top pt-4">
                  {sku}
                </td>

                {/* NOMBRE Y DETALLES (Aquí está el requerimiento visual) */}
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {name}
                    </span>
                    
                    {/* 👇 Lógica UX: Specs en gris y pequeño */}
                    {item.attributes_description && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-500 leading-tight">
                        {item.attributes_description}
                      </span>
                    )}
                    
                    {/* Opcional: Si hay series asignadas, mostrarlas aquí también */}
                    {item.serial_numbers && item.serial_numbers.length > 0 && (
                       <div className="flex flex-wrap gap-1 mt-1">
                          {item.serial_numbers.map(sn => (
                            <span key={sn} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                              {sn}
                            </span>
                          ))}
                       </div>
                    )}
                  </div>
                </td>

                {/* CANTIDAD */}
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-zinc-700 dark:text-zinc-300 align-top pt-4">
                  {item.quantity}
                </td>

                {/* PRECIO */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-zinc-700 dark:text-zinc-300 align-top pt-4">
                  {formatCLP(unitPrice)}
                </td>

                {/* TOTAL */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100 align-top pt-4">
                  {formatCLP(totalLine)}
                </td>
              </tr>
            );
          })}

          {(!items || items.length === 0) && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400 italic">
                No hay ítems registrados en esta venta.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SaleItemsTable;