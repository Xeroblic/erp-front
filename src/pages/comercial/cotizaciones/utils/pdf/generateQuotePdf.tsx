// generateQuotePdf.tsx
import { pdf } from "@react-pdf/renderer";
import React from "react";
import type { IQuote } from "../../../../../interface/quotes.interface";
import QuotePdfDocument from "../../components/QuotePdfDocument";

export const generateQuotePdf = async (quote: IQuote) => {
  const blob = await pdf(<QuotePdfDocument quote={quote} />).toBlob();
  return blob;
};
