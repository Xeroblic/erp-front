import store from '@/store';
import type { AppThunkDispatch } from '@/store/hook';
import { fetchSubsidiariaDetail } from '@/store/slices/subempresa/subEmpresaSlice';
import type { IQuote } from '@/interface/quotes.interface';
import { formatDate } from '@/utils/format.utils';
import { priceFormat } from '@/utils/priceFormat.util';
import { getFirstCapitalize } from '@/utils/getFirstLetter';
import {
	getCompanyInfo,
	getCustomerInfo,
	getQuoteTotals,
	getQuoteTaxRate,
	getPaymentMethodsLabel,
	getDocumentType,
	getSaleNumber,
	resolveUnitPrice,
	resolveLineTotal,
	getProductSku,
	getProductName,
	getProductDetail,
} from '../../components/quote-data-mapper';
import { fillQuoteExcelTemplate, type QuoteExcelModel } from './quoteExcelTemplate';
// Plantilla física; Vite la resuelve a una URL servible/emitida en build.
import templateUrl from '../../components/formatoExcel/formatoExcel.xlsx?url';

const timeCL = (value: Date): string =>
	value.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

type CompanyInfo = ReturnType<typeof getCompanyInfo>;

/** Carga los datos de la subsidiaria si aún no están en el store (igual que el PDF). */
const resolveCompany = async (quote: IQuote): Promise<CompanyInfo> => {
	let state = store.getState();
	let company = getCompanyInfo(quote, state);

	if (quote.subsidiary_id && (!company.name || company.name === 'EcoTI')) {
		if (state.subEmpresa.detalle?.id !== quote.subsidiary_id) {
			await (store.dispatch as AppThunkDispatch)(fetchSubsidiariaDetail(quote.subsidiary_id));
			state = store.getState();
			company = getCompanyInfo(quote, state);
		}
	}
	return company;
};

/** Construye el modelo plano de la plantilla a partir de la cotización. */
const buildQuoteExcelModel = (
	quote: IQuote,
	company: CompanyInfo,
	issuer?: { first_name?: string; last_name?: string },
): QuoteExcelModel => {
	const items = Array.isArray(quote.items) ? quote.items : [];
	const taxRate = getQuoteTaxRate(quote);

	const customer = getCustomerInfo((quote as { customer?: unknown }).customer, {
		billingSnapshot: (quote as { billing_snapshot?: unknown }).billing_snapshot,
		shippingSnapshot: (quote as { shipping_snapshot?: unknown }).shipping_snapshot,
	});

	const metadata = (quote.metadata ?? {}) as Record<string, unknown>;
	const rawSaleNumber = quote.is_converted_to_sale ? getSaleNumber(quote) : null;
	const metadataSaleId = Number(
		(metadata.sale_id as number) ||
			(metadata.saleId as number) ||
			((metadata.sale as { id?: number })?.id ?? 0) ||
			(quote as { sale_id?: number }).sale_id ||
			((quote as { sale?: { id?: number } }).sale?.id ?? 0) ||
			0,
	);
	const saleDigits = rawSaleNumber?.match(/\d+/)?.[0];
	const derivedSaleId =
		metadataSaleId > 0 ? metadataSaleId : saleDigits ? Number(saleDigits) : null;
	const saleNumber =
		derivedSaleId && derivedSaleId > 0 ? String(5000 + derivedSaleId) : rawSaleNumber;

	const paymentMethodsLabel = getPaymentMethodsLabel(quote);
	const documentType = getDocumentType(quote);
	const { netTotal, tax, total } = getQuoteTotals(quote, items);

	const mappedItems = items.map((item) => {
		const name = getProductName(item);
		const detail = getProductDetail(item);
		const discount = Number((item as { discount_amount?: number }).discount_amount || 0);
		const descripcion = [
			name,
			detail || null,
			discount > 0 ? `Descuento: - ${priceFormat(discount)}` : null,
		]
			.filter(Boolean)
			.join('\n');

		return {
			cantidad: Number(item.quantity || 0),
			codigo: getProductSku(item),
			descripcion,
			precioNeto: resolveUnitPrice(item, taxRate),
			totalNeto: resolveLineTotal(item, taxRate),
		};
	});

	const validity =
		company.quoteValidityText ||
		(company.quoteValidityDays ? `${company.quoteValidityDays} días hábiles` : '7 días hábiles');
	const deliveryTerm = company.deliveryTerm || 'A convenir o retiro en tienda.';
	const conditions = [
		`• Validez Oferta: ${validity}`,
		`• Forma de Pago: ${paymentMethodsLabel}`,
		`• Entrega: ${deliveryTerm}`,
		company.commercialTerms ? `• ${company.commercialTerms}` : null,
	]
		.filter(Boolean)
		.join('\n');

	const quoteUser = (quote as { user?: { first_name?: string; last_name?: string } }).user;

	return {
		company: {
			name: company.name || '—',
			rut: company.rut || '—',
			address: company.fullAddress || '—',
			email: company.email || '—',
			giro: company.activity || '—',
		},
		quoteNumber: quote.id,
		docCreatedLine: quote.created_at
			? `${formatDate(quote.created_at)} ${timeCL(new Date(quote.created_at))}`
			: '—',
		emissionDate: formatDate(new Date()),
		emissionTime: timeCL(new Date()),
		purchaseOrder: quote.purchase_order ? String(quote.purchase_order) : '—',
		customer: {
			name: customer.name,
			rut: customer.rut,
			giro: customer.giro,
			shippingAddress: customer.shippingAddress,
			billingAddress:
				customer.billingAddress && customer.billingAddress.trim() !== ''
					? customer.billingAddress
					: '—',
			contactName: customer.contactName,
			email: customer.email || '—',
		},
		right: {
			fecha: formatDate(quote.quote_date),
			telefono: customer.phone || '—',
			nVenta: saleNumber || '—',
			metodoPago: getFirstCapitalize(paymentMethodsLabel),
			documento: getFirstCapitalize(documentType),
		},
		items: mappedItems,
		totals: { neto: netTotal, iva: tax, total },
		conditions,
		bank: Array.isArray(company.bankInfo) ? company.bankInfo.join('\n') : '',
		footerGeneratedBy: `Documento generado electrónicamente por ${company.name || 'la empresa'}`,
		emitidoPor: `Emitido por: ${[issuer?.first_name, issuer?.last_name].filter(Boolean).join(' ')}`.trim(),
		creadoPor: `Creado por: ${[quoteUser?.first_name, quoteUser?.last_name].filter(Boolean).join(' ')}`.trim(),
	};
};

/**
 * Genera el Excel de una cotización rellenando la plantilla `formatoExcel.xlsx`
 * con los mismos datos que el PDF. Devuelve un Blob listo para `saveAs`.
 */
export const generateQuoteExcel = async (
	quote: IQuote,
	issuer?: { first_name?: string; last_name?: string },
): Promise<Blob> => {
	const [{ default: ExcelJS }, templateResp] = await Promise.all([
		import('exceljs'),
		fetch(templateUrl),
	]);

	if (!templateResp.ok) {
		throw new Error(`No se pudo cargar la plantilla de Excel (${templateResp.status}).`);
	}
	const templateBuffer = await templateResp.arrayBuffer();

	const company = await resolveCompany(quote);
	const model = buildQuoteExcelModel(quote, company, issuer);

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(templateBuffer);
	fillQuoteExcelTemplate(workbook, model);

	const out = await workbook.xlsx.writeBuffer();
	return new Blob([out], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});
};
