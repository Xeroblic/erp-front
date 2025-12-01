import React, { useEffect, useState } from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { IQuote, ISubempresa } from '@/interface';
import store from '@/store';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';

const logoDataCache = new Map<string, string>();

const fetchImageAsDataUrl = async (url: string): Promise<string | null> => {
	try {
		const response = await fetch(url, { mode: 'cors' });
		if (!response.ok) return null;
		const blob = await response.blob();
		return await new Promise((resolve) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = () => resolve(null);
			reader.readAsDataURL(blob);
		});
	} catch (err) {
		console.warn('[QuotePdfDocument] No se pudo cargar el logo:', err);
		return null;
	}
};

const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontFamily: 'Helvetica',
		fontSize: 9,
		color: '#1f2937',
		lineHeight: 1.3,
		flexDirection: 'column',
	},
	mainContent: { flex: 1 },
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	headerLeft: { width: '60%' },
	logoContainer: {
		height: 50,
		marginBottom: 8,
		alignItems: 'flex-start',
		justifyContent: 'center',
	},
	logo: { height: '100%', objectFit: 'contain', alignSelf: 'flex-start' },
	companyName: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
	companyLine: { fontSize: 9, color: '#374151' },
	rutBoxContainer: { width: '36%', alignItems: 'center' },
	rutBox: {
		borderWidth: 2,
		borderColor: '#e11d48',
		width: '100%',
		alignItems: 'center',
		paddingVertical: 8,
	},
	rutText: { fontSize: 12, fontWeight: 'bold', color: '#e11d48' },
	docTypeBox: {
		marginVertical: 4,
		width: '100%',
		backgroundColor: '#fff1f2',
		alignItems: 'center',
		paddingVertical: 2,
	},
	docTypeTitle: { fontSize: 12, fontWeight: 'bold', color: '#e11d48', textTransform: 'uppercase' },
	docNumber: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
	dateLine: { marginTop: 5, fontSize: 10, fontWeight: 'bold', color: '#111827' },
	clientSection: {
		borderWidth: 1,
		borderColor: '#d1d5db',
		padding: 8,
		marginBottom: 20,
		backgroundColor: '#f9fafb',
	},
	clientRow: { flexDirection: 'row', marginBottom: 2 },
	clientLabel: { width: 60, fontWeight: 'bold', fontSize: 8 },
	clientValue: { flex: 1, fontSize: 8 },
	boldText: { fontWeight: 'bold' },
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: '#f3f4f6',
		borderBottomWidth: 1,
		borderColor: '#d1d5db',
		borderTopWidth: 1,
		paddingVertical: 6,
	},
	tableRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderColor: '#e5e7eb',
		paddingVertical: 6,
	},
	colCant: { width: '8%', textAlign: 'center' },
	colCode: { width: '17%', textAlign: 'left', paddingLeft: 4 },
	colDesc: { width: '45%', textAlign: 'left', paddingLeft: 4 },
	colPrice: { width: '15%', textAlign: 'right', paddingRight: 4 },
	colTotal: { width: '15%', textAlign: 'right', paddingRight: 4 },
	totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, marginBottom: 20 },
	totalsTable: { width: 180 },
	totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
	grandTotalBox: {
		borderTopWidth: 1,
		borderColor: '#000',
		marginTop: 4,
		paddingTop: 4,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	footerContent: { borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 10 },
	twoColumnFooter: { flexDirection: 'row', gap: 20 },
	footerCol: { flex: 1 },
	sectionTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase', textDecoration: 'underline' },
	noteText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },
	pageNumber: { marginTop: 10, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
});

const formatCurrency = (val: unknown) =>
	new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(val) || 0);

const formatDate = (val?: string | null) => (val ? new Date(val).toLocaleDateString('es-CL') : '—');

const getPersonalizedSubsidiary = (quote: IQuote): ISubempresa | undefined => {
	const state = store.getState() as any;
	const personalization = state.personalizacion?.personalizacionUsuario;
	const personalizationSubId = personalization?.subsidiary_id;
	const currentCompanySubs = state.personalizacion?.current_company?.subsidiaries;

	if (Array.isArray(currentCompanySubs) && personalizationSubId) {
		const match = currentCompanySubs.find(
			(sub: any) => Number(sub.id) === Number(personalizationSubId),
		);
		if (match) return match as ISubempresa;
	}

	const subsidiaries = (state.subEmpresa?.lista || []) as ISubempresa[];
	return subsidiaries.find((s) => Number(s.id) === Number(personalizationSubId ?? quote.subsidiary_id));
};

