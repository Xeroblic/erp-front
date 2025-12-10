import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { IQuote } from '@/interface';
import {
	getDocumentType,
	getQuoteTotals,
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

const HEADER_HEIGHT = 90;
const FOOTER_HEIGHT = 150;
const CONTENT_MARGIN = 8;

const styles = StyleSheet.create({
	page: {
		padding: 36,
		fontFamily: 'Helvetica',
		fontSize: 9,
		color: '#111827',
		lineHeight: 1.3,
		flexDirection: 'column',
	},
	header: {
		position: 'absolute',
		top: 36,
		left: 36,
		right: 36,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	headerLeft: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	logoBox: {
		width: 100,
		height: 100,
		borderWidth: 1,
		borderColor: '#e5e7eb',
		padding: 6,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
		marginTop: -22,
	},
	logo: {
		width: '160%',
		height: '160%',
		objectFit: 'contain',
	},
	companyInfo: {
		flex: 1,
		fontSize: 9,
		marginLeft: 20,
	},
	companyName: {
		fontSize: 9,
		fontWeight: 'bold',
		textTransform: 'uppercase',
		marginBottom: 2,
	},
	rutBoxContainer: {
		width: '36%',
		alignItems: 'center',
	},
	rutBox: {
		borderWidth: 2,
		borderColor: '#e11d48',
		width: '100%',
		alignItems: 'center',
		paddingVertical: 6,
	},
	rutText: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#e11d48',
	},
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
	docNumber: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#111827',
	},
	dateLine: {
		marginTop: 6,
		fontSize: 10,
		fontWeight: 'bold',
		color: '#111827',
	},

	// BLOQUE EMPRESA / ORDEN
	companyOrderBox: {
		borderWidth: 2,
		borderColor: '#e11d48',
		marginBottom: 10,
	},
	companyOrderHeader: {
		backgroundColor: '#fff1f2',
		paddingHorizontal: 10,
		paddingVertical: 4,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	companyOrderHeaderText: {
		fontSize: 9,
		fontWeight: 'bold',
		color: '#9f1239',
	},
	companyOrderBody: {
		flexDirection: 'row',
		borderTopWidth: 1,
		borderTopColor: '#e5e7eb',
	},
	companyOrderColLeft: {
		width: '50%',
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	companyOrderColRight: {
		width: '50%',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderLeftWidth: 1,
		borderLeftColor: '#e5e7eb',
	},
	infoRow: {
		marginBottom: 2,
		flexDirection: 'row',
	},
	infoLabel: {
		fontSize: 8,
		fontWeight: 'bold',
	},
	infoValue: {
		fontSize: 8,
	},

	// TABLA
	tableOuter: {
		borderWidth: 2,
		borderColor: '#374151',
		marginBottom: 6,
		minHeight: 160,
	},
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: '#f3f4f6',
		borderBottomWidth: 2,
		borderBottomColor: '#374151',
		paddingVertical: 4,
	},
	tableHeaderCell: {
		fontSize: 9,
		fontWeight: 'bold',
	},
	tableRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#9ca3af',
		borderStyle: 'dashed',
		paddingVertical: 4,
		minHeight: 12,
		alignItems: 'center',
	},
	colCant: { width: '8%', textAlign: 'center' },
	colCode: { width: '17%', textAlign: 'left', paddingLeft: 4 },
	colDesc: { width: '45%', textAlign: 'left', paddingLeft: 4 },
	colPrice: { width: '15%', textAlign: 'right', paddingRight: 4 },
	colTotal: { width: '15%', textAlign: 'right', paddingRight: 4 },

	descName: { fontWeight: 'bold', fontSize: 9 },
	descDetail: { fontSize: 7, color: '#6b7280' },
	descDiscount: { fontSize: 7, color: '#e11d48', fontWeight: 'bold' },

	content: {
		marginTop: HEADER_HEIGHT + CONTENT_MARGIN,
		marginBottom: FOOTER_HEIGHT + CONTENT_MARGIN,
		paddingTop: CONTENT_MARGIN,
		paddingBottom: CONTENT_MARGIN,
		flexGrow: 1,
	},

	// TOTALES
	totalsWrapper: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginBottom: 10,
	},
	totalsBox: {
		width: 220,
		borderWidth: 2,
		borderColor: '#6b7280',
	},
	totalsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderBottomWidth: 1,
		borderBottomColor: '#9ca3af',
	},
	totalsRowLabel: {
		fontSize: 9,
		fontWeight: 'bold',
		textTransform: 'uppercase',
	},
	totalsRowValue: {
		fontSize: 9,
	},
	totalsRowLast: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 8,
		paddingVertical: 4,
		backgroundColor: '#f3f4f6',
	},
	totalsRowLastText: {
		fontSize: 10,
		fontWeight: 'bold',
		textTransform: 'uppercase',
	},

	// FOOTER
	fixedFooter: {
		position: 'absolute',
		left: 36,
		right: 36,
		bottom: 36,
	},
	footerContent: {
		borderTopWidth: 1,
		borderTopColor: '#e5e7eb',
		paddingTop: 4,
	},
	footerRow: {
		flexDirection: 'row',
	},
	footerCol: { flex: 1 },
	sectionTitle: {
		fontSize: 9,
		fontWeight: 'bold',
		marginBottom: 4,
		textTransform: 'uppercase',
		textDecoration: 'underline',
	},
	noteText: {
		fontSize: 8,
		color: '#4b5563',
		marginBottom: 2,
	},
	footerNote: {
		marginTop: 10,
		textAlign: 'center',
		fontSize: 8,
		color: '#9ca3af',
	},
});

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

