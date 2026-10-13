import { useEffect, useState } from 'react';
import INVENTORY_RECEIPTS_USE_MOCKS from '@/config/inventoryReceipts.config';
import * as purchaseDocumentsMock from '@/mocks/services/purchaseDocuments.mock';
import * as purchaseDocumentsApi from '@/services/procurement/purchaseDocuments.service';
import type {
	IPurchaseDocument,
	IPurchaseDocumentListRow,
} from '@/interface/procurement.interface';

/**
 * Documentos confirmados para el `Select` del alta «con documento» y, una
 * vez elegido uno, su ficha completa (para las líneas con
 * `remaining_quantity` y el costo derivado). Es sólo una lista/ficha de apoyo
 * para este formulario, no el `current` de la pantalla de Documentos de compra.
 *
 * `useMockDocuments` elige la fuente: los documentos del doble cuando quien
 * escribe es simulado (sólo reconoce los de su semilla), los de la API real si
 * no. Por omisión sigue a Recepciones; el respaldo de stock inicial de
 * Inventario pasa su propia bandera.
 */
const usePurchaseDocumentPicker = (
	subsidiaryId: number | null,
	isEnabled: boolean,
	selectedDocumentId: number | '',
	useMockDocuments: boolean = INVENTORY_RECEIPTS_USE_MOCKS,
) => {
	const source = useMockDocuments ? purchaseDocumentsMock : purchaseDocumentsApi;
	const [documents, setDocuments] = useState<IPurchaseDocumentListRow[]>([]);
	const [loadingDocuments, setLoadingDocuments] = useState(false);

	useEffect(() => {
		if (!isEnabled || subsidiaryId === null) return undefined;

		let cancelled = false;
		// No deja la lista de la filial anterior visible mientras se pide la nueva.
		setDocuments([]);
		setLoadingDocuments(true);
		source
			.listPurchaseDocuments(subsidiaryId, { status: 'confirmed', per_page: 100 })
			.then((response) => {
				if (!cancelled) setDocuments(response.data);
			})
			.catch(() => {
				if (!cancelled) setDocuments([]);
			})
			.finally(() => {
				if (!cancelled) setLoadingDocuments(false);
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, isEnabled, source]);

	const [selectedDocument, setSelectedDocument] = useState<IPurchaseDocument | null>(null);
	const [loadingSelectedDocument, setLoadingSelectedDocument] = useState(false);

	useEffect(() => {
		if (!isEnabled || subsidiaryId === null || selectedDocumentId === '') {
			setSelectedDocument(null);
			return undefined;
		}

		let cancelled = false;
		// Mismo criterio que la lista: no dejar la línea seleccionada de un
		// documento/filial anterior visible mientras se pide la nueva.
		setSelectedDocument(null);
		setLoadingSelectedDocument(true);
		source
			.getPurchaseDocument(subsidiaryId, selectedDocumentId)
			.then((response) => {
				if (!cancelled) setSelectedDocument(response.data);
			})
			.catch(() => {
				if (!cancelled) setSelectedDocument(null);
			})
			.finally(() => {
				if (!cancelled) setLoadingSelectedDocument(false);
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, isEnabled, selectedDocumentId, source]);

	return { documents, loadingDocuments, selectedDocument, loadingSelectedDocument };
};

export default usePurchaseDocumentPicker;
