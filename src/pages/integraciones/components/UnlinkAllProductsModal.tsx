import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { unlinkAllProducts } from '@/services/woocommerceProductsService';
import type { WooUnlinkAllResponse } from '@/types/integrations.types';

interface UnlinkAllProductsModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** Se llama tras una desvinculación real exitosa (para refrescar la lista). */
	onSuccess: () => void;
	subsidiaryId: number | null;
}

/** Cantidad de productos que se desvincularían (dry-run) según el response del backend. */
const resolveCount = (res: WooUnlinkAllResponse): number | null => res.to_unlink ?? null;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

/** Extrae el `message` del backend de un error de axios; cae al genérico si no hay. */
const backendMessage = (error: unknown, fallback: string): string => {
	const data = asRecord(asRecord(asRecord(error)?.response)?.data);
	const message = data?.message;
	if (typeof message === 'string' && message.trim()) return message;
	return error instanceof Error ? error.message : fallback;
};

/**
 * Confirmación de la desvinculación masiva ERP ↔ WooCommerce. Al abrir, ejecuta un
 * `dry_run` para previsualizar cuántos productos se desvincularían; al confirmar, lanza
 * la operación real (job asíncrono, soft-delete reversible).
 */
const UnlinkAllProductsModal: React.FC<UnlinkAllProductsModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	subsidiaryId,
}) => {
	const [previewCount, setPreviewCount] = useState<number | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Previsualización (dry-run) cada vez que se abre el modal.
	useEffect(() => {
		if (!isOpen || !subsidiaryId) return undefined;
		let active = true;
		setPreviewLoading(true);
		setPreviewError(null);
		setPreviewCount(null);
		unlinkAllProducts(subsidiaryId, true)
			.then((res) => {
				if (active) setPreviewCount(resolveCount(res));
			})
			.catch((err: unknown) => {
				if (active) {
					setPreviewError(backendMessage(err, 'No se pudo calcular la cantidad'));
				}
			})
			.finally(() => {
				if (active) setPreviewLoading(false);
			});
		return () => {
			active = false;
		};
	}, [isOpen, subsidiaryId]);

	const handleConfirm = useCallback(async () => {
		if (!subsidiaryId) return;
		setSubmitting(true);
		try {
			const res = await unlinkAllProducts(subsidiaryId, false);
			toast.success(res.message || 'Desvinculación masiva iniciada correctamente');
			onSuccess();
			onClose();
		} catch (error: unknown) {
			toast.error(backendMessage(error, 'Error al desvincular los productos'));
		} finally {
			setSubmitting(false);
		}
	}, [subsidiaryId, onSuccess, onClose]);

	const nothingToUnlink = previewCount === 0;

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg' isStaticBackdrop>
			<ModalHeader>
				<span className='flex items-center gap-2 text-rose-600 dark:text-rose-400'>
					<Icon icon='HeroExclamationTriangle' />
					Desvincular todos los productos
				</span>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<p className='text-sm text-gray-700 dark:text-gray-200'>
						Esto romperá la asociación ERP ↔ WooCommerce de <strong>todos</strong> los
						productos sincronizados de esta subsidiaria. No modifica las fichas en la
						tienda WooCommerce.
					</p>

					{/* Previsualización (dry-run) */}
					<div className='rounded-lg border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-500/30 dark:bg-rose-950/30'>
						{previewLoading && (
							<p className='flex items-center gap-2 text-sm text-rose-700 dark:text-rose-200'>
								<Icon icon='HeroArrowPath' className='animate-spin' />
								Calculando productos vinculados…
							</p>
						)}
						{!previewLoading && previewError && (
							<p className='text-sm font-medium text-rose-700 dark:text-rose-200'>
								{previewError}
							</p>
						)}
						{!previewLoading && !previewError && (
							<p className='text-sm font-semibold text-rose-800 dark:text-rose-100'>
								{previewCount === null
									? 'Se desvincularán todos los productos vinculados.'
									: `Se desvincularán ${previewCount} producto(s) vinculado(s).`}
							</p>
						)}
					</div>

					<p className='flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400'>
						<Icon icon='HeroInformationCircle' className='mt-0.5 flex-shrink-0' />
						La operación es un <strong className='mx-1'>soft-delete reversible</strong>y
						se ejecuta en segundo plano; los productos podrán re-vincularse después.
					</p>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' color='zinc' icon='HeroX' onClick={onClose}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					color='red'
					icon='HeroScissors'
					onClick={handleConfirm}
					isDisable={submitting || previewLoading || nothingToUnlink || !!previewError}>
					{submitting ? 'Desvinculando…' : 'Sí, desvincular todos'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default UnlinkAllProductsModal;
