import React, { useState } from 'react';
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
import { toast } from 'react-toastify';
// BORRADO: import { generateQuotePdf } from '../../utils/pdf/generateQuotePdf'; <-- SE FUE
import ApiService from '@/services/ApiService';

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

    const handlePrint = () => {
        const printContent = document.getElementById(PRINT_CONTAINER_ID)?.innerHTML;
        if (!printContent) {
            return;
        }
        const printWindow = window.open('', '_blank', 'noopener,noreferrer');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Cotización ${quotation?.id ?? ''}</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
                </head>
                <body class="bg-gray-100">
                    <div class="p-6">
                        ${printContent}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    // --- AQUI ESTA LA MAGIA DEL CODE SPLITTING ---
    const handleDownload = async () => {
        if (!quotation) return;
        setDownloading(true);
        try {
            // 1. Importamos las librerías pesadas AL VUELO
            const { saveAs } = await import('file-saver');
            const { generateQuotePdf } = await import('../../utils/pdf/generateQuotePdf');

            // 2. Generamos el PDF
            const blob = await generateQuotePdf(quotation);
            const filename = `cotizacion-${quotation.id}.pdf`;
            
            // 3. Descargamos
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
        <Modal isOpen={isOpen} setIsOpen={onClose} size='2xl'>
            <ModalHeader>
                <div>
                    <h2 className='text-xl font-semibold'>Detalles de Cotización</h2>
                    <p className='text-sm text-gray-600'>
                        { `ID #${quotation?.id ?? ''}`}
                    </p>
                </div>
            </ModalHeader>

            <ModalBody className='bg-gray-100'>
                {isLoading ? (
                    <div className='flex items-center justify-center py-16 text-gray-600'>
                        <div className='mr-3 h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent' />
                        Cargando detalles de la cotización...
                    </div>
                ) : quotation ? (
                    <div id={PRINT_CONTAINER_ID}>
                        <QuotePrintableView quote={quotation} />
                    </div>
                ) : (
                    <p className='py-6 text-center text-sm text-gray-500'>
                        Selecciona una cotización para ver sus detalles.
                    </p>
                )}
            </ModalBody>

            <ModalFooter>
                <ModalFooterChild className='flex flex-wrap justify-end gap-3'>
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

                    <Button color='blue' onClick={handlePrint} isDisable={!quotation}>
                        Imprimir
                    </Button>
                </ModalFooterChild>
            </ModalFooter>
        </Modal>
    );
};

export { QuotationDetailsModal };