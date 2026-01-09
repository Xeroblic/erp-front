import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface PrintLabelProps {
    item: any | null;
    isOpen: boolean;
    onClose: () => void;
    autoPrint?: boolean;
}

// Helper function (can remain inside PrintLabel or be extracted if used elsewhere)
const extractValue = (val: any): string => {
    if (val == null) return '';
    if (typeof val === 'object') return String(val.label || val.value || val.name || '');
    return String(val);
};

// ---- Contenido Visual de la Etiqueta (LAYOUT PYTHON/WORD) ----
const LabelContent = ({ item }: { item: any }) => {
    if (!item) return null; // Ensure item is available for LabelContent

    const qrContent = item.serial_number || 'SIN-SERIE';

    const details = item.details || {};
    const grade = extractValue(item.grade) || 'C';
    const clientName = item.customer_supplier?.name || 'SIN CLIENTE';

    const brand = extractValue(details.brand);
    const model = extractValue(details.model);
    const productName = `${brand} ${model}`.trim().toUpperCase() || 'PRODUCTO SIN ESPECIFICAR';

    return (
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
                <div style={{ flex: 1 }}>
                    <img src="/logo_etiqueta.png" alt="ECOPC" style={{ height: '12mm', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '16mm', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <QRCodeSVG value="https://www.ecopc.cl" size={55} level='M' />
                </div>
            </div>

            {/* Fila 2: Datos y QR Serie */}
            <div style={{ display: 'flex', flex: 1, gap: '2mm' }}>
                {/* Columna Izq: Datos */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '9pt', lineHeight: '1.1' }}>
                    <div><strong>ID:</strong> {item?.id}</div>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{item?.serial_number}</div>
                    <div style={{ textTransform: 'uppercase', fontSize: '8pt' }}>{item?.product_name || item?.product?.name || 'GENERICO'}</div>
                    <div style={{ fontSize: '8pt' }}>{item?.brand} {item?.model}</div>
                </div>

                {/* Columna Der: QR Serie */}
                <div style={{ width: '22mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QRCodeSVG value={item?.serial_number || ''} size={80} level='M' />
                </div>
            </div>

            {/* Specs Footer */}
            <div style={{ 
                marginTop: 'auto', 
                borderTop: '1px solid #000', 
                paddingTop: '1mm', 
                fontSize: '8px', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '3px',
                lineHeight: '1'
            }}>
                {item?.processor && <span>{item.processor} •</span>}
                {item?.ram_size && <span>{item.ram_size} •</span>}
                {item?.storage_size && <span>{item.storage_size} •</span>}
                {item?.screen_inches && <span>{item.screen_inches}"</span>}
            </div>
        </div>
    );
};

// ---- Componente de Impresión Off-screen (Iframe) ----
const PrintFrame = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => {
    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        console.log('[PrintFrame] Mounting');
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
                    /* Forzar tamaño de hoja al exacto de la etiqueta y QUITAR márgenes del navegador */
                    /* Al poner margin: 0, la mayoría de navegadores ocultan auto. headers y footers */
                    @page { 
                        size: 80mm 60mm; 
                        margin: 0; 
                    }
                    
                    html, body { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 80mm;
                        height: 60mm;
                        overflow: hidden; /* Cortar cualquier cosa que se salga */
                        background-color: white;
                    }
                    
                    /* Asegurar contraste correcto para impresión */
                    @media print { 
                        body { 
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact;
                        } 
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
            console.log('[PrintFrame] Print triggering');
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
                console.log('[PrintFrame] After print event');
                onClose();
            };
            
            iframeWin?.addEventListener('afterprint', afterPrintHandler);
            
            return () => {
                clearTimeout(timer);
                iframeWin?.removeEventListener('afterprint', afterPrintHandler);
            };
        }
    }, [mountNode, onClose]); // Add onClose to dependency array

    if (!mountNode) return <iframe ref={iframeRef} style={{ display: 'none' }} />;

    // Renderizamos el contenido en el iframe
    return (
        <>
            <iframe 
                ref={iframeRef} 
                style={{ position: 'fixed', top: '-10000px', left: '-10000px', width: '10px', height: '10px', visibility: 'hidden' }} 
                title="Print Frame"
            />
            {createPortal(children, mountNode)}
        </>
    );
};


const PrintLabel: React.FC<PrintLabelProps> = ({ item, isOpen, onClose, autoPrint = false }) => {
    // Si queremos impresión manual aislada desde el modal:
    const [isPrintingManual, setIsPrintingManual] = useState(false);

    useEffect(() => {
        console.log('[PrintLabel] Mounted/Updated', { isOpen, autoPrint, itemId: item?.id });
    }, [isOpen, autoPrint, item]);

    if (!item) return null;

    // 1. Caso Auto-Print: Renderizar SOLO el frame oculto
    if (autoPrint && isOpen) {
        console.log('[PrintLabel] Auto-printing...');
        return <PrintFrame onClose={onClose}><LabelContent item={item} /></PrintFrame>;
    }

    // 2. Caso Modal Manual: Renderizar el modal Y (opcionalmente) el frame si se está imprimiendo
    return (
        <>
            <Modal isOpen={isOpen} setIsOpen={() => onClose()} size='xl' isStaticBackdrop>
                <ModalHeader>Vista Previa Etiqueta</ModalHeader>
                <ModalBody>
                    <div className='flex flex-col gap-4'>
                        {/* Vista previa en pantalla */}
                        <div className='flex justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-6 overflow-hidden'>
                            {/* Contenedor visual con borde para referencia */}
                            <div style={{ border: '1px solid #ddd', padding: 0 }}>
                                <LabelContent item={item} />
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant='outline' onClick={() => onClose()}>
                        <Icon icon='HeroXMark' className='mr-2' /> Cancelar
                    </Button>
                    <Button variant='solid' color='blue' onClick={() => {
                        console.log('[PrintLabel] Manual print button clicked.');
                        setIsPrintingManual(true);
                    }} disabled={isPrintingManual}>
                        <Icon icon='HeroPrinter' className='mr-2' /> 
                        {isPrintingManual ? 'Imprimiendo...' : 'Imprimir'}
                    </Button>
                </ModalFooter>
            </Modal>
            
            {isPrintingManual && (
                <PrintFrame onClose={() => { 
                    console.log('[PrintLabel] Manual print finished.');
                    setIsPrintingManual(false); 
                    onClose(); 
                }}>
                    <LabelContent item={item} />
                </PrintFrame>
            )}
        </>
    );
};

export default PrintLabel;