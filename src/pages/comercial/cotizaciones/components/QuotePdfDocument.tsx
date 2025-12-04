import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { IQuote } from '@/interface';
import {
	getCustomerInfo,
	resolveUnitPrice,
	resolveLineTotal,
	getProductSku,
	getProductName,
	getProductDetail,
	formatCurrency,
	formatDate,
	getPaymentMethodsLabel,
} from './quote-data-mapper';

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
		justifyContent: 'center',
	},
	logo: { width: 150, height: 50, objectFit: 'contain' },
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
	docTypeTitle: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#e11d48',
		textTransform: 'uppercase',
	},
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
	totalsSection: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 10,
		marginBottom: 20,
	},
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
	sectionTitle: {
		fontSize: 9,
		fontWeight: 'bold',
		marginBottom: 4,
		textTransform: 'uppercase',
		textDecoration: 'underline',
	},
	noteText: { fontSize: 8, color: '#4b5563', marginBottom: 2 },
	pageNumber: { marginTop: 10, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
});

// Define the shape of the company object returned by getCompanyInfo
interface CompanyInfo {
    name: string;
    rut: string;
    activity: string;
    fullAddress: string;
    email: string;
    phone: string;
    website: string;
    logoUrl: string | null;
    bankInfo: string[];
    allowedPaymentMethods: string[];
    deliveryTerm: string;
    quoteValidityText: string;
    quoteValidityDays: number | null;
    commercialTerms: string;
}

interface QuotePdfDocumentProps {
    quote: IQuote;
    company: CompanyInfo;
    logoBase64?: string | null;
}

const QuotePdfDocument = ({ quote, company, logoBase64 }: QuotePdfDocumentProps) => {
    // Prefetch attempts to return base64, but fallback to company logo url if necessary
	const logoSrc = logoBase64 || company.logoUrl || null;

	if (logoSrc) {
		const preview = String(logoSrc).startsWith('data:')
			? logoSrc.substring(0, 80)
			: logoSrc;
		console.log('[QuotePdfDocument] usando logoSrc:', preview);
	} else {
		console.log('[QuotePdfDocument] SIN logoSrc, company.logoUrl:', company.logoUrl);
	}


	const items = Array.isArray(quote.items) ? quote.items : [];
	const customer = getCustomerInfo((quote as any).customer);

	const netTotal = Number(
		(quote as any).subtotal ??
			(quote as any).total_net ??
			0,
	);
	const discount = Number(
		(quote as any).discount_amount ??
			(quote as any).fixed_discount ??
			0,
	);
	const tax = Number(
		(quote as any).tax_amount ??
			(quote as any).total_tax ??
			0,
	);
	const total = Number((quote as any).total_amount ?? 0);
	const paymentMethodsLabel = getPaymentMethodsLabel(company.allowedPaymentMethods as string[]);

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
							{/* Removed redundant company name text when logo is present */}
							<Text style={styles.companyLine}>Giro: {company.activity}</Text>
							<Text style={styles.companyLine}>
								Dirección: {company.fullAddress || '—'}
							</Text>
							<Text style={styles.companyLine}>
								Email: {company.email || '—'} • Fono: {company.phone || '—'}
							</Text>
							{company.website && (
								<Text style={styles.companyLine}>Web: {company.website}</Text>
							)}
						</View>

						<View style={styles.rutBoxContainer}>
							<View style={styles.rutBox}>
								<Text style={styles.rutText}>R.U.T.: {company.rut}</Text>
								<View style={styles.docTypeBox}>
									<Text style={styles.docTypeTitle}>COTIZACIÓN</Text>
								</View>
								<Text style={styles.docNumber}>N° {quote.id}</Text>
							</View>
							<Text style={styles.dateLine}>
								Fecha: {formatDate(quote.quote_date)}
							</Text>
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
								{customer.name}
							</Text>
							<Text style={[styles.clientLabel, { width: 30, textAlign: 'right' }]}>
								RUT:
							</Text>
							<Text style={[styles.clientValue, { flex: 0.4, textAlign: 'right' }]}>
								{customer.rut}
							</Text>
						</View>
						<View style={styles.clientRow}>
							<Text style={styles.clientLabel}>Dirección:</Text>
							<Text style={styles.clientValue}>{customer.address}</Text>
						</View>
						<View style={styles.clientRow}>
							<Text style={styles.clientLabel}>Giro:</Text>
							<Text style={styles.clientValue}>{customer.giro}</Text>
						</View>
						<View style={styles.clientRow}>
							<Text style={styles.clientLabel}>Contacto:</Text>
							<Text style={styles.clientValue}>{customer.contactName}</Text>
							<Text style={[styles.clientLabel, { width: 40, textAlign: 'right' }]}>
								Fono:
							</Text>
							<Text style={[styles.clientValue, { flex: 0.6, textAlign: 'right' }]}>
								{customer.phone}
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
						const sku = getProductSku(item);
						const name = getProductName(item);
						const detail = getProductDetail(item);
						const quantity = Number((item as any).quantity || 0);
						const unitPrice = resolveUnitPrice(item);
						const lineTotal = resolveLineTotal(item);
						const itemDiscount = Number(item.discount_amount || 0);

						return (
							<View key={index} style={styles.tableRow}>
								<Text style={styles.colCant}>{quantity}</Text>
								<Text style={styles.colCode}>{sku}</Text>
								<View style={styles.colDesc}>
									<Text style={styles.boldText}>{name}</Text>
									{detail && (
										<Text style={{ fontSize: 7, color: '#6b7280' }}>
											{detail}
										</Text>
									)}
									{itemDiscount > 0 && (
										<Text style={{ fontSize: 7, color: '#e11d48' }}>
											Descuento: - {formatCurrency(itemDiscount)}
										</Text>
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
								<Text style={[styles.boldText, { fontSize: 11 }]}>
									{formatCurrency(total)}
								</Text>
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
									(company.quoteValidityDays
										? `${company.quoteValidityDays} días hábiles`
										: '7 días hábiles')}
							</Text>
							<Text style={styles.noteText}>
								• Forma de Pago: {paymentMethodsLabel}
							</Text>
							<Text style={styles.noteText}>
								• Entrega:{' '}
								{company.deliveryTerm || 'A convenir o retiro en tienda.'}
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
