import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import type { ReportFormat } from '@/interface/reports.interface';
import {
	exportFileName,
	type IExportDocument,
} from '@/pages/reportes/inventory-reports/export/reportDocument';
import reportToExcelBlob from '@/pages/reportes/inventory-reports/export/reportExcel';
import { reportToPdfBlob } from '@/pages/reportes/inventory-reports/export/reportPdf';

/**
 * Exporta en el navegador lo que muestra la pestaña (todas las filas con sus
 * filtros y orden, no sólo la página). Una descarga a la vez; `exceljs` y
 * `pdfmake` se cargan recién al exportar.
 *
 * **Provisional:** el formato se pidió al backend (preguntas 19–22 de
 * `Docs/abastecimiento-preguntas-backend.md`). Mientras `GET S/reports/{type}/export`
 * no lo genere, todas las pestañas usan este generador para que los archivos
 * tengan un solo formato. Cuando lo haga, cada pestaña vuelve al backend.
 */
const useLocalReportExport = (buildDocument: () => IExportDocument | null) => {
	const [exporting, setExporting] = useState<ReportFormat | null>(null);
	const busyRef = useRef(false);
	const mountedRef = useRef(true);

	useEffect(
		() => () => {
			mountedRef.current = false;
		},
		[],
	);

	const exportReport = useCallback(
		async (format: ReportFormat) => {
			if (busyRef.current) return;
			const doc = buildDocument();
			if (!doc) return;
			busyRef.current = true;
			setExporting(format);
			try {
				const blob =
					format === 'pdf' ? await reportToPdfBlob(doc) : await reportToExcelBlob(doc);
				const { default: FileSaver } = await import('file-saver');
				FileSaver.saveAs(blob, exportFileName(doc, new Date(), format));
			} catch {
				toast.error('No pudimos generar el archivo. Intenta nuevamente.');
			} finally {
				busyRef.current = false;
				if (mountedRef.current) setExporting(null);
			}
		},
		[buildDocument],
	);

	return { exporting, exportReport };
};

export default useLocalReportExport;
