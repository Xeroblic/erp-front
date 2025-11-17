import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { IQuote, IQuoteItem } from '../../../../interface/quotes.interface';

const styles = StyleSheet.create({
	page: {
		padding: 32,
		fontSize: 10,
		fontFamily: 'Helvetica',
		color: '#1f2937',
	},
	section: {
		marginBottom: 16,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	label: {
		color: '#6b7280',
		fontSize: 9,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	value: {
		fontSize: 10,
		color: '#111827',
	},
	table: {
		flexDirection: 'column',
		borderStyle: 'solid',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRightWidth: 0,
		borderBottomWidth: 0,
	},
	tableRow: {
		flexDirection: 'row',
	},
	tableCol: {
		flex: 1,
		borderStyle: 'solid',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderLeftWidth: 0,
		borderTopWidth: 0,
		padding: 6,
	},
	tableHeader: {
		backgroundColor: '#f3f4f6',
		color: '#374151',
		fontWeight: 'bold',
		textTransform: 'uppercase',
		fontSize: 9,
	},
	tableCell: {
		fontSize: 10,
		color: '#111827',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#111827',
	},
	subtitle: {
		fontSize: 12,
		color: '#6b7280',
		marginTop: 4,
	},
	footer: {
		marginTop: 20,
		fontSize: 9,
		color: '#6b7280',
		textAlign: 'center',
	},
});

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

const QuotePdfDocument: React.FC<{ quote: IQuote }> = ({ quote }) => {
	const items = quote.items ?? [];
	const totalNet =
		parseNumber(quote.totals?.total_net) ||
		parseNumber(quote.total_net ?? quote.subtotal) ||
		items.reduce((sum, item) => sum + computeItemTotal(item), 0);
	const discountAmount =
		parseNumber(quote.discount_amount) ||
		parseNumber((quote as any).fixed_discount) ||
		0;
	const taxRateInput =
		parseNumber(quote.totals?.tax_rate) ||
		parseNumber(quote.tax_rate ?? quote.tax_percentage) ||
		0.19;
	const normalizedTaxRate =
		taxRateInput > 1 && taxRateInput <= 2 ? taxRateInput - 1 : taxRateInput;
	const taxAmount =
		parseNumber(quote.totals?.tax_amount) ||
		parseNumber(quote.total_tax ?? quote.tax_amount) ||
		(totalNet - discountAmount) * normalizedTaxRate;
	const grandTotal =
		parseNumber(quote.totals?.grand_total) ||
		parseNumber(quote.total_amount) ||
		totalNet - discountAmount + taxAmount;

	const customerName =
		(quote.customer as any)?.billing_company ||
		(quote.customer as any)?.company_name ||
		(quote.customer as any)?.name ||
		(quote.customer as any)?.contact_name ||
		`Cliente #${quote.customer_id}`;

	const customerRut = (quote.customer as any)?.rut || (quote.customer as any)?.tax_number || '—';
	const customerEmail = (quote.customer as any)?.email || '—';
	const customerPhone = (quote.customer as any)?.phone || (quote.customer as any)?.mobile_phone || '—';

	return (
		<Document>
			<Page size='A4' style={styles.page}>
				<View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
					<View>
						<Text style={styles.title}>Cotización</Text>
						<Text style={styles.subtitle}>
							{quote.quote_number ?? `ID #${quote.id}`}
						</Text>
					</View>
					<View style={{ alignItems: 'flex-end' }}>
						<Text style={styles.label}>Estado</Text>
						<Text style={styles.value}>{quote.status}</Text>
						<Text style={[styles.label, { marginTop: 4 }]}>Fecha</Text>
						<Text style={styles.value}>{formatDate(quote.quote_date)}</Text>
					</View>
				</View>

			<View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between' }]}>
				<View>
					<Text style={styles.label}>Cliente</Text>
					<Text style={styles.value}>{customerName}</Text>
					<Text style={styles.value}>RUT: {customerRut}</Text>
					<Text style={styles.value}>Email: {customerEmail}</Text>
					<Text style={styles.value}>Teléfono: {customerPhone}</Text>
				</View>
				<View>
					<Text style={styles.label}>Válida Hasta</Text>
					<Text style={styles.value}>
						{formatDate(quote.expiry_date || (quote as any).valid_until)}
					</Text>
					<Text style={[styles.label, { marginTop: 4 }]}>Método de Pago</Text>
					<Text style={styles.value}>{quote.payment_method ?? 'No especificado'}</Text>
				</View>
			</View>

			<View style={styles.section}>
				<View style={styles.table}>
					<View style={[styles.tableRow, styles.tableHeader]}>
						<View style={styles.tableCol}>
							<Text>Descripción</Text>
						</View>
						<View style={styles.tableCol}>
							<Text>SKU</Text>
						</View>
						<View style={[styles.tableCol, { flex: 0.6 }]}>
							<Text>Cant.</Text>
						</View>
						<View style={[styles.tableCol, { flex: 0.9 }]}>
							<Text>Unitario</Text>
						</View>
						<View style={[styles.tableCol, { flex: 1 }]}>
							<Text>Total</Text>
						</View>
					</View>
					{items.length === 0 ? (
						<View style={styles.tableRow}>
							<View style={[styles.tableCol, { flex: 5 }]}>
								<Text style={styles.tableCell}>Sin ítems</Text>
							</View>
						</View>
					) : (
						items.map((item, index) => (
							<View key={item.id ?? index} style={styles.tableRow}>
								<View style={[styles.tableCol, { flex: 2 }]}>
									<Text style={styles.tableCell}>
										{item.customer_name || item.product?.name || 'Ítem'}
									</Text>
								</View>
								<View style={styles.tableCol}>
									<Text style={styles.tableCell}>
										{item.customer_sku || item.product?.sku || '—'}
									</Text>
								</View>
								<View style={[styles.tableCol, { flex: 0.6 }]}>
									<Text style={styles.tableCell}>{item.quantity}</Text>
								</View>
								<View style={[styles.tableCol, { flex: 0.9 }]}>
									<Text style={styles.tableCell}>
										{formatCurrency(item.unit_price)}
									</Text>
								</View>
								<View style={[styles.tableCol, { flex: 1 }]}>
									<Text style={styles.tableCell}>
										{formatCurrency(item.total_net ?? computeItemTotal(item))}
									</Text>
								</View>
							</View>
						))
					)}
				</View>
			</View>

			<View style={styles.section}>
				<View style={styles.row}>
					<Text style={styles.label}>Subtotal</Text>
					<Text style={styles.value}>{formatCurrency(totalNet)}</Text>
				</View>
				<View style={styles.row}>
					<Text style={styles.label}>Descuentos</Text>
					<Text style={styles.value}>- {formatCurrency(discountAmount)}</Text>
				</View>
				<View style={styles.row}>
					<Text style={styles.label}>IVA ({Math.round(normalizedTaxRate * 100)}%)</Text>
					<Text style={styles.value}>{formatCurrency(taxAmount)}</Text>
				</View>
				<View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 }]}>
					<Text style={[styles.value, { fontSize: 12, fontWeight: 'bold' }]}>Total</Text>
					<Text style={[styles.value, { fontSize: 12, fontWeight: 'bold' }]}>
						{formatCurrency(grandTotal)}
					</Text>
				</View>
			</View>

			<View style={styles.footer}>
				<Text>Documento generado automáticamente - Zentria ERP</Text>
			</View>
		</Page>
	</Document>
	);
};

export const generateQuotePdf = async (quote: IQuote) => {
	const instance = pdf(<QuotePdfDocument quote={quote} />);
	return instance.toBlob();
};

export default QuotePdfDocument;
