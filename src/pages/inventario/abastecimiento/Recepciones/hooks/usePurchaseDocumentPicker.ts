import { useEffect, useState } from 'react';
import {
	getPurchaseDocument,
	listPurchaseDocuments,
} from '@/services/procurement/purchaseDocuments.service';
import type {
	IPurchaseDocument,
	IPurchaseDocumentListRow,
} from '@/interface/procurement.interface';

/**
 * Documentos confirmados para el `Select` del alta «con documento» y, una
 * vez elegido uno, su ficha completa (para las líneas con
 * `remaining_quantity` y el costo derivado). Llama al servicio directamente
 * — es sólo una lista/ficha de apoyo para este formulario, no el `current`
 * de la pantalla de Documentos de compra.
 */
const usePurchaseDocumentPicker = (
	subsidiaryId: number | null,
	isEnabled: boolean,
	selectedDocumentId: number | '',
) => {
	const [documents, setDocuments] = useState<IPurchaseDocumentListRow[]>([]);
	const [loadingDocuments, setLoadingDocuments] = useState(false);

	useEffect(() => {
		if (!isEnabled || subsidiaryId === null) return undefined;

		let cancelled = false;
		// Hallazgo 3: no dejar la lista de la filial anterior visible mientras
		// se pide la nueva — sin esto, cambiar de filial con el modal abierto
		// mostraba documentos ajenos hasta que la petición nueva resolviera.
		setDocuments([]);
		setLoadingDocuments(true);
		listPurchaseDocuments(subsidiaryId, { status: 'confirmed', per_page: 100 })
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
	}, [subsidiaryId, isEnabled]);

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
		getPurchaseDocument(subsidiaryId, selectedDocumentId)
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
	}, [subsidiaryId, isEnabled, selectedDocumentId]);

	return { documents, loadingDocuments, selectedDocument, loadingSelectedDocument };
};

export default usePurchaseDocumentPicker;
