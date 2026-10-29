import React from 'react';
import { DetailLink } from '@/components/procurement';
import type { IPageLink } from '@/config/procurementLinks';
import type { ISupplierCompact } from '@/interface/procurement.interface';

interface IPurchaseDocumentSupplierFieldProps {
	supplier: ISupplierCompact | null;
	/** Ficha del proveedor; `DetailLink` la deja como texto sin el permiso. */
	supplierLink: IPageLink | null;
}

/** Proveedor vigente del documento, con enlace a su ficha. */
const PurchaseDocumentSupplierField: React.FC<IPurchaseDocumentSupplierFieldProps> = ({
	supplier,
	supplierLink,
}) => (
	<div>
		<p className='text-xs text-zinc-500 uppercase'>Proveedor</p>
		{supplier ? (
			<p>
				<DetailLink link={supplierLink} srLabel='Ficha del proveedor'>
					{supplier.display_name}
				</DetailLink>{' '}
				<span className='font-mono text-xs text-zinc-500'>({supplier.rut})</span>
			</p>
		) : (
			<p className='text-zinc-400'>Sin proveedor</p>
		)}
	</div>
);

export default PurchaseDocumentSupplierField;
