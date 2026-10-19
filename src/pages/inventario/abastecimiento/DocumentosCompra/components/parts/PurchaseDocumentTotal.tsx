import React from 'react';
import type { IPurchaseDocumentFormValues } from '../../types';
import { formatGrossTotal, getDocumentTotalCents } from '../../utils/purchaseDocumentTotals';

interface IPurchaseDocumentTotalProps {
	values: IPurchaseDocumentFormValues;
}

/** Total calculado del documento (líneas más envío), con IVA. */
const PurchaseDocumentTotal: React.FC<IPurchaseDocumentTotalProps> = ({ values }) => (
	<div className='flex justify-end rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900'>
		<div className='text-right'>
			<p className='text-xs text-zinc-500 dark:text-zinc-400'>Total calculado</p>
			<p className='text-lg font-semibold tabular-nums'>
				{formatGrossTotal(getDocumentTotalCents(values)) ?? '$0,00'}
			</p>
		</div>
	</div>
);

export default PurchaseDocumentTotal;
