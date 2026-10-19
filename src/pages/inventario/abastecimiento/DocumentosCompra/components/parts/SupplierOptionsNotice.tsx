import React from 'react';
import Button from '@/components/ui/Button';
import type { TSupplierOptionsUnavailableReason } from '../../hooks/useActiveSupplierOptions';

/**
 * Explica por qué el `Select` de proveedor quedó vacío cuando la lista no se
 * pudo cargar. Sin permiso de lectura no hay reintento que valga: se nombra el
 * permiso que falta. Ante un fallo común, se ofrece volver a pedirla.
 */

interface ISupplierOptionsNoticeProps {
	reason: TSupplierOptionsUnavailableReason | null;
	onRetry: () => void;
}

const SupplierOptionsNotice = ({ reason, onRetry }: ISupplierOptionsNoticeProps) => {
	if (reason === null) return null;

	if (reason === 'forbidden') {
		return (
			<p role='status' className='text-xs text-amber-700 dark:text-amber-400'>
				Tu usuario no tiene permiso para ver los proveedores de esta filial
				(view-procurement-supplier). Pídelo a un administrador para poder elegir uno.
			</p>
		);
	}

	return (
		<div role='status' className='flex flex-wrap items-center gap-2'>
			<p className='text-xs text-red-600 dark:text-red-400'>
				No se pudo cargar la lista de proveedores.
			</p>
			<Button type='button' size='xs' variant='ghost' color='blue' onClick={onRetry}>
				Reintentar
			</Button>
		</div>
	);
};

export default SupplierOptionsNotice;
