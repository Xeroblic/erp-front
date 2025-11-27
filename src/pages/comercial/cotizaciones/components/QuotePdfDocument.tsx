import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font
} from "@react-pdf/renderer";
import { IEmpresa, IQuote, ISubempresa } from "@/interface";
import store from "@/store"; // Importamos el store para sacar datos reales

// ======== 1. CONFIGURACIÓN Y ESTILOS ========

// Registramos una fuente estándar si es necesario, por ahora usamos Helvetica que es segura
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1f2937", // gray-800
    lineHeight: 1.3
  },
  // --- HEADER ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10
  },
  headerLeft: {
    width: "60%",
    flexDirection: "column",
    justifyContent: "flex-start"
  },
  logoContainer: {
    height: 50,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "flex-start"
  },
  logo: {
    height: "100%",
    objectFit: "contain"
  },
  companyTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2
  },
  companyInfo: {
    fontSize: 8,
    color: "#4b5563" // gray-600
  },
  // --- RUT BOX (Cuadro Rojo) ---
  rutBox: {
    width: "35%",
    borderWidth: 2,
    borderColor: "#dc2626", // red-600
    alignItems: "center",
    justifyContent: "center",
    padding: 10
  },
  rutNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#dc2626"
  },
  rutLabelBox: {
    backgroundColor: "#fef2f2", // red-50
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginVertical: 4,
    width: "100%",
    alignItems: "center"
  },
  rutLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#dc2626",
    textTransform: "uppercase"
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#dc2626"
  },
  dateText: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 5,
    color: "#374151"
  },
  // --- CLIENTE ---
  customerBox: {
    borderWidth: 1,
    borderColor: "#d1d5db", // gray-300
    backgroundColor: "#f9fafb", // gray-50
    padding: 8,
    marginBottom: 20
  },
  customerRow: {
    flexDirection: "row",
    marginBottom: 3
  },
  label: {
    width: 60,
    fontWeight: "bold",
    fontSize: 8
  },
  value: {
    flex: 1,
    fontSize: 8
  },
  valueBold: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  // --- TABLA ---
  tableContainer: {
    marginBottom: 20,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "#e5e7eb" // gray-200
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 20,
    alignItems: "center"
  },
  tableHeader: {
    backgroundColor: "#f3f4f6", // gray-100
    fontWeight: "bold",
    color: "#111827",
    textTransform: "uppercase",
    fontSize: 8
  },
  colCant: { width: "10%", padding: 4, textAlign: "center", borderRightWidth: 1, borderColor: "#e5e7eb" },
  colCode: { width: "15%", padding: 4, textAlign: "left", borderRightWidth: 1, borderColor: "#e5e7eb" },
  colDesc: { width: "45%", padding: 4, textAlign: "left", borderRightWidth: 1, borderColor: "#e5e7eb" },
  colPrice: { width: "15%", padding: 4, textAlign: "right", borderRightWidth: 1, borderColor: "#e5e7eb" },
  colTotal: { width: "15%", padding: 4, textAlign: "right", borderRightWidth: 1, borderColor: "#e5e7eb" },
  
  // --- FOOTER SECTION ---
  footerContainer: {
    flexDirection: "row",
    gap: 20
  },
  leftCol: {
    flex: 1
  },
  conditionsBox: {
    marginBottom: 10,
    paddingLeft: 5,
    borderLeftWidth: 2,
    borderColor: "#d1d5db"
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  notesBox: {
    backgroundColor: "#f9fafb",
    padding: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 5
  },
  // --- TOTALS TABLE ---
  totalsTable: {
    width: 180
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 4
  },
  totalLabel: {
    fontWeight: "bold",
    color: "#4b5563"
  },
  totalValue: {
    fontWeight: "bold",
    textAlign: "right"
  },
  finalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    padding: 6,
    marginTop: 2
  },
  finalTotalText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827"
  },
  
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 10
  }
});

// ======== 2. HELPERS & DATA LOGIC ========

const formatCurrency = (value: any) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(Number(value) || 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("es-CL");
};

const normalizeText = (val?: any) => (val && String(val).trim().length > 0 ? String(val).trim() : undefined);

