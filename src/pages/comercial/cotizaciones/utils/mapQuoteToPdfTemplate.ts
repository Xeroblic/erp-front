import type { IQuote, IQuoteItem } from "@/interface/quotes.interface";

export function mapQuoteToPdfTemplate(quote: IQuote) {
	// ========== UTILITIES ==========
	const parse = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

	const formatDate = (value?: string | null) => {
		if (!value) return "—";
		const d = new Date(value);
		if (isNaN(d.getTime())) return "—";

		return d.toLocaleDateString("es-CL", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (value?: string | null) => {
		if (!value) return "—";
		const d = new Date(value);
		if (isNaN(d.getTime())) return "—";

		return d.toLocaleTimeString("es-CL", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// ========== COMPANY INFO ==========
	const metaCompany =
		(quote.metadata?.company as any) ??
		(quote.metadata?.company_info as any) ??
		(quote.metadata?.issuer as any) ??
		null;

	// fallback por si metadata no existe
	const companyTemplate = {
		name: metaCompany?.name ?? "SU EMPRESA LTDA.",
		tagline: metaCompany?.tagline ?? "",
		description: metaCompany?.description ?? "",
		rut: metaCompany?.rut ?? metaCompany?.tax_number ?? "",
		website: metaCompany?.website ?? metaCompany?.url ?? "",
		branchSII: metaCompany?.branch ?? metaCompany?.office ?? "",
		addresses:
			metaCompany?.addresses ??
			metaCompany?.address_lines ??
			metaCompany?.address ??
			[],
		bankInfo:
			metaCompany?.bankInfo ??
			metaCompany?.bank_info ??
			metaCompany?.payment_instructions ??
			[],
	};

	// ========== CUSTOMER ==========
	const c = quote.customer as any;

	const customerInfo = {
		name:
			c?.billing_company ??
			c?.company_name ??
			c?.name ??
			c?.contact_name ??
			`Cliente #${quote.customer_id}`,

		rut: c?.rut ?? c?.tax_number ?? "—",
		address: c?.address ?? c?.billing_address ?? c?.street ?? "—",
		commune: c?.comuna ?? c?.city ?? "—",
		city: c?.city ?? "—",
		email: c?.email ?? "—",
		phone: c?.phone ?? c?.mobile_phone ?? "—",
		giro:
			c?.giro ??
			c?.business ??
			"—",
	};

	// ========== VENDEDOR ==========
	const sp =
		(quote.metadata as any)?.seller ??
		(quote.metadata as any)?.salesperson ??
		{};

	const sellerInfo = {
		name:
			sp?.name ??
			(quote as any)?.salesperson_name ??
			(quote.salesperson_id ? `Vendedor #${quote.salesperson_id}` : "—"),

		email:
			sp?.email ??
			(quote as any)?.salesperson_email ??
			"—",

		phone:
			sp?.phone ??
			sp?.mobile ??
			(quote as any)?.salesperson_phone ??
			"—",
	};

	// ========== ITEMS ==========
	const items: IQuoteItem[] = quote.items ?? [];

	const mappedItems = items.map((item) => ({
		codigo: item.customer_sku ?? item.product?.sku ?? "—",
		cantidad: item.quantity,
		descripcion:
			item.customer_name ??
			item.product?.name ??
			"Ítem sin nombre",
		garantia:
			item.metadata?.warranty ??
			(item as any).warranty ??
			"—",
		unitario: item.unit_price,
		total: item.total_net ?? parse(item.quantity) * parse(item.unit_price),
	}));

	// ========== TOTALES ==========
	const toNumber = (v: unknown): number => {
		const n = Number(v);
		return isNaN(n) ? 0 : n;
	};

	const totalNet =
		toNumber(quote.totals?.total_net) ??
		toNumber(quote.total_net) ??
		items.reduce(
			(s, i) =>
				s +
				toNumber(i.quantity) * toNumber(i.unit_price) -
				toNumber(i.discount_amount ?? 0),
			0
		);

	const taxRate = toNumber(quote.totals?.tax_rate ?? quote.tax_rate);
	const taxAmount =
		toNumber(quote.totals?.tax_amount) ??
		toNumber(quote.tax_amount) ??
		totalNet * taxRate;

	const grand =
		toNumber(quote.totals?.grand_total) ??
		toNumber(quote.total_amount) ??
		(toNumber(totalNet) + toNumber(taxAmount));

	// ========== OBSERVACIONES ==========
	const observationLines: string[] = [];

	if (quote.notes) observationLines.push(`Notas: ${quote.notes}`);
	if (quote.internal_notes)
		observationLines.push(`Notas internas: ${quote.internal_notes}`);

	if (Array.isArray(companyTemplate.bankInfo)) {
		observationLines.push(...companyTemplate.bankInfo);
	}

	// ========== TEMPLATE FINAL ==========
	return {
		header: {
			companyName: companyTemplate.name,
			tagline: companyTemplate.tagline,
			description: companyTemplate.description,
			rut: companyTemplate.rut,
			website: companyTemplate.website,
			addresses: companyTemplate.addresses,
			branchSII: companyTemplate.branchSII,
			documentLabel: "COTIZACION",
			documentNumber: quote.quote_number ?? quote.id,
		},

		titleSeparator: "POR LO SIGUIENTE",

		clientInfo: {
			emissionDate: formatDate(quote.quote_date),
			emissionTime: formatTime(quote.quote_date),
			...customerInfo,
			paymentCondition:
				quote.payment_method ?? "—",
			deliveryCondition:
				quote.metadata?.delivery_method ??
				quote.metadata?.delivery_terms ??
				"—",
			seller: sellerInfo,
		},

		items: mappedItems,

		totals: {
			neto: totalNet,
			iva: taxAmount,
			total: grand,
		},

		observations: {
			lines: observationLines,
		},
	};
}
