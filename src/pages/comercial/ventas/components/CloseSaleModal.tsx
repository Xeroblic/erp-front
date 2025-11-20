import React, { useMemo, useState } from 'react';
import { useAppDispatch } from '@/store';
import type { SaleItem } from '@/services/salesService';
import { closeSaleThunk } from '@/store/slices/salesSlice';

interface Props {
  open: boolean;
  onClose: () => void;
  subsidiaryId: number;
  saleId: number;
  items: SaleItem[];
  onSuccess?: () => void;
}

const CloseSaleModal: React.FC<Props> = ({ open, onClose, subsidiaryId, saleId, items, onSuccess }) => {
  const dispatch = useAppDispatch();

  const [serialInputs, setSerialInputs] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const parsedPayload = useMemo(() => {
    return items.map((it) => {
      const raw = serialInputs[it.id] || '';
      const serials = raw
        .split(/\r?\n|,|;|\t/) // soporta múltiples separadores
        .map((s) => s.trim())
        .filter(Boolean);
      return { sale_item_id: it.id, serial_numbers: serials };
    });
  }, [items, serialInputs]);

  const validate = (): boolean => {
    for (const it of items) {
      const entry = parsedPayload.find((p) => p.sale_item_id === it.id);
      const serialCount = entry?.serial_numbers?.length ?? 0;
      if (serialCount !== Number(it.quantity)) {
        setError(
          `Ítem ${it.id}: cantidad de series (${serialCount}) no coincide con la cantidad (${it.quantity})`
        );
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    const res = await dispatch(
      closeSaleThunk({ subsidiaryId, saleId, items: parsedPayload })
    );
    if ((res as any).meta.requestStatus === 'fulfilled') {
      onSuccess?.();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-900">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Cerrar venta</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Ingresa las series por ítem. La cantidad de series debe coincidir con la cantidad del ítem.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 p-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {items.map((it) => (
            <div key={it.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {it.sku || it.product?.sku} — {it.name || it.product?.name}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">Cantidad: {it.quantity}</div>
                </div>
                <div className="text-xs text-zinc-500">Ítem #{it.id}</div>
              </div>
              <textarea
                className="h-24 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Una serie por línea (o separadas por coma/punto y coma)"
                value={serialInputs[it.id] || ''}
                onChange={(e) => setSerialInputs((s) => ({ ...s, [it.id]: e.target.value }))}
              />
            </div>
          ))}
          {(!items || items.length === 0) && (
            <div className="rounded-md border border-zinc-200 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              No hay ítems para cerrar.
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Confirmar cierre
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseSaleModal;