// Extraer info de empresa directamente del Store (igual que en la vista web)
const getCompanyInfo = (quote: IQuote) => {
  const state = store.getState();
  const subsidiaries = (state.subEmpresa?.lista || []) as ISubempresa[];
  const mainCompany = state.empresa?.miEmpresa as IEmpresa | undefined;

  const activeSub = subsidiaries.find((s) => Number(s.id) === Number(quote.subsidiary_id));
  const meta = (quote.metadata as any)?.company || {};

  // Helper para buscar el primer valor no nulo
  const getVal = (...candidates: any[]) => candidates.find((c) => normalizeText(c)) || undefined;

  const name = getVal(
    meta.name,
    activeSub?.name,
    activeSub?.subsidiary_name,
    mainCompany?.company_name,
    mainCompany?.legal_name,
    "SU EMPRESA LTDA."
  );

  const rut = getVal(
    meta.rut,
    activeSub?.rut,
    activeSub?.subsidiary_rut,
    mainCompany?.company_rut,
    "77.000.000-0"
  );

  const activity = getVal(
    meta.activity,
    activeSub?.manager_name,
    mainCompany?.business_activity,
    "Giro Comercial"
  );

  let address = getVal(
    meta.address,
    activeSub?.address,
    activeSub?.subsidiary_address,
    mainCompany?.company_address,
    "Dirección Principal"
  );

  const commune = getVal(
    meta.commune,
    activeSub?.commune_name
  );

  if (commune && address && !address.includes(commune)) {
    address = `${address}, ${commune}`;
  }

  const email = getVal(
    meta.email,
    activeSub?.email,
    activeSub?.subsidiary_email,
    mainCompany?.contact_email,
    "contacto@empresa.cl"
  );

  const phone = getVal(
    meta.phone,
    activeSub?.phone,
    activeSub?.subsidiary_phone,
    mainCompany?.company_phone,
    ""
  );

  const website = getVal(
    meta.website,
    activeSub?.website,
    activeSub?.subsidiary_website,
    mainCompany?.company_website,
    ""
  );

  const logoUrl = getVal(
    meta.logo_url,
    activeSub?.logo_url,
    (activeSub as any)?.logo?.url,
    (activeSub as any)?.logo,
    mainCompany?.company_logo,
    (mainCompany as any)?.logo?.url
  );

  const bankData =
    (meta as any)?.bank_info ??
    (activeSub as any)?.bank_info ??
    (mainCompany as any)?.bank_info;
  const bankInfo = Array.isArray(bankData)
    ? bankData.map(String)
    : bankData
    ? [String(bankData)]
    : [];

  return {
    name,
    rut,
    activity,
    address,
    city: commune,
    email,
    phone,
    website,
    logoUrl,
    bankInfo
  };
};

// ======== 3. COMPONENTE DOCUMENTO ========

