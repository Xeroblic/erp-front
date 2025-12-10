/**
 * HELPER PARA MAPEO DE DATOS DE COTIZACIONES
 *
 * Este archivo centraliza toda la lógica de obtención y mapeo de datos
 * para los documentos de cotización (PDF y vista imprimible).
 */

import type { IQuote, ISubempresa, IEmpresa, IQuoteItem } from '@/interface';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';
import { quoteStatusFilterOptions } from '../constants/quoteStatuses';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	efectivo: 'Efectivo',
	tarjeta_credito: 'Tarjeta de Crédito',
	tarjeta_debito: 'Tarjeta de Débito',
	transferencia: 'Transferencia',
	cheque: 'Cheque',
	credito: 'Crédito 30 días',
};

const resolvePaymentLabel = (value?: string | null) => {
	if (!value) return null;
	const key = value.toLowerCase();
	return PAYMENT_METHOD_LABELS[key] || value;
};

const safeNumber = (val: any) => {
	const num = Number(val);
	return Number.isFinite(num) ? num : 0;
};

const normalizeTaxRateValue = (val?: number | string | null) => {
	const num = safeNumber(val);
	if (num <= 0) return 0;
	return num > 1 ? num / 100 : num;
};

const roundCurrency = (value: number) => {
	return Math.round((value + Number.EPSILON) * 100) / 100;
};

const resolveItemTaxRate = (item: any, fallbackRate?: number) => {
	if (typeof fallbackRate === 'number') return fallbackRate;
	return normalizeTaxRateValue(
		(item as any)?.tax_rate ??
			(item as any)?.taxRate ??
			(item as any)?.tax_percentage ??
			(item as any)?.taxPercentage,
	);
};

/**
 * Obtiene la sucursal activa para una cotización
 * Prioridad:
 * 1. quote.subsidiary (si viene hidratado en el objeto quote)
 * 2. Buscar en state.subEmpresa.lista usando quote.subsidiary_id
 * 3. Buscar en state.personalizacion.current_company.subsidiaries
 */
export const getActiveSubsidiary = (
	quote: IQuote,
	state: any,
): Partial<ISubempresa> | undefined => {
	// 1. Intentar obtener desde quote.subsidiary (si existe)
	const quoteSub = (quote as any)?.subsidiary;
	if (quoteSub && typeof quoteSub === 'object') {
		return quoteSub;
	}

	const subId = Number(quote.subsidiary_id);
	if (!subId) return undefined;

	// 2. Buscar en el detalle de sucursal (si está cargado y coincide)
	const detail = state.subEmpresa?.detalle;
	if (detail && Number(detail.id) === subId) {
		return detail;
	}

	// 3. Buscar en la lista global de sucursales del estado
	const subsidiariesList = (state.subEmpresa?.lista || []) as ISubempresa[];
	const foundInList = subsidiariesList.find((s) => Number(s.id) === subId);
	if (foundInList) return foundInList;

	// 4. Buscar en current_company (si aplica)
	const currentCompanySubs = state.personalizacion?.current_company?.subsidiaries;
	if (Array.isArray(currentCompanySubs)) {
		return currentCompanySubs.find((sub: any) => Number(sub.id) === subId);
	}

	return undefined;
};

/**
 * Obtiene la información de la empresa/sucursal para mostrar en el documento
 */
