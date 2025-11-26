import React from 'react';
import type { IQuote, IQuoteItem } from '../../../../interface/quotes.interface';
import store, { type RootState } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import type { IBranch, ISubempresa } from '@/interface/empresas.interface';


interface QuotePrintableViewProps {
	quote: IQuote;
}

const formatDate = (value?: string | null) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleDateString('es-CL', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

const formatTime = (value?: string | null) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleTimeString('es-CL', {
		hour: '2-digit',
		minute: '2-digit',
	});
};

const parseNumber = (value: any): number => {
	const num = Number(value);
	return Number.isNaN(num) ? 0 : num;
};

const formatCurrency = (value: any) =>
	new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
		parseNumber(value),
	);

const computeItemTotal = (item: IQuoteItem) => {
	const quantity = parseNumber(item.quantity || 0);
	const unit = parseNumber(item.unit_price || 0);
	const discount = parseNumber((item as any).discount_amount ?? 0);
	return quantity * unit - discount;
};

const ensureArray = (value?: string | string[] | null): string[] => {
	if (!value) return [];
	if (Array.isArray(value)) return value.map((entry) => String(entry)).filter(Boolean);
	return String(value)
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.filter(Boolean);
};

interface CompanyInfo {
	name: string;
	tagline?: string;
	description?: string;
	rut: string;
	branch?: string;
	website?: string;
	addresses: string[];
	phoneLines: string[];
	emails: string[];
	bankInfo: string[];
	documentLabel: string;
	logoUrl?: string;
}

const fallbackCompanyInfo: CompanyInfo = {
	name: 'SU EMPRESA LTDA.',
	tagline: 'Tecnología y soluciones para su negocio',
	description: 'Importación, distribución y comercialización de equipos, periféricos y software.',
	rut: '00.000.000-0',
	branch: 'S.I.I. - CASA MATRIZ',
	website: 'www.suempresa.cl',
	addresses: ['Dirección principal 1234, Ciudad'],
	phoneLines: ['+56 2 2345 6789'],
	emails: ['contacto@suempresa.cl'],
	bankInfo: ['Depósitos en cuenta corriente a nombre de SU EMPRESA LTDA.'],
	documentLabel: 'Cotización',
	logoUrl: undefined,
};


const normalizeText = (value?: string | null): string | undefined => {
	if (value === undefined || value === null) return undefined;
	const normalized = String(value).trim();
	return normalized.length ? normalized : undefined;
};

const collect = (target: Set<string>, raw?: string | null) => {
	const normalized = normalizeText(raw);
	if (normalized) target.add(normalized);
};

const getStateSnapshot = (): RootState | null => {
	try {
		return store.getState();
	} catch (error) {
		console.error('No se pudo leer el estado global:', error);
		return null;
	}
};

const normalizeSubsidiary = (input: any): Partial<ISubempresa> | null => {
	if (!input || typeof input !== 'object') return null;

	return {
		id: input.id,
		name: input.name ?? input.subsidiary_name,
		rut: input.rut ?? input.subsidiary_rut ?? input.tax_number,
		website: input.website ?? input.subsidiary_website,
		phone: input.phone ?? input.subsidiary_phone,
		address: input.address ?? input.subsidiary_address,
		email: input.email ?? input.subsidiary_email,
		sucursales: (input.sucursales ?? input.branches) as IBranch[] | undefined,
		branches: input.branches,
		manager_name: input.manager_name ?? input.subsidiary_manager_name,
		manager_phone: input.manager_phone ?? input.subsidiary_manager_phone,
		manager_email: input.manager_email ?? input.subsidiary_manager_email,
		commune: input.commune,
	} as Partial<ISubempresa>;
};

const getPrimaryBranch = (subsidiary?: Partial<ISubempresa> | null): IBranch | null => {
	if (!subsidiary) return null;
	const candidates = (Array.isArray(subsidiary.sucursales) && subsidiary.sucursales.length
		? subsidiary.sucursales
		: subsidiary.branches) as IBranch[] | undefined;
	if (candidates && candidates.length) return candidates[0];
	return null;
};

