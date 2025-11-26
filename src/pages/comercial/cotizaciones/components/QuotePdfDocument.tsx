// import pdfMake from "pdfmake/build/pdfmake";
// import { buildPdfDefinition } from "../utils/buildPdfDefinition";
// import { mapQuoteToPdfTemplate } from "../utils/mapQuoteToPdfTemplate";
// import type { IQuote } from "@/interface/quotes.interface";
// import { loadPdfFonts } from "../utils/pdf/fonts";

// loadPdfFonts(pdfMake);
// /**
//  * Genera PDF y DEVUELVE UN BLOB real para usar con file-saver
//  */
// export const generateQuotePdf = (quote: IQuote): Promise<Blob> => {
// 	return new Promise((resolve, reject) => {
// 		const tpl = mapQuoteToPdfTemplate(quote);
// 		const def = buildPdfDefinition(tpl);

// 		const pdf = pdfMake.createPdf(def);

// 		pdf.getBlob((blob: Blob) => {
// 			if (!blob) {
// 				reject(new Error("No se pudo generar el PDF"));
// 				return;
// 			}
// 			resolve(blob);
// 		});
// 	});
// };

// export default generateQuotePdf;



// QuotePdfDocument.tsx
import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image
} from "@react-pdf/renderer";
import { IQuote } from "@/interface";

// ======== FONTS ========
// Using default fonts to avoid font loading errors
// Font.register({
//   family: "Roboto",
//   fonts: [
//     { src: "/fonts/Roboto-Regular.ttf" },
//     { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" }
//   ]
// });

// ======== ESTILOS ========
const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111"
  },
  headerRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold"
  },
  rightBox: {
    border: "1.5 solid #EB8536",
    borderRadius: 8,
    width: 160,
    height: 80,
    padding: 8,
    textAlign: "center",
    justifyContent: "center"
  },
  section: {
    marginTop: 24
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6
  },
  table: {
    width: "100%",
    border: "1 solid #333",
    borderBottomWidth: 0
  },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #333"
  },
  cellLabel: {
    width: "30%",
    backgroundColor: "#f3f3f3",
    padding: 6,
    fontWeight: "bold",
    borderRight: "1 solid #333"
  },
  cellValue: {
    width: "70%",
    padding: 6
  },
  itemHeader: {
    backgroundColor: "#f3f3f3",
    flexDirection: "row",
    border: "1 solid #333"
  },
  itemRow: {
    flexDirection: "row",
    borderLeft: "1 solid #333",
    borderRight: "1 solid #333",
    borderBottom: "1 solid #333"
  },
  th: {
    padding: 6,
    fontWeight: "bold",
    borderRight: "1 solid #333"
  },
  td: {
    padding: 6,
    borderRight: "1 solid #333"
  },
  totalBox: {
    marginTop: 16,
    width: 220,
    marginLeft: "auto",
    border: "1 solid #ddd"
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottom: "1 solid #ddd"
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f3f3f3",
    fontWeight: "bold"
  }
});

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(v);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" });
};