export const getCompanyInfo = (quote: IQuote, state: any) => {
	// ELIMINADO: const mainCompany = state.empresa?.miEmpresa as IEmpresa | undefined;
	// El usuario indica que NO se deben usar datos de la empresa principal, solo subsidiarias.

	const activeSub = getActiveSubsidiary(quote, state);

	// Metadata específica de la cotización (si existe)
	const meta = (quote as any)?.metadata?.company || {};

	// Helper para obtener valor con prioridad: Metadata > Sucursal
	// Se eliminó el fallback a mainCompany
	const getVal = (metaKey: string, subKey: keyof ISubempresa, fallback: any = '') => {
		return meta[metaKey] || (activeSub as any)?.[subKey] || fallback;
	};

	// LOGO
	const logoRaw =
		meta.logo_base_64 || activeSub?.logo_base_64 || meta.logo_url || activeSub?.logo_url;

	const logoUrl =
		logoRaw && String(logoRaw).startsWith('data:')
			? logoRaw
			: ensureAbsoluteUrl(logoRaw || undefined) || logoRaw || null;

	// DATOS BANCARIOS
	const bankData = meta.bank_info ?? (activeSub as any)?.bank_info;
	const bankInfo = Array.isArray(bankData)
		? bankData.map(String)
		: bankData
			? [String(bankData)]
			: [];

	// Agregar detalle bancario extra si existe
	const extraBank = meta.bank_details || activeSub?.subsidiary_bank_details;
	if (extraBank) bankInfo.push(String(extraBank));

	// TÉRMINOS COMERCIALES
	const allowedPaymentMethods =
		meta.allowed_payment_methods ||
		activeSub?.subsidiary_allowed_payment_methods ||
		meta.payment_methods ||
		[];

	return {
		name: getVal('name', 'subsidiary_name', ''),
		rut: getVal('rut', 'subsidiary_rut', '—'),
		activity: getVal('activity', 'subsidiary_giro', ''),

		// Dirección compuesta
		fullAddress: (() => {
			const addr = getVal('address', 'subsidiary_address', '');
			const comm = meta.commune || activeSub?.commune?.name || activeSub?.commune_name || '';
			if (comm && addr && !addr.includes(comm)) return `${addr}, ${comm}`;
			return addr || comm || '—';
		})(),

		email: getVal('email', 'subsidiary_email', '—'),
		phone: getVal('phone', 'subsidiary_phone', '—'),
		website: getVal('website', 'subsidiary_website', ''),

		logoUrl,
		bankInfo,
		allowedPaymentMethods,

		deliveryTerm:
			meta.delivery_term ||
			activeSub?.subsidiary_delivery_term ||
			'A convenir o retiro en tienda.',
		quoteValidityText:
			meta.quote_validity_text || activeSub?.subsidiary_quote_validity_text || '',
		quoteValidityDays:
			meta.quote_validity_days || activeSub?.subsidiary_quote_validity_days || null,
		commercialTerms: meta.commercial_terms || activeSub?.subsidiary_commercial_terms || '',
	};
};

/**
 * Mapea los datos del cliente
 */
export const getCustomerInfo = (customer: any) => {
	if (!customer)
		return {
			name: 'Cliente General',
			rut: '—',
			address: '—',
			giro: '—',
			contactName: '—',
			phone: '—',
			email: '—',
			comuna: '',
		};

	const companyName =
		customer.razon_social || customer.name || customer.contact_name || 'Cliente General';
	const contactName = customer.contact_name || customer.contacto || customer.name || '—';

	return {
		name: companyName,
		rut: customer.rut || '—',
		address: customer.direccion || customer.address || '—',
		giro: customer.giro || '—',
		contactName,
		phone: customer.telefono || customer.phone || '—',
		email: customer.email || '—',
		comuna: customer.comuna || '',
	};
};

export const resolveUnitPrice = (item: any, taxRateOverride?: number): number => {
	const directValue =
		item?.unit_price ??
		item?.unit_price_net ??
		(item as any)?.unitPrice ??
		(item as any)?.unit_price_net ??
		item?.product?.unit_price;
	const direct = safeNumber(directValue);
	if (direct > 0) return direct;

	const subtotal = safeNumber(item?.subtotal ?? (item as any)?.total_net);
	const quantity = safeNumber(item?.quantity ?? 1);
	if (subtotal > 0 && quantity > 0) {
		return subtotal / quantity;
	}

	const grossUnit = safeNumber(
		item?.unit_price_gross ??
			(item as any)?.unit_price_gross ??
			(item as any)?.unitPriceGross ??
			(item as any)?.unit_price_bruto,
	);
	if (grossUnit > 0) {
		const rate = resolveItemTaxRate(item, taxRateOverride);
		return rate > 0 ? grossUnit / (1 + rate) : grossUnit;
	}

	const grossTotal = safeNumber(item?.total ?? (item as any)?.total_amount);
	if (grossTotal > 0 && quantity > 0) {
		const rate = resolveItemTaxRate(item, taxRateOverride);
		const netTotal = rate > 0 ? grossTotal / (1 + rate) : grossTotal;
		return netTotal / quantity;
	}

	return 0;
};
export const resolveLineTotal = (item: any, taxRateOverride?: number): number => {
	const subtotal =
		item?.subtotal ??
		(item as any)?.total_net ??
		(item as any)?.net_total ??
		(item as any)?.subtotal_net;
	const direct = safeNumber(subtotal);
	if (direct > 0) return direct;

	const quantity = safeNumber(item?.quantity ?? 1);
	const unit = resolveUnitPrice(item, taxRateOverride);
	if (unit > 0 && quantity > 0) {
		return unit * quantity;
	}

	const grossLine = safeNumber(item?.total ?? (item as any)?.total_amount);
	if (grossLine > 0) {
		const rate = resolveItemTaxRate(item, taxRateOverride);
		return rate > 0 ? grossLine / (1 + rate) : grossLine;
	}

	return 0;
};
export const getProductSku = (item: any): string => item?.customer_sku || item?.product?.sku || '—';
export const getProductName = (item: any): string =>
	item?.product?.name || item?.name || 'Producto sin nombre';