const QuotePdfDocument = ({ quote }: { quote: IQuote }) => {
  const company = getCompanyInfo(quote);
  const items = quote.items || [];
  
  // Cálculos
  const netTotal = items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unit_price) || 0;
    const d = Number((item as any).discount_amount) || 0;
    return sum + (q * p - d);
  }, 0);
  
  const discountGlobal = Number(quote.discount_amount) || 0;
  const taxRate = Number(quote.tax_rate || 0.19);
  // Normalizar tasa si viene como entero (ej: 19)
  const effectiveTaxRate = taxRate > 1 ? taxRate / 100 : taxRate; 
  
  const taxAmount = (netTotal - discountGlobal) * effectiveTaxRate;
  const grandTotal = (netTotal - discountGlobal) + taxAmount;

  // Cliente
  const customer = quote.customer as any || {};
  const customerName = customer.razon_social || customer.billing_company || customer.name || "Cliente General";
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              {company.logoUrl ? (
                /* Validar que sea una URL absoluta o base64 válida para evitar errores de PDF */
                <Image style={styles.logo} src={company.logoUrl} />
              ) : (
                <Text style={[styles.companyTitle, { fontSize: 18 }]}>{company.name}</Text>
              )}
            </View>
            
            {company.logoUrl && <Text style={styles.companyTitle}>{company.name}</Text>}
            <Text style={styles.companyInfo}>Giro: {company.activity}</Text>
            <Text style={styles.companyInfo}>
              {company.address} {company.city ? `, ${company.city}` : ""}
            </Text>
            <Text style={styles.companyInfo}>Email: {company.email}  •  Fono: {company.phone}</Text>
            {company.website && <Text style={styles.companyInfo}>{company.website}</Text>}
          </View>

          <View style={{ width: "35%", alignItems: "flex-end" }}>
            <View style={styles.rutBox}>
              <Text style={styles.rutNumber}>R.U.T.: {company.rut}</Text>
              <View style={styles.rutLabelBox}>
                <Text style={styles.rutLabel}>COTIZACIÓN</Text>
              </View>
              <Text style={styles.quoteNumber}>N° {quote.id}</Text>
            </View>
            <Text style={styles.dateText}>Fecha: {formatDate(quote.quote_date)}</Text>
          </View>
        </View>

        {/* --- CLIENTE --- */}
        <View style={styles.customerBox}>
          <View style={styles.customerRow}>
            <Text style={styles.label}>Señor(es):</Text>
            <Text style={styles.valueBold}>{customerName}</Text>
            <Text style={[styles.label, { width: 30, textAlign: "right" }]}>RUT:</Text>
            <Text style={[styles.value, { flex: 0.4, textAlign: "right" }]}>{customer.rut || customer.tax_number || "—"}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.label}>Giro:</Text>
            <Text style={styles.value}>{customer.giro || customer.business_activity || "—"}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{customer.address || customer.billing_address || "—"}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.label}>Contacto:</Text>
            <Text style={styles.value}>{customer.contact_name || "—"}</Text>
            <Text style={[styles.label, { width: 40, textAlign: "right" }]}>Fono:</Text>
            <Text style={[styles.value, { flex: 0.4, textAlign: "right" }]}>{customer.phone || "—"}</Text>
          </View>
        </View>

        {/* --- ITEMS TABLE --- */}
        <View style={styles.tableContainer}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colCant}>Cant.</Text>
            <Text style={styles.colCode}>Código</Text>
            <Text style={styles.colDesc}>Descripción</Text>
            <Text style={styles.colPrice}>P. Unit</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colCant}>{item.quantity}</Text>
              <Text style={styles.colCode}>{item.customer_sku || item.product?.sku || "—"}</Text>
              <View style={styles.colDesc}>
                <Text style={{ fontWeight: "bold" }}>{item.customer_name || item.product?.name}</Text>
                {item.description ? <Text style={{ color: "#6b7280", fontSize: 8 }}>{item.description}</Text> : null}
                {(item.metadata as any)?.warranty && (
                   <Text style={{ color: "#2563eb", fontSize: 7, marginTop: 2 }}>Garantía: {(item.metadata as any).warranty}</Text>
                )}
              </View>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={[styles.colTotal, { fontWeight: "bold" }]}>
                {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
              </Text>
            </View>
          ))}
          
          {items.length === 0 && (
            <View style={[styles.tableRow, { justifyContent: "center", padding: 10 }]}>
               <Text style={{ color: "#9ca3af" }}>Sin ítems cargados</Text>
            </View>
          )}
        </View>

        {/* --- FOOTER AREA --- */}
        <View style={styles.footerContainer}>
          
          {/* Left: Condiciones & Notas */}
          <View style={styles.leftCol}>
            <View style={styles.conditionsBox}>
              <Text style={styles.sectionTitle}>Condiciones Comerciales</Text>
              <Text style={{ fontSize: 8 }}>• Validez: {quote.expiry_date ? formatDate(quote.expiry_date) : "7 días"}</Text>
              <Text style={{ fontSize: 8 }}>• Pago: {quote.payment_method || "Contado / Transferencia"}</Text>
              <Text style={{ fontSize: 8 }}>• Entrega: {(quote.metadata as any)?.delivery_terms || "A convenir"}</Text>
            </View>

            {(quote.notes || company.bankInfo.length > 0) && (
              <View style={styles.notesBox}>
                {quote.notes && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 8 }}>Observaciones:</Text>
                    <Text style={{ fontSize: 8, color: "#4b5563" }}>{quote.notes}</Text>
                  </View>
                )}
                {Array.isArray(company.bankInfo) && company.bankInfo.length > 0 && (
                  <View>
                     <Text style={{ fontWeight: "bold", fontSize: 8 }}>Datos Bancarios:</Text>
                     {company.bankInfo.map((info: string, i: number) => (
                       <Text key={i} style={{ fontSize: 8, color: "#4b5563" }}>{info}</Text>
                     ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Right: Totales */}
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Neto</Text>
              <Text style={styles.totalValue}>{formatCurrency(netTotal)}</Text>
            </View>
            {discountGlobal > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: "#ef4444" }]}>Descuento</Text>
                <Text style={[styles.totalValue, { color: "#ef4444" }]}>- {formatCurrency(discountGlobal)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>I.V.A. (19%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
            </View>
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalText}>TOTAL</Text>
              <Text style={styles.finalTotalText}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>

        </View>

        <Text style={styles.pageFooter}>
           Documento generado electrónicamente por {company.name} - Pagina 1
        </Text>

      </Page>
    </Document>
  );
};

export default QuotePdfDocument;