const QuotePdfDocument = ({ quote }: { quote: IQuote }) => {
  const items = quote.items ?? [];
  
  // Calcular totales
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.unit_price) * Number(i.quantity)),
    0
  );
  const taxRate = Number(quote.tax_rate ?? 0.19);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Datos del cliente
  const customer = quote.customer as any;
  const customerName = customer?.billing_company || customer?.name || customer?.contact_name || "—";
  const customerRut = customer?.rut || "—";
  const customerEmail = customer?.email || "—";
  const customerPhone = customer?.phone || customer?.mobile_phone || "—";
  const customerGiro = customer?.giro || customer?.business || "—";
  const customerAddress = customer?.billing_address_1 || customer?.address || "—";
  const customerCity = customer?.billing_city || customer?.city || "—";
  const customerContact = customer?.contact_name || customerName;

  // Datos de la empresa (usando metadata si está disponible)
  const companyInfo = quote.metadata?.company || {};
  const companyName = companyInfo.name || "SU EMPRESA LTDA.";
  const companyRut = companyInfo.rut || "00.000.000-0";

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
          </View>

          <View style={styles.rightBox}>
            <Text style={{ fontSize: 9, color: "#666" }}>R.U.T.</Text>
            <Text style={{ fontWeight: "bold", marginTop: 4, fontSize: 14 }}>{companyRut}</Text>
          </View>
        </View>

        {/* TÍTULO */}
        <Text style={{ textAlign: "center", marginBottom: 16, fontSize: 12, fontWeight: "bold" }}>
          {/* COTIZACIÓN N° {quote.quote_number ?? quote.id} */}
          COTIZACIÓN N° {quote.id}

        </Text>

        {/* INFORMACIÓN GENERAL */}
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Fecha Emisión</Text>
            <Text style={styles.cellValue}>{formatDate(quote.quote_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Válida Hasta</Text>
            <Text style={styles.cellValue}>{formatDate(quote.expiry_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Método de Pago</Text>
            <Text style={styles.cellValue}>{quote.payment_method ?? "Transferencia / Depósito"}</Text>
          </View>
        </View>

        {/* DATOS DEL CLIENTE */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>DATOS DEL CLIENTE</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Cliente</Text>
            <Text style={styles.cellValue}>{customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>RUT</Text>
            <Text style={styles.cellValue}>{customerRut}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Giro</Text>
            <Text style={styles.cellValue}>{customerGiro}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Dirección</Text>
            <Text style={styles.cellValue}>{customerAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Ciudad</Text>
            <Text style={styles.cellValue}>{customerCity}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Contacto</Text>
            <Text style={styles.cellValue}>{customerContact}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Email</Text>
            <Text style={styles.cellValue}>{customerEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Teléfono</Text>
            <Text style={styles.cellValue}>{customerPhone}</Text>
          </View>
        </View>

        {/* ITEMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DE PRODUCTOS</Text>

          <View style={styles.itemHeader}>
            <Text style={[styles.th, { width: "15%" }]}>Código</Text>
            <Text style={[styles.th, { width: "35%" }]}>Descripción</Text>
            <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Cant.</Text>
            <Text style={[styles.th, { width: "19%", textAlign: "right" }]}>Unit. Neto</Text>
            <Text style={[styles.th, { width: "19%", textAlign: "right" }]}>Total Neto</Text>
          </View>

          {items.length === 0 ? (
            <View style={[styles.itemRow, { justifyContent: "center", padding: 20 }]}>
              <Text style={{ fontSize: 10, color: "#666" }}>Sin ítems</Text>
            </View>
          ) : (
            items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={[styles.td, { width: "15%" }]}>
                  {item.customer_sku || item.product?.sku || "—"}
                </Text>
                <Text style={[styles.td, { width: "35%" }]}>
                  {item.customer_name || item.product?.name || "Producto"}
                </Text>
                <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.td, { width: "19%", textAlign: "right" }]}>
                  {formatCurrency(Number(item.unit_price))}
                </Text>
                <Text style={[styles.td, { width: "19%", textAlign: "right" }]}>
                  {formatCurrency(Number(item.unit_price) * Number(item.quantity))}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* OBSERVACIONES Y TOTALES */}
        <View style={{ marginTop: 16, flexDirection: "row", justifyContent: "space-between" }}>
          {/* Observaciones */}
          <View style={{ width: "55%" }}>
            <Text style={[styles.sectionTitle, { fontSize: 9 }]}>OBSERVACIONES</Text>
            <View style={{ marginTop: 6, padding: 8, border: "1 solid #ddd", minHeight: 60 }}>
              {quote.notes ? (
                <Text style={{ fontSize: 9 }}>{quote.notes}</Text>
              ) : (
                <Text style={{ fontSize: 9, color: "#999" }}>Sin observaciones</Text>
              )}
            </View>
          </View>

          {/* Totales */}
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal (Neto)</Text>
              <Text>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>IVA {Math.round(taxRate * 100)}%</Text>
              <Text>{formatCurrency(tax)}</Text>
            </View>
            <View style={styles.grandRow}>
              <Text>Total</Text>
              <Text>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={{ marginTop: 20, paddingTop: 10, borderTop: "1 solid #ddd" }}>
          <Text style={{ fontSize: 8, textAlign: "center", color: "#666" }}>
            Documento generado automáticamente
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default QuotePdfDocument;