const getCompanyInfo = (quote: IQuote) => {
	const state = store.getState() as any;
	const mainCompany = state.empresa?.miEmpresa;
	const quoteSubsidiary = (quote as any)?.subsidiary as Partial<ISubempresa> | undefined;
	const activeSub =
		getPersonalizedSubsidiary(quote) ||
		(quoteSubsidiary && Number(quoteSubsidiary.id) === Number(quote.subsidiary_id)
			? quoteSubsidiary
			: undefined);

	const meta = (quote as any)?.metadata?.company || {};

	const logoRaw =
		meta.logo_base_64 ||
		meta.logo_url ||
		meta.logo ||
		(activeSub as any)?.logo_base_64 ||
		(activeSub as any)?.logo_url ||
		(mainCompany as any)?.company_logo;
	const logoUrl =
		logoRaw && String(logoRaw).startsWith('data:')
			? logoRaw
			: ensureAbsoluteUrl(logoRaw || undefined) || logoRaw || null;

	const name = meta.name || activeSub?.subsidiary_name || mainCompany?.company_name || 'EcoTI';
	const rut = meta.rut || activeSub?.subsidiary_rut || mainCompany?.company_rut || '—';
	const activity =
		meta.activity || activeSub?.subsidiary_giro || mainCompany?.business_activity || 'Venta de artículos computacionales';

	const addressBase =
		meta.address || (activeSub as any)?.subsidiary_address || mainCompany?.company_address || '';
	const communeName =
		meta.commune ||
		(activeSub as any)?.commune?.name ||
		(activeSub as any)?.commune_name ||
		'';
	const fullAddress =
		communeName && addressBase && !addressBase.includes(communeName)
			? `${addressBase}, ${communeName}`
			: addressBase || communeName;

	const email = meta.email || activeSub?.subsidiary_email || mainCompany?.contact_email || '';
	const phone = meta.phone || activeSub?.subsidiary_phone || mainCompany?.company_phone || '';
	const website = meta.website || activeSub?.subsidiary_website || mainCompany?.company_website || '';

	const bankData =
		(meta.bank_info as any) ?? (activeSub as any)?.bank_info ?? (mainCompany as any)?.bank_info;
	const bankInfo = Array.isArray(bankData)
		? bankData.map(String)
		: bankData
			? [String(bankData)]
			: [];
	const extraBank = meta.bank_details || (activeSub as any)?.subsidiary_bank_details;
	if (extraBank) bankInfo.push(String(extraBank));

	const allowedPaymentMethods =
		meta.allowed_payment_methods ||
		(activeSub as any)?.subsidiary_allowed_payment_methods ||
		meta.payment_methods ||
		[];
	const deliveryTerm = meta.delivery_term || (activeSub as any)?.subsidiary_delivery_term;
	const quoteValidityText =
		meta.quote_validity_text || (activeSub as any)?.subsidiary_quote_validity_text || '';
	const quoteValidityDays =
		meta.quote_validity_days || (activeSub as any)?.subsidiary_quote_validity_days || null;
	const commercialTerms =
		meta.commercial_terms || (activeSub as any)?.subsidiary_commercial_terms || '';

	return {
		name,
		rut,
		activity,
		fullAddress,
		email,
		phone,
		website,
		logoUrl,
		bankInfo,
		allowedPaymentMethods,
		deliveryTerm,
		quoteValidityText,
		quoteValidityDays,
		commercialTerms,
	};
};

