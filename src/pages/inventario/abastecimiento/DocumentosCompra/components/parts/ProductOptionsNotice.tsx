import React from 'react';
import Button from '@/components/ui/Button';
import type { TProductOptionsUnavailableReason } from '../../hooks/usePurchasableProductOptions';

/**
 * Explica por qué el `Select` de producto no ofrece opciones cuando el
 * catálogo no se pudo consultar. Mismo criterio que `SupplierOptionsNotice`:
 * sin permiso de lectura se nombra el permiso que falta; ante un fallo
 * común, se ofrece reintentar.
 */

interface IProductOptionsNoticeProps {
	reason: TProductOptionsUnavailableReason | null;
	onRetry: () => void;
}

const ProductOptionsNotice = ({ reason, onRetry }: IProductOptionsNoticeProps) => {
	if (reason === null) return null;

	if (reason === 'forbidden') {
		return (
			<p role='status' className='text-xs text-amber-700 dark:text-amber-400'>
				Tu usuario no tiene permiso para ver el catálogo de productos de esta filial
				(view-product). Pídelo a un administrador para poder elegir productos.
			</p>
		);
	}

	return (
		<div role='status' className='flex flex-wrap items-center gap-2'>
			<p className='text-xs text-red-600 dark:text-red-400'>
				No se pudo cargar el catálogo de productos.
			</p>
			<Button type='button' size='xs' variant='ghost' color='blue' onClick={onRetry}>
				Reintentar
			</Button>
		</div>
	);
};

export default ProductOptionsNotice;