const ITEMS_PER_PAGE = 15;
const ROWS_PER_PAGE = 15;

const paginateItems = (items: any[], perPage: number): any[][] => {
	if (!items || items.length === 0) return [[]];
	const pages: any[][] = [];
	for (let i = 0; i < items.length; i += perPage) {
		pages.push(items.slice(i, i + perPage));
	}
	return pages;
};

const QuotePdfDocument = ({ quote, company, logoBase64 }: QuotePdfDocumentProps) => {
	const logoSrc = logoBase64 || company.logoUrl || null;

	const items = Array.isArray(quote.items) ? quote.items : [];
	const customer = getCustomerInfo((quote as any).customer);

	const metadata = ((quote as any)?.metadata || {}) as Record<string, any>;
	const orderInfo = {
		orderNumber:
			metadata?.order_number || metadata?.n_orden || quote.quote_number || quote.id || '—',
		contactPhone: customer.phone || metadata?.contact_phone || '—',
		associatedOt: metadata?.associated_ot || '—',
		documentType: metadata?.document || '—',
		purchase_order: quote.purchase_order || null,
	};

	const pagesItems = paginateItems(items, ITEMS_PER_PAGE);

	const { netTotal, discount, tax, total } = getQuoteTotals(quote, items);
	const paymentMethodsLabel = getPaymentMethodsLabel(quote);
	const documentType = getDocumentType(quote);
	return (
		<Document>
			{pagesItems.map((pageItems, pageIndex) => {
				const isLastPage = pageIndex === pagesItems.length - 1;

				// rellenamos hasta ROWS_PER_PAGE con null para las líneas punteadas
				const rows: ((typeof pageItems)[number] | null)[] = Array.from(
					{ length: Math.max(pageItems.length, ROWS_PER_PAGE) },
					(_, idx) => pageItems[idx] ?? null,
				);

				return (
					<Page key={pageIndex} size='LETTER' style={styles.page}>
						{/* HEADER */}
						<View style={styles.header} fixed>
							<View style={styles.headerRow}>
								<View style={styles.headerLeft}>
									<View style={styles.logoBox}>
										{logoSrc ? (
											<Image style={styles.logo} src={logoSrc} />
										) : (
											<Text
												style={{
													fontSize: 10,
													fontWeight: 'bold',
													textAlign: 'center',
												}}>
												{company.name}
											</Text>
										)}
									</View>
									<View style={styles.companyInfo}>
										<Text style={styles.companyName}>{company.name}</Text>
										<Text>Dirección: {company.fullAddress || '—'}</Text>
										<Text>Email: {company.email || '—'}</Text>
										<Text>Giro: {company.activity || '—'}</Text>
										<Text>Servicios Computacionales</Text>
									</View>
								</View>

								<View style={styles.rutBoxContainer}>
									<View style={styles.rutBox}>
										<Text style={styles.rutText}>R.U.T.: {company.rut}</Text>
										<View style={styles.docTypeBox}>
											<Text style={styles.docTypeTitle}>COTIZACIÓN</Text>
										</View>
										<Text style={styles.docNumber}>
											N° {quote.quote_number || quote.id}
										</Text>
									</View>
								</View>
							</View>
						</View>

						<View style={styles.content}>
							{/* BLOQUE EMPRESA / ORDEN */}
							<View style={styles.companyOrderBox}>
								<View style={styles.companyOrderHeader}>
									<Text style={styles.companyOrderHeaderText}>Empresa</Text>
									<Text style={styles.companyOrderHeaderText}>
										N° Orden C:{' '}
										<Text style={{ fontWeight: 'bold' }}>
											{orderInfo.purchase_order || '—'}
										</Text>
									</Text>
								</View>
								<View style={styles.companyOrderBody}>
									<View style={styles.companyOrderColLeft}>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Nombre Empresa: </Text>
											<Text style={styles.infoValue}>{customer.name}</Text>
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>RUT: </Text>
											<Text style={styles.infoValue}>{customer.rut}</Text>
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Giro: </Text>
											<Text style={styles.infoValue}>{customer.giro}</Text>
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Dirección: </Text>
											<Text style={styles.infoValue}>{customer.address}</Text>
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Contacto: </Text>
											<Text style={styles.infoValue}>
												{customer.contactName}
											</Text>
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Correo: </Text>
											<Text style={styles.infoValue}>
												{customer.email || '—'}
											</Text>
										</View>
									</View>

									<View style={styles.companyOrderColRight}>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Fecha: </Text>
											<Text style={styles.infoValue}>
												{formatDate(quote.quote_date)}
											</Text>
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Teléfono: </Text>
											<Text style={styles.infoValue}>
												{orderInfo.contactPhone}
											</Text>
										</View>
										<View style={styles.infoRow}>
											{/* <Text style={styles.infoLabel}>OT Asociada: </Text>
										<Text style={styles.infoValue}>
											{orderInfo.associatedOt}
										</Text> */}
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Método de pago: </Text>
											<Text style={styles.infoValue}>
												{paymentMethodsLabel}
											</Text>
										</View>
										<View style={styles.infoRow}>
											<Text style={styles.infoLabel}>Documento: </Text>
											<Text style={styles.infoValue}>{documentType}</Text>
										</View>
									</View>
								</View>
							</View>

							{/* TABLA DETALLE */}
							<View style={styles.tableOuter}>
								<View style={styles.tableHeader}>
									<Text style={[styles.tableHeaderCell, styles.colCant]}>
										Cant.
									</Text>
									<Text style={[styles.tableHeaderCell, styles.colCode]}>
										Código
									</Text>
									<Text style={[styles.tableHeaderCell, styles.colDesc]}>
										Descripción
									</Text>
									<Text style={[styles.tableHeaderCell, styles.colPrice]}>
										Precio Neto
									</Text>
									<Text style={[styles.tableHeaderCell, styles.colTotal]}>
										Total Neto
									</Text>
								</View>

								{rows.map((item, index) => {
									if (!item) {
										return (
											<View key={`empty-${index}`} style={styles.tableRow}>
												<Text style={styles.colCant}> </Text>
												<Text style={styles.colCode}> </Text>
												<Text style={styles.colDesc}> </Text>
												<Text style={styles.colPrice}> </Text>
												<Text style={styles.colTotal}> </Text>
											</View>
										);
									}

									const sku = getProductSku(item);
									const name = getProductName(item);
									const detail = getProductDetail(item);
									const quantity = Number(item.quantity || 0);
									const unitPrice = resolveUnitPrice(item);
									const lineTotal = resolveLineTotal(item);
									const itemDiscount = Number(item.discount_amount || 0);

									return (
										<View key={index} style={styles.tableRow}>
											<Text style={styles.colCant}>{quantity}</Text>
											<Text style={styles.colCode}>{sku}</Text>
											<View style={styles.colDesc}>
												<Text style={styles.descName}>{name}</Text>
												{detail ? (
													<Text style={styles.descDetail}>{detail}</Text>
												) : null}
												{itemDiscount > 0 && (
													<Text style={styles.descDiscount}>
														Descuento: - {formatCurrency(itemDiscount)}
													</Text>
												)}
											</View>
											<Text style={styles.colPrice}>
												{formatCurrency(unitPrice)}
											</Text>
											<Text style={styles.colTotal}>
												{formatCurrency(lineTotal)}
											</Text>
										</View>
									);
								})}
							</View>
						</View>

						{/* TOTALES + FOOTER SOLO EN LA ÚLTIMA PÁGINA */}
						<View style={styles.fixedFooter} fixed>
							{isLastPage ? (
								<View style={styles.footerContent}>
									<View style={styles.footerRow}>
										<View style={styles.footerCol}>
											<Text style={styles.sectionTitle}>
												Condiciones Comerciales
											</Text>
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
												{company.deliveryTerm ||
													'A convenir o retiro en tienda.'}
											</Text>
											{company.commercialTerms ? (
												<Text style={styles.noteText}>
													• {company.commercialTerms}
												</Text>
											) : null}

											{quote.notes && (
												<View style={{ marginTop: 6 }}>
													<Text style={styles.sectionTitle}>
														Observaciones
													</Text>
													<Text style={styles.noteText}>
														{quote.notes}
													</Text>
												</View>
											)}
										</View>

										<View style={styles.footerCol}>
											{company.bankInfo.length > 0 && (
												<View>
													<Text style={styles.sectionTitle}>
														Datos Bancarios
													</Text>
													{company.bankInfo.map(
														(info: string, idx: number) => (
															<Text key={idx} style={styles.noteText}>
																{info}
															</Text>
														),
													)}
												</View>
											)}
										</View>
										<View style={styles.totalsWrapper}>
											<View style={styles.totalsBox}>
												<View style={styles.totalsRow}>
													<Text style={styles.totalsRowLabel}>Neto</Text>
													<Text style={styles.totalsRowValue}>
														{formatCurrency(netTotal)}
													</Text>
												</View>
												{discount > 0 && (
													<View style={styles.totalsRow}>
														<Text style={styles.totalsRowLabel}>
															Descuento
														</Text>
														<Text style={styles.totalsRowValue}>
															- {formatCurrency(discount)}
														</Text>
													</View>
												)}
												<View style={styles.totalsRow}>
													<Text style={styles.totalsRowLabel}>IVA</Text>
													<Text style={styles.totalsRowValue}>
														{formatCurrency(tax)}
													</Text>
												</View>
												<View style={styles.totalsRowLast}>
													<Text style={styles.totalsRowLastText}>
														Total
													</Text>
													<Text style={styles.totalsRowLastText}>
														{formatCurrency(total)}
													</Text>
												</View>
											</View>
										</View>
									</View>

									<Text style={styles.footerNote}>
										Documento generado electrónicamente por {company.name}
									</Text>
								</View>
							) : null}
						</View>
					</Page>
				);
			})}
		</Document>
	);
};

export default QuotePdfDocument;
