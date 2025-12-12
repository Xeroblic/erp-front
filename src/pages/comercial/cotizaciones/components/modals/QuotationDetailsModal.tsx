import React, { useState } from 'react';
import { toast } from 'react-toastify';
import QuotePrintableView from '../QuotePrintableView';
import type { IQuote } from '../../../../../interface/quotes.interface';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
// BORRADO: import { saveAs } from 'file-saver';  <-- SE FUE
// BORRADO: import { generateQuotePdf } from '../../utils/pdf/generateQuotePdf'; <-- SE FUE
import ApiService from '@/services/ApiService';
import Badge from '@/components/ui/Badge';

interface QuotationDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	quotation: IQuote | null;
	isLoading: boolean;
	onDownloadPdf?: (id: number) => void;
}

const PRINT_CONTAINER_ID = 'quote-printable-container';

const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
	isOpen,
	onClose,
	quotation,
	isLoading,
	onDownloadPdf,
}) => {
	const [downloading, setDownloading] = useState(false);
	const [isPrinting, setIsPrinting] = useState(false);

	const getPdfBlob = async () => {
		if (!quotation) return null;
		const { generateQuotePdf } = await import('../../utils/pdf/generateQuotePdf');
		return generateQuotePdf(quotation);
	};

	const handlePrint = () => {
		if (!quotation) return;
		const container = document.getElementById(PRINT_CONTAINER_ID);
		if (!container) {
			toast.error('No se encontró el contenido para imprimir');
			return;
		}
		setIsPrinting(true);
		try {
			const printWindow = window.open('', '_blank', 'width=900,height=1200');
			if (!printWindow) {
				throw new Error('Pop-up bloqueado');
			}
			const printStyles = `
        * { box-sizing: border-box; }
        body { margin: 0; padding: 24px; font-family: 'Helvetica', sans-serif; background: #f3f4f6; color: #111827; }
        .print-wrapper { max-width: 216mm; margin: 0 auto; background: #ffffff; padding: 12px; }
        @page { margin: 12mm; }
        @media print {
          body { background: #ffffff; }
          .print-wrapper { box-shadow: none; }
        }
      `;
			printWindow.document.open();
			printWindow.document.write(`
        <html>
          <head>
            <title>Cotización ${quotation.id}</title>
            <style>${printStyles}</style>
          </head>
          <body>
            <div class="print-wrapper">${container.innerHTML}</div>
          </body>
        </html>
      `);
			printWindow.document.close();
			printWindow.focus();
			printWindow.onload = () => {
				printWindow.focus();
				printWindow.print();
				printWindow.close();
				setIsPrinting(false);
			};
			setTimeout(() => {
				if (!printWindow.closed) {
					printWindow.focus();
					printWindow.print();
					printWindow.close();
					setIsPrinting(false);
				}
			}, 800);
		} catch (error) {
			console.error(error);
			toast.error('No se pudo preparar la impresión');
			setIsPrinting(false);
		}
	};

	// --- AQUI ESTA LA MAGIA DEL CODE SPLITTING ---
	const handleDownload = async () => {
		if (!quotation) return;
		setDownloading(true);
		try {
			const { saveAs } = await import('file-saver');
			const blob = await getPdfBlob();
			if (!blob) throw new Error('No se pudo generar el PDF');
			const filename = `cotizacion-${quotation.id}.pdf`;
			saveAs(blob, filename);
		} catch (error) {
			if (onDownloadPdf) {
				onDownloadPdf(quotation.id);
			} else {
				toast.error('No se pudo generar el PDF');
				console.error(error);
			}
		} finally {
			setDownloading(false);
		}
	};

	const [converting, setConverting] = useState(false);

	const handleConvertToSale = async () => {
		if (!quotation) return;
		try {
			setConverting(true);

			const res = await ApiService.fetchNormalized({
				url: `/subsidiaries/${quotation.subsidiary_id}/quotes/${quotation.id}/convert-to-sale`,
				method: 'POST',
			});

			toast.success('Cotización convertida en venta correctamente');

			onClose();
		} catch (error) {
			console.error(error);
			toast.error('No se pudo convertir la cotización');
		} finally {
			setConverting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader>
				<div>
					<Badge className='text-xl font-semibold'>Detalles de Cotización</Badge>
					<p className='text-sm text-gray-600 dark:text-white'>{`ID #${quotation?.id ?? ''}`}</p>
				</div>
			</ModalHeader>

			<ModalBody className='bg-gray-100 max-h-[80vh] overflow-y-auto p-6'>
				{isLoading ? (
					<div className='flex items-center justify-center py-16 text-gray-600'>
						<div className='mr-3 h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent' />
						Cargando detalles de la cotización...
					</div>
				) : quotation ? (
					<div
						id={PRINT_CONTAINER_ID}
						className='mx-auto w-full max-w-4xl  rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-100'>
						<QuotePrintableView quote={quotation} />
					</div>
				) : (
					<p className='py-6 text-center text-sm text-gray-500'>
						Selecciona una cotización para ver sus detalles.
					</p>
				)}
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild className='flex flex-wrap justify-between gap-3 w-full mt-8'>
					<div className='text-xs text-gray-500'>
						Última actualización:{' '}
						{quotation?.updated_at
							? new Date(quotation.updated_at).toLocaleString()
							: '—'}
					</div>
					<div className='flex flex-wrap gap-3'>
						<Button variant='outline' onClick={onClose}>
							Cerrar
						</Button>
						<Button
							variant='outline'
							onClick={handleDownload}
							isDisable={!quotation}
							isLoading={downloading}>
							Descargar PDF
						</Button>
						<Button
							variant='outline'
							color='green'
							onClick={handleConvertToSale}
							isDisable={!quotation}
							isLoading={converting}>
							Convertir a Venta
						</Button>

					<Button color='blue' onClick={handlePrint} isDisable={!quotation || isPrinting}>
						{isPrinting ? 'Preparando…' : 'Imprimir'}
					</Button>
					</div>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export { QuotationDetailsModal };