const extractLogoUrl = (...sources: Array<Record<string, any> | null | undefined>) => {
	for (const source of sources) {
		if (!source) continue;

		const direct = normalizeText(
			source.logo_url ||
				source.logoUrl ||
				source.logo_path ||
				source.logo,
		);
		if (direct) return direct;

		const nested = source.logo;
		if (nested && typeof nested === 'object') {
			const variants = [
				nested.url,
				nested.original_url,
				nested.medium,
				nested.full,
				nested.sm,
				nested.md,
				nested.lg,
			];
			for (const variant of variants) {
				const normalized = normalizeText(variant);
				if (normalized) return normalized;
			}
		}
	}
	return undefined;
};

const buildCompanyInfo = (quote: IQuote): CompanyInfo => {
	const state = getStateSnapshot();

	const metadataCompany =
		(quote.metadata?.company as Record<string, any>) ??
		(quote.metadata?.company_info as Record<string, any>) ??
		(quote.metadata?.subsidiary as Record<string, any>) ??
		(quote.metadata?.issuer as Record<string, any>) ??
		null;

	const candidateSubs = [
		...(state?.subEmpresa?.lista ?? []),
		...(state?.empresa?.miEmpresaSubsidiarias ?? []),
	];

	const normalizedCandidates = candidateSubs
		.map((entry) => normalizeSubsidiary(entry))
		.filter(Boolean) as Partial<ISubempresa>[];

	const findById = (id?: number | null) => {
		if (!id) return null;
		return (
			normalizedCandidates.find((subs) => Number(subs.id) === Number(id)) ||
			null
		);
	};

	let activeSubsidiary: Partial<ISubempresa> | null = null;

	if (state) {
		activeSubsidiary = findById(selectEffectiveSubsidiaryId(state));
	}

	if (!activeSubsidiary && state?.personalizacion?.personalizacionUsuario?.subsidiary_id) {
		activeSubsidiary = findById(state.personalizacion.personalizacionUsuario.subsidiary_id);
	}

	if (!activeSubsidiary) {
		activeSubsidiary =
			normalizeSubsidiary((state?.auth?.user as any)?.branch?.subsidiary) ||
			normalizeSubsidiary((state?.auth?.user as any)?.subsidiary) ||
			normalizedCandidates[0] ||
			null;
	}

	const branch = getPrimaryBranch(activeSubsidiary);
	const companyState = state?.empresa?.miEmpresa;

	const addressSet = new Set<string>();
	const phoneSet = new Set<string>();
	const emailSet = new Set<string>();
	const bankSet = new Set<string>();

	collect(addressSet, activeSubsidiary?.address);
	collect(addressSet, branch?.branch_address);
	ensureArray(metadataCompany?.addresses ?? metadataCompany?.address_lines ?? metadataCompany?.address).forEach((addr) =>
		collect(addressSet, addr),
	);
	collect(addressSet, companyState?.company_address);

	collect(phoneSet, activeSubsidiary?.phone);
	collect(phoneSet, branch?.branch_phone);
	collect(phoneSet, metadataCompany?.phone);
	ensureArray(metadataCompany?.phoneLines ?? metadataCompany?.phones ?? metadataCompany?.telefonos).forEach((phone) =>
		collect(phoneSet, phone),
	);
	collect(phoneSet, companyState?.company_phone);

	collect(emailSet, activeSubsidiary?.email);
	collect(emailSet, branch?.branch_email);
	collect(emailSet, metadataCompany?.email);
	ensureArray(metadataCompany?.emails ?? metadataCompany?.contact_email).forEach((email) =>
		collect(emailSet, email),
	);
	collect(emailSet, companyState?.contact_email);

	ensureArray(
		metadataCompany?.bankInfo ??
			metadataCompany?.bank_info ??
			metadataCompany?.payment_instructions,
	).forEach((line) => collect(bankSet, line));

	collect(
		bankSet,
		companyState?.business_activity ? `Giro: ${companyState.business_activity}` : undefined,
	);

	const companyInfo: CompanyInfo = {
		name:
			normalizeText(activeSubsidiary?.name) ||
			normalizeText(metadataCompany?.name ?? metadataCompany?.razon_social) ||
			normalizeText(companyState?.company_name ?? companyState?.legal_name) ||
			fallbackCompanyInfo.name,
		tagline:
			normalizeText(metadataCompany?.tagline) ||
			normalizeText(companyState?.company_name) ||
			fallbackCompanyInfo.tagline,
		description:
			normalizeText(metadataCompany?.description) ||
			normalizeText(companyState?.business_activity) ||
			fallbackCompanyInfo.description,
		rut:
			normalizeText((activeSubsidiary as any)?.rut) ||
			normalizeText(metadataCompany?.rut ?? metadataCompany?.tax_number) ||
			normalizeText(companyState?.company_rut) ||
			fallbackCompanyInfo.rut,
		branch:
			normalizeText(metadataCompany?.branch ?? metadataCompany?.office) ||
			normalizeText(branch?.branch_name) ||
			normalizeText(
				branch?.commune?.name ? `S.I.I. - ${branch.commune.name}` : undefined,
			) ||
			fallbackCompanyInfo.branch,
		website:
			normalizeText(activeSubsidiary?.website) ||
			normalizeText(companyState?.company_website) ||
			normalizeText(metadataCompany?.website ?? metadataCompany?.url) ||
			fallbackCompanyInfo.website,
		addresses: addressSet.size ? Array.from(addressSet) : fallbackCompanyInfo.addresses,
		phoneLines: phoneSet.size ? Array.from(phoneSet) : fallbackCompanyInfo.phoneLines,
		emails: emailSet.size ? Array.from(emailSet) : fallbackCompanyInfo.emails,
		bankInfo: bankSet.size ? Array.from(bankSet) : fallbackCompanyInfo.bankInfo,
		documentLabel:
			normalizeText(metadataCompany?.document_label ?? metadataCompany?.documentLabel) ||
			fallbackCompanyInfo.documentLabel,
		logoUrl: extractLogoUrl(
			metadataCompany,
			activeSubsidiary as Record<string, any>,
			companyState as Record<string, any>,
		),
	};

	if (!companyInfo.branch && branch?.commune?.name) {
		companyInfo.branch = `S.I.I. - ${branch.commune.name}`;
	}

	return companyInfo;
};