export const getProductDetail = (item: any): string | null =>
	item?.product_detail || item?.notes || '';

export const formatCurrency = (val: unknown): string => {
	const amount = Number(val);
	if (!Number.isFinite(amount)) {
		return '$0';
	}
	const decimals = Number.isInteger(amount) ? 0 : 0;
	const formatted = Math.abs(amount).toLocaleString('es-CL', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
	const sign = amount < 0 ? '-' : '';
	return `${sign}$${formatted}`;
};

export const formatDate = (val?: string | null): string => {
	if (!val) return '—';
	return new Date(val).toLocaleDateString('es-CL');
};

export const getPaymentMethodsLabel = (quote: IQuote): string => {
	const paymentArray = Array.isArray((quote as any)?.payment_methods)
		? (quote as any)?.payment_methods
		: Array.isArray(quote.payment_method)
			? (quote.payment_method as unknown as string[])
			: quote.payment_method
				? [quote.payment_method]
				: null;

	if (Array.isArray(paymentArray) && paymentArray.length > 0) {
		return paymentArray
			.map((method) => resolvePaymentLabel(String(method)) || method)
			.join(' / ');
	}

	if (typeof quote.payment_method === 'string' && quote.payment_method.trim()) {
		return resolvePaymentLabel(quote.payment_method) || quote.payment_method;
	}

	const companyAllowed =
		(quote as any)?.company?.allowed_payment_methods ||
		(quote as any)?.metadata?.company?.allowed_payment_methods ||
		[];

	if (Array.isArray(companyAllowed) && companyAllowed.length > 0) {
		return companyAllowed
			.map((method: string) => resolvePaymentLabel(method) || method)
			.join(' / ');
	}
	return 'Contado / Transferencia / WebPay';
};

export const getQuoteTaxRate = (quote: IQuote): number => {
	const raw =
		(quote as any)?.tax_rate ??
		(quote as any)?.taxRate ??
		(quote as any)?.tax_percentage ??
		(quote as any)?.taxPercentage ??
		0;
	return normalizeTaxRateValue(raw);
};

export const getSaleNumber = (quote: IQuote): string | null => {
	const candidate =
		(quote as any)?.sale_number ??
		(quote as any)?.metadata?.sale_number ??
		(quote as any)?.metadata?.sale?.sale_number ??
		(quote as any)?.metadata?.saleNumber ??
		null;

	if (!candidate) return null;
	const trimmed = String(candidate).trim();
	return trimmed.length > 0 ? trimmed : null;
};

export const getQuoteTotals = (quote: IQuote, items: IQuoteItem[] = []) => {
	const netFromQuote = safeNumber((quote as any).subtotal ?? (quote as any).total_net);
	const taxFromQuote = safeNumber((quote as any).tax_amount ?? (quote as any).total_tax);
	const discountFromQuote = safeNumber(
		(quote as any).discount_amount ?? (quote as any).fixed_discount,
	);
	const totalFromQuote = safeNumber((quote as any).total_amount);
	const taxRate = getQuoteTaxRate(quote);

	const fallbackNet = items.reduce(
		(acc, item) =>
			acc +
			safeNumber(
				item.subtotal ??
					(item as any).total_net ??
					(item as any).total ??
					safeNumber(item.unit_price) * safeNumber(item.quantity ?? 1),
			),
		0,
	);

	const fallbackDiscount = items.reduce((acc, item) => acc + safeNumber(item.discount_amount), 0);

	const fallbackTax = items.reduce((acc, item) => acc + safeNumber((item as any).tax_amount), 0);

	const netTotal = netFromQuote || fallbackNet;
	const discount = discountFromQuote || fallbackDiscount;
	const effectiveDiscount = Math.max(discount, 0);
	const taxBase = Math.max(netTotal - effectiveDiscount, 0);

	const tax =
		taxFromQuote ||
		(fallbackTax > 0
			? fallbackTax
			: taxRate > 0
				? roundCurrency(taxBase * taxRate)
				: 0);

	const total =
		totalFromQuote || (netTotal || effectiveDiscount || tax ? taxBase + tax : 0);

	return { netTotal, discount: effectiveDiscount, tax, total };
};

export const getDocumentType = (quote: IQuote): string => {
	const docType = quote?.document_type || quote?.metadata?.document_type;
	if (docType && typeof docType === 'string' && docType.trim().length > 0) {
		return docType;
	}
	return '—';
};
