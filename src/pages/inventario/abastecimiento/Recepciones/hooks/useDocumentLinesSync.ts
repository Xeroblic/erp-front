import { useEffect } from 'react';
import type { FormikProps } from 'formik';
import type { IPurchaseDocument } from '@/interface/procurement.interface';
import { buildDocumentLines } from '../utils/stockReceiptFormValues';
import type { IStockReceiptFormValues } from '../types';

/**
 * Completa las líneas «con documento» en cuanto la ficha del documento elegido
 * termina de cargar.
 *
 * - **Alta:** precarga todas las líneas pendientes con lo pendiente.
 * - **Corrección** (`preserveExisting`): **no** precarga. Conserva las filas y
 *   cantidades de la recepción y sólo les agrega el saldo como tope; las
 *   líneas con saldo que no tenía se suman en `0`, que no se envía.
 *
 * Sólo escribe cuando hace falta: sin líneas todavía (alta, o documento recién
 * cambiado) o con líneas sin `pending_quantity` (una corrección recién abierta,
 * cuyas líneas vienen de la recepción y no del documento). Así nunca pisa una
 * cantidad que el usuario ya editó, ni los valores bloqueados de un reintento.
 */
const useDocumentLinesSync = (
	formik: FormikProps<IStockReceiptFormValues>,
	selectedDocument: IPurchaseDocument | null,
	preserveExisting: boolean,
) => {
	const { mode, purchase_document_id: documentId, items } = formik.values;
	const needsLines =
		items.length === 0 || items.some((item) => item.pending_quantity === undefined);

	useEffect(() => {
		if (mode !== 'with_document' || !selectedDocument || !needsLines) return;
		// La ficha puede llegar después de que el usuario eligió otro documento.
		if (selectedDocument.id !== documentId) return;
		formik
			.setFieldValue(
				'items',
				buildDocumentLines(selectedDocument, items, { preserveExisting }),
			)
			.catch(() => undefined);
		// `formik` e `items` cambian en cada render; la sincronización depende de
		// qué documento hay y de si faltan líneas, no de su identidad.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, selectedDocument, documentId, needsLines, preserveExisting]);
};

export default useDocumentLinesSync;