const QuotePrintableView: React.FC<QuotePrintableViewProps> = ({ quote }) => {
	const items = quote.items ?? [];
	const totalsNetFromItems = items.reduce((sum, item) => sum + computeItemTotal(item), 0);
	const totalNet = parseNumber(
		quote.totals?.total_net ?? quote.total_net ?? quote.subtotal ?? totalsNetFromItems,
	);
	const discountAmount = parseNumber(quote.discount_amount ?? (quote as any).fixed_discount ?? 0);
	const taxRateInput = parseNumber(
		quote.totals?.tax_rate ?? quote.tax_rate ?? quote.tax_percentage ?? 0.19,
	);
	const normalizedTaxRate = taxRateInput > 1 && taxRateInput <= 2 ? taxRateInput - 1 : taxRateInput;
	const taxAmount = parseNumber(
		quote.totals?.tax_amount ??
			quote.total_tax ??
			quote.tax_amount ??
			(totalNet - discountAmount) * normalizedTaxRate,
	);
	const grandTotal = parseNumber(
		quote.totals?.grand_total ??
			quote.total_amount ??
			quote.subtotal ??
			totalNet - discountAmount + taxAmount,
	);

	const customerName =
		(quote.customer as any)?.billing_company ||
		(quote.customer as any)?.company_name ||
		(quote.customer as any)?.name ||
		(quote.customer as any)?.contact_name ||
		`Cliente #${quote.customer_id}`;

	const customerRut = (quote.customer as any)?.rut || (quote.customer as any)?.tax_number || '—';
	const customerEmail = (quote.customer as any)?.email || '—';
	const customerPhone = (quote.customer as any)?.phone || (quote.customer as any)?.mobile_phone || '—';
	const customerAddress =
		(quote.customer as any)?.address ||
		(quote.customer as any)?.billing_address ||
		(quote.customer as any)?.street ||
		'—';
	const customerCommune =
		(quote.customer as any)?.comuna ||
		(quote.customer as any)?.city ||
		(quote.customer as any)?.province ||
		'—';
	const customerBusiness = (quote.customer as any)?.giro || (quote.customer as any)?.business || '—';
	const contactName = (quote.customer as any)?.contact_name || customerName;

	const sellerInfo = (quote.metadata as any)?.seller ?? (quote.metadata as any)?.salesperson ?? {};
	const sellerName =
		sellerInfo.name ||
		(quote as any)?.salesperson_name ||
		(quote.salesperson_id ? `Vendedor #${quote.salesperson_id}` : '—');
	const sellerPhone = sellerInfo.phone || sellerInfo.mobile || (quote as any)?.salesperson_phone || '—';
	const sellerEmail = sellerInfo.email || (quote as any)?.salesperson_email || '—';

	const deliveryInfo =
		quote.metadata?.delivery_method || quote.metadata?.delivery_terms || quote.metadata?.delivery || 'Entrega inmediata';
	const paymentTermsText = quote.payment_terms ? `${quote.payment_terms} días` : '—';

	const companyInfo = buildCompanyInfo(quote);


	const detailRows = [
		{ label: 'Fecha emisión', value: formatDate(quote.quote_date) },
		{ label: 'Hora emisión', value: formatTime(quote.quote_date) },
		{ label: 'Válida hasta', value: formatDate(quote.expiry_date || (quote as any).valid_until) },
		{ label: 'Cond. de pago', value: paymentTermsText },
		{ label: 'Método de pago', value: quote.payment_method ?? 'Transferencia / Depósito' },
		{ label: 'Señor(es)', value: customerName },
		{ label: 'R.U.T.', value: customerRut },
		{ label: 'Contacto', value: contactName },
		{ label: 'Giro', value: customerBusiness },
		{ label: 'Dirección', value: customerAddress },
		{ label: 'Comuna', value: customerCommune },
		{ label: 'Correo', value: customerEmail },
		{ label: 'Teléfono', value: customerPhone },
		{ label: 'Orden de compra', value: quote.purchase_order ?? '—' },
		{ label: 'Cond. de entrega', value: deliveryInfo },
		{ label: 'Vendedor', value: sellerName },
		{ label: 'Contacto vendedor', value: sellerPhone },
		{ label: 'Email vendedor', value: sellerEmail },
	];

	const termsEntries = quote.metadata?.terms ?? quote.terms_conditions ?? {};
	const observationLines = [
		quote.notes ? `Notas: ${quote.notes}` : null,
		quote.internal_notes ? `Notas internas: ${quote.internal_notes}` : null,
		...Object.entries(termsEntries).map(([key, value]) => `${key}: ${String(value)}`),
	].filter(Boolean) as string[];

	return (
		<div className='mx-auto max-w-5xl rounded-xl border border-gray-300 bg-white p-8 text-sm text-gray-900 shadow-sm'>
			<header className='flex flex-col gap-6 border-b border-gray-300 pb-6 md:flex-row md:justify-between'>
				<div className='space-y-3'>
					{companyInfo.logoUrl && (
						<img src={companyInfo.logoUrl} alt={companyInfo.name} className='h-14 object-contain' />
					)}
					<div>
						<p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
							{companyInfo.tagline}
						</p>
						<h1 className='text-2xl font-bold uppercase tracking-wide text-gray-900'>{companyInfo.name}</h1>
					</div>
					{companyInfo.description && (
						<p className='max-w-3xl text-[12px] text-gray-600'>{companyInfo.description}</p>
					)}
					<div className='text-[12px] text-gray-700'>
						{companyInfo.addresses.map((line) => (
							<p key={line}>{line}</p>
						))}
						{!!companyInfo.website && <p>{companyInfo.website}</p>}
						{companyInfo.phoneLines.map((line) => (
							<p key={line}>{line}</p>
						))}
						{companyInfo.emails.map((line) => (
							<p key={line}>{line}</p>
						))}
					</div>
				</div>
				<div className='w-full max-w-xs rounded-lg border border-gray-900 p-4 text-center text-gray-900'>
					<p className='text-xs font-semibold uppercase text-gray-500'>R.U.T.</p>
					<p className='text-2xl font-bold tracking-wider'>{companyInfo.rut}</p>
					<div className='mt-4 border-t border-gray-200 pt-4'>
						<p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
							{companyInfo.documentLabel}
						</p>
						{/* <p className='text-lg font-bold'>N° {quote.quote_number ?? quote.id}</p> */}
						<p className='text-lg font-bold'>N° { quote.id}</p>

					</div>
					{companyInfo.branch && (
						<p className='mt-3 text-xs font-semibold uppercase tracking-wide'>{companyInfo.branch}</p>
					)}
				</div>
			</header>

			<section className='mt-6 border border-gray-200'>
				<div className='grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-2'>
					{detailRows.map((row) => (
						<div key={row.label} className='flex min-h-[48px] divide-x divide-gray-200'>
							<div className='w-1/2 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500'>
								{row.label}
							</div>
							<div className='w-1/2 px-3 py-2 text-[13px] text-gray-900'>{row.value || '—'}</div>
						</div>
					))}
				</div>
			</section>

			<section className='mt-8'>
				<div className='overflow-hidden border border-gray-300'>
					<table className='w-full table-fixed text-xs text-gray-900'>
						<thead className='bg-gray-50 text-[11px] uppercase tracking-wide text-gray-600'>
							<tr>
								<th className='border-b border-r border-gray-200 px-3 py-2 text-left'>Código</th>
								<th className='border-b border-r border-gray-200 px-3 py-2 text-right'>Cantidad</th>
								<th className='border-b border-r border-gray-200 px-3 py-2 text-left'>Descripción</th>
								<th className='border-b border-r border-gray-200 px-3 py-2 text-left'>Garantía</th>
								<th className='border-b border-gray-200 px-3 py-2 text-right'>Unitario (neto)</th>
								<th className='border-b border-l border-gray-200 px-3 py-2 text-right'>Total (neto)</th>
							</tr>
						</thead>
						<tbody>
							{items.length === 0 ? (
								<tr>
									<td colSpan={6} className='px-4 py-6 text-center text-sm text-gray-500'>
										Esta cotización aún no tiene ítems cargados.
									</td>
								</tr>
							) : (
								items.map((item, index) => (
									<tr key={item.id ?? index} className='border-t border-gray-200'>
										<td className='px-3 py-2 align-top text-[13px] font-medium text-gray-800'>
											{item.customer_sku || item.product?.sku || '—'}
										</td>
										<td className='px-3 py-2 text-right text-[13px]'>{item.quantity}</td>
										<td className='px-3 py-2 text-left text-[13px]'>
											<p className='font-semibold text-gray-900'>
												{item.customer_name || item.product?.name || 'Ítem sin nombre'}
											</p>
											{item.description && <p className='text-[11px] text-gray-600'>{item.description}</p>}
										</td>
										<td className='px-3 py-2 text-[13px] text-gray-800'>
											{(item.metadata as any)?.warranty || (item as any).warranty || '—'}
										</td>
										<td className='px-3 py-2 text-right text-[13px]'>
											{formatCurrency(item.unit_price)}
										</td>
										<td className='px-3 py-2 text-right text-[13px] font-semibold text-gray-900'>
											{formatCurrency(item.total_net ?? computeItemTotal(item))}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>

			<section className='mt-8 flex flex-col gap-6 md:flex-row'>
				<div className='flex-1 rounded-lg border border-gray-300 p-4'>
					<h3 className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Observaciones</h3>
					<div className='mt-3 space-y-2 text-[13px] text-gray-800'>
						{observationLines.length === 0 ? (
							<p>Sin observaciones adicionales.</p>
						) : (
							observationLines.map((line) => <p key={line}>{line}</p>)
						)}
					</div>
					{companyInfo.bankInfo.length > 0 && (
						<div className='mt-4 space-y-1 text-[13px] text-gray-800'>
							{companyInfo.bankInfo.map((line) => (
								<p key={line}>{line}</p>
							))}
						</div>
					)}
				</div>
				<div className='w-full rounded-lg border border-gray-300 text-sm md:w-80'>
					<div className='flex justify-between border-b border-gray-200 px-4 py-3'>
						<span>Subtotal (neto)</span>
						<span>{formatCurrency(totalNet)}</span>
					</div>
					<div className='flex justify-between border-b border-gray-200 px-4 py-3'>
						<span>Descuentos</span>
						<span>- {formatCurrency(discountAmount)}</span>
					</div>
					<div className='flex justify-between border-b border-gray-200 px-4 py-3'>
						<span>IVA ({Math.round(normalizedTaxRate * 100)}%)</span>
						<span>{formatCurrency(taxAmount)}</span>
					</div>
					<div className='flex items-center justify-between rounded-b-lg bg-gray-50 px-4 py-4 text-lg font-bold text-gray-900'>
						<span>Total</span>
						<span>{formatCurrency(grandTotal)}</span>
					</div>
				</div>
			</section>

			<footer className='mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500'>
				Documento generado automáticamente desde Zentria ERP.
			</footer>
		</div>
	);
};

export default QuotePrintableView;
