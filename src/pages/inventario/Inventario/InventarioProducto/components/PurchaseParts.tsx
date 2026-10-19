import { DetailLink } from '@/components/procurement';
import INVENTORY_RECEIPTS_USE_MOCKS from '@/config/inventoryReceipts.config';
import {
	purchaseDocumentDetailLink,
	stockReceiptDetailLink,
	supplierDetailLink,
} from '@/config/procurementLinks';
import {
	COST_CALCULATION_LABELS,
	COST_EFFECTIVE_BASIS_LABELS,
	isUnknownCost,
} from '@/utils/procurementCost.util';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import { formatDate } from '@/utils/format.utils';
import type {
	IProcurementCost,
	IProductPurchase,
	ISupplierCompact,
	TProductSupplierExclusionReason,
} from '@/interface/procurement.interface';

/** Por qué un proveedor no puede ser el sugerido, tal como lo informa el backend. */
export const EXCLUSION_REASON_LABELS: Record<TProductSupplierExclusionReason, string> = {
	inactive_supplier: 'Proveedor desactivado: no se sugiere',
	no_comparable_cost: 'Su última compra no tiene costo conocido',
};

/** `received_on` con su antigüedad, que calcula el backend. */
export const PurchaseDate = ({ purchase }: { purchase: IProductPurchase }) => {
	const days = purchase.days_since_purchase;
	let age = `hace ${days.toLocaleString('es-CL')} días`;
	if (days === 0) age = 'hoy';
	else if (days === 1) age = 'ayer';
	return (
		<>
			<p className='whitespace-nowrap tabular-nums'>{formatDate(purchase.received_on)}</p>
			<p className='text-sm text-zinc-500 dark:text-zinc-400'>{age}</p>
		</>
	);
};

/**
 * Costo unitario efectivo de la compra (neto en factura, bruto en boleta). Un
 * costo desconocido se dice desconocido: sus `null` darían un $0 falso.
 */
export const EffectiveCost = ({ cost }: { cost: IProcurementCost }) => {
	const amount = isUnknownCost(cost)
		? null
		: formatDecimalAmount(cost.effective_unit_amount, cost.currency_code);
	if (amount === null) return <span className='italic text-zinc-500'>Desconocido</span>;
	return (
		<>
			<p className='font-semibold tabular-nums'>{amount}</p>
			<p className='text-sm text-zinc-500 dark:text-zinc-400'>
				{COST_EFFECTIVE_BASIS_LABELS[cost.effective_basis]}
				{cost.calculation === 'weighted_within_receipt' &&
					` · ${COST_CALCULATION_LABELS.weighted_within_receipt.toLocaleLowerCase('es-CL')}`}
			</p>
		</>
	);
};

const documentLabel = (purchase: IProductPurchase): string | null =>
	purchase.purchase_document
		? `${purchase.purchase_document.document_type === 'invoice' ? 'Factura' : 'Boleta'} #${purchase.purchase_document.document_number}`
		: null;

/**
 * Recepción y documento de la compra. Cada uno enlaza a su ficha sólo con
 * todo el `authority` de la ruta (`DetailLink`). Con Recepciones simulada, el
 * ID real apuntaría a otra recepción: queda como texto.
 */
export const PurchaseReferences = ({ purchase }: { purchase: IProductPurchase }) => {
	const document = documentLabel(purchase);
	return (
		<>
			<p className='whitespace-nowrap'>
				<DetailLink
					link={
						INVENTORY_RECEIPTS_USE_MOCKS
							? null
							: stockReceiptDetailLink(purchase.stock_receipt_id)
					}
					srLabel='Ficha de la recepción'>
					Recepción #{purchase.stock_receipt_id}
				</DetailLink>
			</p>
			<p className='whitespace-nowrap text-sm'>
				{document && purchase.purchase_document ? (
					<DetailLink
						link={purchaseDocumentDetailLink(purchase.purchase_document.id)}
						srLabel='Ficha del documento de compra'>
						{document}
					</DetailLink>
				) : (
					<span className='text-zinc-500'>Sin documento</span>
				)}
			</p>
		</>
	);
};

/** Proveedor con su RUT; un desactivado se dice desactivado. */
export const SupplierName = ({ supplier }: { supplier: ISupplierCompact }) => (
	<>
		<p className='font-medium'>
			<DetailLink link={supplierDetailLink(supplier.id)} srLabel='Ficha del proveedor'>
				{supplier.display_name}
			</DetailLink>
		</p>
		<p className='text-sm text-zinc-500 dark:text-zinc-400'>
			<span className='font-mono'>{supplier.rut}</span>
			{!supplier.is_active && ' · Desactivado'}
		</p>
	</>
);
