import React, { useMemo, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Textarea from '@/components/form/Textarea';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { useAppDispatch } from '@/store';
import { closeSaleThunk } from '@/store/slices/salesSlice';
import { ICloseSaleRequest, ISaleItem } from '@/interface';

type CloseSalePayloadItem = ICloseSaleRequest['items'][number];

interface Props {
  open: boolean;
  onClose: () => void;
  subsidiaryId: number;
  saleId: number;
  items: ISaleItem[];
  onSuccess?: () => void;
}

const CloseSaleModal: React.FC<Props> = ({ open, onClose, subsidiaryId, saleId, items, onSuccess }) => {
  const dispatch = useAppDispatch();

  const [serialInputs, setSerialInputs] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedPayload = useMemo<CloseSalePayloadItem[]>(() => {
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

  const handleClose = () => {
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    const res = await dispatch(
      closeSaleThunk({ subsidiaryId, saleId, items: parsedPayload })
    );
    setIsSubmitting(false);
    if ((res as any).meta.requestStatus === 'fulfilled') {
      onSuccess?.();
      handleClose();
    }
  };

  return (
    <Modal isOpen={open} setIsOpen={handleClose} size="xl" isScrollable isStaticBackdrop isStaticBackdropAnimation isAnimation={false}>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Icon icon="HeroClipboardDocumentCheck" className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Cerrar venta</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ingresa las series solicitadas para cada ítem antes de confirmar el cierre.
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {error && (
          <Alert
            color="red"
            colorIntensity="500"
            variant="outline"
            icon="HeroExclamationTriangle"
            className="text-sm"
          >
            {error}
          </Alert>
        )}

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((it) => {
            const sku = it.sku || it.product?.sku || 'S/N';
            const name = it.product_name || it.product?.name || 'Producto sin nombre';

            return (
              <div
                key={it.id}
                className="rounded-lg border border-zinc-200 bg-white/80 p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {sku} — {name}
                    </p>
                    {it.attributes_description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {it.attributes_description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Cantidad requerida:{' '}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">{it.quantity}</span>
                    </p>
                  </div>
                  <Badge variant="outline" color="gray" className="px-2 py-1 text-[11px]">
                    Ítem #{it.id}
                  </Badge>
                </div>

                <Textarea
                  rows={4}
                  className="mt-3"
                  placeholder="Una serie por línea (o separadas por coma / punto y coma)"
                  value={serialInputs[it.id] || ''}
                  onChange={(e) => setSerialInputs((s) => ({ ...s, [it.id]: e.target.value }))}
                />
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
              No hay ítems para cerrar.
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex w-full justify-end gap-3">
          <Button variant="outline" onClick={handleClose} isDisable={isSubmitting} icon="HeroXMark">
            Cancelar
          </Button>
          <Button
            color="emerald"
            variant="solid"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            isDisable={isSubmitting || items.length === 0}
            icon={isSubmitting ? 'DuoLoading' : 'HeroCheckCircle'}
          >
            Confirmar cierre
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CloseSaleModal;

