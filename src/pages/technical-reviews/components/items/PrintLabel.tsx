import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface PrintLabelProps {
    item: any | null;
    isOpen: boolean;
    onClose: () => void;
    autoPrint?: boolean;
}

const PrintLabel: React.FC<PrintLabelProps> = ({ item, isOpen, onClose, autoPrint = false }) => {
    if (!item) return null;

    const qrContent = item.serial_number || 'SIN-SERIE';

    const extractValue = (val: any): string => {
        if (val == null) return '';
        if (typeof val === 'object') return String(val.label || val.value || val.name || '');
        return String(val);
    };

    const details = item.details || {};
    const grade = extractValue(item.grade) || 'C';
    const clientName = item.customer_supplier?.name || 'SIN CLIENTE';

    const brand = extractValue(details.brand);
    const model = extractValue(details.model);
    const productName = `${brand} ${model}`.trim().toUpperCase() || 'PRODUCTO SIN ESPECIFICAR';

    // ---- Contenido Visual de la Etiqueta (LAYOUT PYTHON/WORD) ----
    const LabelContent = () => (
        <div
            id='label-print-area'
            style={{
                width: '80mm',
                height: '60mm',
                padding: '2mm',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                fontSize: '9pt',
                overflow: 'hidden', // Evitar desbordes
            }}>
            
            {/* Fila 1: Logo/Nombre (Izq) + QR Ecopc (Der) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '16mm', marginBottom: '1mm' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <img 
                        src="/logo_etiqueta.png" 
                        alt="ECOPC" 
                        style={{ 
                            maxHeight: '14mm', 
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                        }} 
                    />
                </div>
                <div style={{ width: '16mm', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <QRCodeSVG value="https://www.ecopc.cl" size={55} level='M' />
                </div>
            </div>

            {/* Fila 2: QR Serie (Izq) + Detalles (Der) */}
            <div style={{ display: 'flex', height: '18mm', marginBottom: '1mm' }}>
                <div style={{ width: '18mm', marginRight: '2mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QRCodeSVG value={qrContent} size={60} level='M' />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.2' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', height: '2.4em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {brand} {model}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '1px' }}>
                        Categoría {grade}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                        N° Serie: {item.serial_number}
                    </div>
                </div>
            </div>

            {/* Fila 3: Especificaciones Completas */}
            <div style={{
                fontSize: '10px',
                lineHeight: '1.15',
                textAlign: 'justify',
                overflow: 'hidden',
                flex: 1
            }}>
               <span style={{ fontWeight: 'bold' }}>OBSERVACIÓN: </span>{extractValue(details.observations) || 'SIN OBSERVACIÓN'} {' '}
               <span style={{ fontWeight: 'bold' }}>PROCESADOR: </span>{extractValue(details.processor) || '0'} {' '}
               <span style={{ fontWeight: 'bold' }}>RAM: </span>{extractValue(details.ram_size)}GB {details.ram_slots ? `(${details.ram_slots})` : ''} {' '}
               <span style={{ fontWeight: 'bold' }}>DISCO: </span>{extractValue(details.storage_size)} {extractValue(details.storage_technology)} {' '}
               <span style={{ fontWeight: 'bold' }}>SO: </span>{extractValue(details.operating_system) || '0'} {' '}
               <span style={{ fontWeight: 'bold' }}>PANTALLA: </span>{extractValue(details.screen_inches)} {' '}
               {details.battery_health && <><span style={{ fontWeight: 'bold' }}>BATERÍA: </span>{details.battery_health} </>}
               <span style={{ fontWeight: 'bold' }}>TECLADO: </span>{extractValue(details.keyboard_layout)} {details.has_backlit_keyboard ? '(RETRO)' : ''} {' '}
               <span style={{ fontWeight: 'bold' }}>CLIENTE: </span>{clientName}
            </div>
        </div>
    );

    // ---- Estado para controlar la impresión manual via Iframe ----
    const [isPrinting, setIsPrinting] = useState(false);

    // Si es autoPrint, iniciamos la impresión en cuanto se abre
    useEffect(() => {
        if (autoPrint && isOpen) {
            setIsPrinting(true);
        }
    }, [autoPrint, isOpen]);

    const handleManualPrint = () => {
        setIsPrinting(true);
    };

    const handleAfterPrint = () => {
        setIsPrinting(false);
        // Si era auto-print, cerramos el modal completo al terminar
        // Si era manual, también es buena UX cerrar el modal, o se puede dejar abierto.
        // Asumiremos cerrar para consistencia con el flujo rápido.
        onClose();
    };

    // ---- Componente de Impresión Off-screen (Iframe) ----
    const PrintFrame = () => {
        const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
        const iframeRef = useRef<HTMLIFrameElement>(null);

        useEffect(() => {
            const iframe = iframeRef.current;
            if (!iframe) return;
            const doc = iframe.contentWindow?.document;
            if (!doc) return;

            // Escribimos el esqueleto del documento
            // IMPORTANTE: CSS estricto para limpiar márgenes y headers
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        @page { 
                            size: 80mm 60mm; 
                            margin: 0; 
                        }
                        body { 
                            margin: 0; 
                            padding: 0; 
                            width: 80mm;
                            height: 60mm;
                            overflow: hidden;
                        }
                        /* Ocultar headers/footers por si acaso (aunque margin 0 suele bastar) */
                        @media print { 
                            body { -webkit-print-color-adjust: exact; } 
                        }
                    </style>
                </head>
                <body>
                    <div id="print-root"></div>
                </body>
                </html>
            `);
            doc.close();
            
            setMountNode(doc.getElementById('print-root'));
        }, []);

        useEffect(() => {
            if (mountNode) {
                // Esperar un momento a que React renderice el portal y se carguen recursos (QRs)
                const timer = setTimeout(() => {
                    if (iframeRef.current?.contentWindow) {
                        iframeRef.current.contentWindow.focus();
                        iframeRef.current.contentWindow.print();
                    }
                }, 500);

                // Detectar cierre del diálogo
                const iframeWin = iframeRef.current?.contentWindow;
                const afterPrintHandler = () => {
                    handleAfterPrint();
                };
                
                iframeWin?.addEventListener('afterprint', afterPrintHandler);
                
                return () => {
                    clearTimeout(timer);
                    iframeWin?.removeEventListener('afterprint', afterPrintHandler);
                };
            }
        }, [mountNode]);

        if (!mountNode) return <iframe ref={iframeRef} style={{ display: 'none' }} />;

        // Renderizamos el contenido en el iframe
        return (
            <>
                <iframe 
                    ref={iframeRef} 
                    style={{ position: 'fixed', top: '-10000px', left: '-10000px', width: '10px', height: '10px', visibility: 'hidden' }} 
                    title="Print Frame"
                />
                {createPortal(<LabelContent />, mountNode)}
            </>
        );
    };

    // ---- Render Principal ----
    
    // Si estamos imprimiendo (Auto o Manual activado), renderizamos el Iframe
    // Nota: Mantenemos el modal visible si es manual, pero el iframe hace el trabajo sucio
    
    return (
        <>
            {/* Si está en modo impresión, montamos el frame oculto */}
            {isPrinting && <PrintFrame />}

            {/* Si NO es autoPrint (o estamos en manual), mostramos el modal visual */}
            {(!autoPrint || !isPrinting) && (
                <Modal isOpen={isOpen} setIsOpen={onClose} size='xl' isStaticBackdrop>
                    <ModalHeader>Imprimir Etiqueta Técnica</ModalHeader>
                    <ModalBody>
                        <div className='flex flex-col gap-4'>
                            {/* Vista previa en pantalla */}
                            <div className='flex justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-6 overflow-hidden'>
                                {/* Contenedor visual con borde para referencia */}
                                <div style={{ border: '1px solid #ddd', padding: 0 }}>
                                    <LabelContent />
                                </div>
                            </div>

                            <div className='flex justify-end gap-2'>
                                <Button variant='outline' onClick={onClose}>
                                    <Icon icon='HeroXMark' className='mr-2' /> Cancelar
                                </Button>
                                {/* Botón Imprimir activa el estado isPrinting que monta el iframe */}
                                <Button variant='solid' color='blue' onClick={handleManualPrint} disabled={isPrinting}>
                                    <Icon icon='HeroPrinter' className='mr-2' /> 
                                    {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
                                </Button>
                            </div>
                        </div>
                    </ModalBody>
                </Modal>
            )}
        </>
    );
};

export default PrintLabel;