const QuotePdfDocument = ({ quote }: { quote: IQuote }) => {
	const company = getCompanyInfo(quote);
	const [logoSrc, setLogoSrc] = useState<string | null>(company.logoUrl);

	useEffect(() => {
		let cancelled = false;
		const loadLogo = async () => {
			if (!company.logoUrl) {
				setLogoSrc(null);
				return;
			}
			const existing = logoDataCache.get(company.logoUrl);
			if (existing) {
				setLogoSrc(existing);
				return;
			}
			const data = await fetchImageAsDataUrl(company.logoUrl);
			if (!cancelled) {
				const finalSrc = data || company.logoUrl;
				logoDataCache.set(company.logoUrl, finalSrc);
				setLogoSrc(finalSrc);
			}
		};
		void loadLogo();
		return () => {
			cancelled = true;
		};
	}, [company.logoUrl]);

	const items = quote.items || [];
	const customer = (quote as any).customer || {};

	const resolveUnitPrice = (item: any) =>
		Number(item.unit_price ?? item.price ?? item.unit_price_net ?? 0);
	const resolveLineTotal = (item: any) =>
		Number(item.total ?? item.line_total ?? item.subtotal ?? item.line_net ?? 0);

	const netTotal = items.reduce((acc, item) => acc + resolveLineTotal(item), 0);
	const discount = Number(quote.discount_amount || 0);
	const tax = Number(quote.tax_amount || (quote as any).total_tax || 0);
	const total = Number(quote.total_amount || netTotal + tax - discount);
	const paymentMethodsLabel =
		Array.isArray(company.allowedPaymentMethods) && company.allowedPaymentMethods.length > 0
			? (company.allowedPaymentMethods as string[]).join(' / ')
			: 'Contado / Transferencia / WebPay';

	return (
		<Document>
			<Page size='LETTER' style={styles.page}>
				<View style={styles.mainContent}>
					<View style={styles.headerRow}>
						<View style={styles.headerLeft}>
							<View style={styles.logoContainer}>
								{logoSrc ? (
									<Image style={styles.logo} src={logoSrc} />
								) : (
									<Text
										style={{
											fontSize: 18,
											fontWeight: 'bold',
											textTransform: 'uppercase',
										}}>
										{company.name}
									</Text>
								)}
							</View>
							{logoSrc && <Text style={styles.companyName}>{company.name}</Text>}
							<Text style={styles.companyLine}>Giro: {company.activity}</Text>
							<Text style={styles.companyLine}>Dirección: {company.fullAddress || '—'}</Text>
							<Text style={styles.companyLine}>
								Email: {company.email || '—'} • Fono: {company.phone || '—'}
							</Text>
							{company.website && <Text style={styles.companyLine}>Web: {company.website}</Text>}
						</View>

						<View style={styles.rutBoxContainer}>
							<View style={styles.rutBox}>
								<Text style={styles.rutText}>R.U.T.: {company.rut}</Text>
								<View style={styles.docTypeBox}>
									<Text style={styles.docTypeTitle}>COTIZACIÓN</Text>
								</View>
								<Text style={styles.docNumber}>N° {quote.id}</Text>
							</View>
							<Text style={styles.dateLine}>Fecha: {formatDate(quote.quote_date)}</Text>
						</View>
					</View>

					<View style={styles.clientSection}>
						<View style={styles.clientRow}>
							<Text style={styles.clientLabel}>Señor(es):</Text>
							<Text
								style={[
									styles.clientValue,
									styles.boldText,
									{ textTransform: 'uppercase' },
								]}>
								{customer.razon_social || customer.name || 'Cliente General'}
							</Text>
							<Text style={[styles.clientLabel, { width: 30, textAlign: 'right' }]}>
								RUT:
							</Text>
							<Text style={[styles.clientValue, { flex: 0.4, textAlign: 'right' }]}>
								{customer.rut || '—'}
							</Text>
						</View>
						<View style={styles.clientRow}>
							<Text style={styles.clientLabel}>Dirección:</Text>
							<Text style={styles.clientValue}>{customer.address || '—'}</Text>
						</View>
						<View style={styles.clientRow}>
							<Text style={styles.clientLabel}>Giro:</Text>
							<Text style={styles.clientValue}>{customer.giro || '—'}</Text>
						</View>
						<View style={styles.clientRow}>
							<Text style={styles.clientLabel}>Contacto:</Text>
							<Text style={styles.clientValue}>{customer.contact_name || '—'}</Text>
							<Text style={[styles.clientLabel, { width: 40, textAlign: 'right' }]}>
								Fono:
							</Text>
							<Text style={[styles.clientValue, { flex: 0.6, textAlign: 'right' }]}>
								{customer.phone || '—'}
							</Text>
						</View>
					</View>

					<View style={styles.tableHeader}>
						<Text style={[styles.colCant, styles.boldText]}>Cant.</Text>
						<Text style={[styles.colCode, styles.boldText]}>Código</Text>
						<Text style={[styles.colDesc, styles.boldText]}>Descripción</Text>
						<Text style={[styles.colPrice, styles.boldText]}>P. Neto</Text>
						<Text style={[styles.colTotal, styles.boldText]}>Total</Text>
					</View>

					{items.map((item, index) => {
						const sku =
							(item as any)?.product?.sku ||
							(item as any)?.customer_sku ||
							(item as any)?.meta_json?.mapping?.sku ||
							'—';
						const name =
							(item as any)?.product?.name ||
							(item as any)?.customer_name ||
							(item as any)?.name ||
							'Producto sin nombre';
						const unitPrice = resolveUnitPrice(item);
						const lineTotal = resolveLineTotal(item) || unitPrice * Number(item.quantity || 0);

						return (
							<View key={index} style={styles.tableRow}>
								<Text style={styles.colCant}>{item.quantity}</Text>
								<Text style={styles.colCode}>{sku}</Text>
								<View style={styles.colDesc}>
									<Text style={styles.boldText}>{name}</Text>
									{item.description && (
										<Text style={{ fontSize: 7, color: '#6b7280' }}>{item.description}</Text>
									)}
								</View>
								<Text style={styles.colPrice}>{formatCurrency(unitPrice)}</Text>
								<Text style={[styles.colTotal, styles.boldText]}>
									{formatCurrency(lineTotal)}
								</Text>
							</View>
						);
					})}

					<View style={styles.totalsSection}>
						<View style={styles.totalsTable}>
							<View style={styles.totalRow}>
								<Text style={styles.boldText}>Total Neto:</Text>
								<Text>{formatCurrency(netTotal)}</Text>
							</View>
							{discount > 0 && (
								<View style={styles.totalRow}>
									<Text style={styles.boldText}>Descuento:</Text>
									<Text>- {formatCurrency(discount)}</Text>
								</View>
							)}
							<View style={styles.totalRow}>
								<Text style={styles.boldText}>I.V.A.:</Text>
								<Text>{formatCurrency(tax)}</Text>
							</View>
							<View style={styles.grandTotalBox}>
								<Text style={[styles.boldText, { fontSize: 11 }]}>TOTAL:</Text>
								<Text style={[styles.boldText, { fontSize: 11 }]}>{formatCurrency(total)}</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={styles.footerContent}>
					<View style={styles.twoColumnFooter}>
						<View style={styles.footerCol}>
							<Text style={styles.sectionTitle}>Condiciones Comerciales</Text>
							<Text style={styles.noteText}>
								• Validez Oferta:{' '}
								{company.quoteValidityText ||
									(company.quoteValidityDays ? `${company.quoteValidityDays} días hábiles` : '7 días hábiles')}
							</Text>
							<Text style={styles.noteText}>
								• Forma de Pago: {paymentMethodsLabel}
							</Text>
							<Text style={styles.noteText}>
								• Entrega: {company.deliveryTerm || 'A convenir o retiro en tienda.'}
							</Text>
							{company.commercialTerms ? (
								<Text style={styles.noteText}>• {company.commercialTerms}</Text>
							) : null}

							{quote.notes && (
								<View style={{ marginTop: 6 }}>
									<Text style={styles.sectionTitle}>Observaciones</Text>
									<Text style={styles.noteText}>{quote.notes}</Text>
								</View>
							)}
						</View>

						<View style={styles.footerCol}>
							{company.bankInfo.length > 0 && (
								<View>
									<Text style={styles.sectionTitle}>Datos Bancarios</Text>
									{company.bankInfo.map((info: string, idx: number) => (
										<Text key={idx} style={styles.noteText}>
											{info}
										</Text>
									))}
								</View>
							)}
						</View>
					</View>

					<Text style={styles.pageNumber}>
						Documento generado electrónicamente por {company.name}
					</Text>
				</View>
			</Page>
		</Document>
	);
};

export default QuotePdfDocument;
