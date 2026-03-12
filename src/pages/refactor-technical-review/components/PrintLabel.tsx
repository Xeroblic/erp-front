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

	// equipment_type viene como objeto { value: 'notebook', label: 'Notebook' }
	const equipmentType = (extractValue(item.equipment_type) || 'notebook').toLowerCase();

	// Para batería, priorizar porcentaje si existe, sino mostrar status
	const getBatteryInfo = () => {
		if (details.battery_percentage) {
			return `${details.battery_percentage}%`;
		}
		if (details.battery_status) {
			return extractValue(details.battery_status);
		}
		return 'N/A';
	};

	// Función para renderizar los campos según el tipo de equipo
	const renderSpecifications = () => {
		const observations = extractValue(details.observations) || 'SIN OBSERVACIÓN';

		// Campos comunes a todos
		let specs: React.ReactNode[] = [
			<React.Fragment key='obs'>
				<span style={{ fontWeight: 'bold' }}>OBS: </span>
				{observations}{' '}
			</React.Fragment>,
		];

		// Campos según tipo de equipo
		switch (equipmentType) {
			case 'notebook':
				specs.push(
					<React.Fragment key='proc'>
						<span style={{ fontWeight: 'bold' }}>PROC: </span>
						{extractValue(details.processor) || 'N/A'}{' '}
					</React.Fragment>,
					<React.Fragment key='ram'>
						<span style={{ fontWeight: 'bold' }}>RAM: </span>
						{extractValue(details.ram_size)}GB{' '}
						{details.ram_slots ? `(${details.ram_slots})` : ''}{' '}
					</React.Fragment>,
					<React.Fragment key='disk'>
						<span style={{ fontWeight: 'bold' }}>ALM: </span>
						{extractValue(details.storage_size)}{' '}
						{extractValue(details.storage_technology)}{' '}
					</React.Fragment>,
					<React.Fragment key='os'>
						<span style={{ fontWeight: 'bold' }}>OS: </span>
						{extractValue(details.operating_system) || 'N/A'}{' '}
					</React.Fragment>,
					<React.Fragment key='screen'>
						<span style={{ fontWeight: 'bold' }}>PANT: </span>
						{extractValue(details.screen_inches)}{' '}
					</React.Fragment>,
					<React.Fragment key='battery'>
						<span style={{ fontWeight: 'bold' }}>BAT: </span>
						{getBatteryInfo()}{' '}
					</React.Fragment>,
					<React.Fragment key='keyboard'>
						<span style={{ fontWeight: 'bold' }}>TECL: </span>
						{extractValue(details.keyboard_layout)}{' '}
						{details.has_backlit_keyboard ? '(RETRO)' : ''}{' '}
					</React.Fragment>,
				);
				break;

			case 'desktop':
				specs.push(
					<React.Fragment key='proc'>
						<span style={{ fontWeight: 'bold' }}>PROC: </span>
						{extractValue(details.processor) || 'N/A'}{' '}
					</React.Fragment>,
					<React.Fragment key='ram'>
						<span style={{ fontWeight: 'bold' }}>RAM: </span>
						{extractValue(details.ram_size)}GB{' '}
						{details.ram_slots ? `(${details.ram_slots})` : ''}{' '}
					</React.Fragment>,
					<React.Fragment key='disk'>
						<span style={{ fontWeight: 'bold' }}>ALM: </span>
						{extractValue(details.storage_size)}{' '}
						{extractValue(details.storage_technology)}{' '}
					</React.Fragment>,
					<React.Fragment key='os'>
						<span style={{ fontWeight: 'bold' }}>OS: </span>
						{extractValue(details.operating_system) || 'N/A'}{' '}
					</React.Fragment>,
				);
				break;

			case 'aio':
				specs.push(
					<React.Fragment key='proc'>
						<span style={{ fontWeight: 'bold' }}>PROC: </span>
						{extractValue(details.processor) || 'N/A'}{' '}
					</React.Fragment>,
					<React.Fragment key='ram'>
						<span style={{ fontWeight: 'bold' }}>RAM: </span>
						{extractValue(details.ram_size)}GB{' '}
						{details.ram_slots ? `(${details.ram_slots})` : ''}{' '}
					</React.Fragment>,
					<React.Fragment key='disk'>
						<span style={{ fontWeight: 'bold' }}>ALM: </span>
						{extractValue(details.storage_size)}{' '}
						{extractValue(details.storage_technology)}{' '}
					</React.Fragment>,
					<React.Fragment key='os'>
						<span style={{ fontWeight: 'bold' }}>OS: </span>
						{extractValue(details.operating_system) || 'N/A'}{' '}
					</React.Fragment>,
					<React.Fragment key='screen'>
						<span style={{ fontWeight: 'bold' }}>PANT: </span>
						{extractValue(details.screen_inches)}{' '}
					</React.Fragment>,
				);
				break;

			case 'monitor':
				specs.push(
					<React.Fragment key='screen'>
						<span style={{ fontWeight: 'bold' }}>PANT: </span>
						{extractValue(details.screen_inches)}{' '}
					</React.Fragment>,
					<React.Fragment key='resolution'>
						<span style={{ fontWeight: 'bold' }}>RES: </span>
						{extractValue(details.resolution) || 'N/A'}{' '}
					</React.Fragment>,
				);
				break;

			case 'docking':
				specs.push(
					<React.Fragment key='ports'>
						<span style={{ fontWeight: 'bold' }}>PUERTOS: </span>
						{extractValue(details.ports) || 'N/A'}{' '}
					</React.Fragment>,
				);
				break;

			default:
				// Por defecto mostrar todos los campos disponibles
				specs.push(
					<React.Fragment key='proc'>
						<span style={{ fontWeight: 'bold' }}>PROC: </span>
						{extractValue(details.processor) || 'N/A'}{' '}
					</React.Fragment>,
					<React.Fragment key='ram'>
						<span style={{ fontWeight: 'bold' }}>RAM: </span>
						{extractValue(details.ram_size)}GB{' '}
						{details.ram_slots ? `(${details.ram_slots})` : ''}{' '}
					</React.Fragment>,
					<React.Fragment key='disk'>
						<span style={{ fontWeight: 'bold' }}>ALM: </span>
						{extractValue(details.storage_size)}{' '}
						{extractValue(details.storage_technology)}{' '}
					</React.Fragment>,
					<React.Fragment key='os'>
						<span style={{ fontWeight: 'bold' }}>OS: </span>
						{extractValue(details.operating_system) || 'N/A'}{' '}
					</React.Fragment>,
				);
		}

		// Cliente al final para todos
		specs.push(
			<React.Fragment key='client'>
				<span style={{ fontWeight: 'bold' }}>CLI: </span>
				{clientName}
			</React.Fragment>,
		);

		return specs;
	};

	// ---- Contenido Visual de la Etiqueta (LAYOUT PYTHON/WORD) ----
	const LabelContent = () => (
		<div
			id='label-print-area'
			style={{
				width: '80mm',
				height: '60mm',
				padding: '3.5mm 4.5mm', // Un poco más de margen para evitar que los QR o textos toquen el borde
				boxSizing: 'border-box',
				fontFamily: 'Arial, sans-serif',
				backgroundColor: '#fff',
				display: 'flex',
				flexDirection: 'column',
				position: 'relative',
				fontSize: '11px',
				overflow: 'hidden', // Evitar desbordes
			}}>
			{/* Fila 1: Logo/Nombre (Izq) + QR Ecopc (Der) */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					height: '13mm', // Aumentado ligeramente para el logo
					marginBottom: '1mm',
				}}>
				<div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
					<img
						src='/logo_etiqueta.png'
						alt='ECOPC'
						style={{
							maxHeight: '13mm',
							maxWidth: '100%',
							objectFit: 'contain',
							padding: '1px',
						}}
					/>
				</div>
				<div
					style={{
						width: '12mm', // Ajustado a la caja del QR
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: 'center',
					}}>
					<QRCodeSVG value='https://www.ecopc.cl' size={42} level='M' />
				</div>
			</div>

			{/* Fila 2: QR Serie (Izq) + Detalles (Der) */}
			<div style={{ display: 'flex', height: '13mm', marginBottom: '1.5mm' }}>
				<div
					style={{
						width: '13mm', // Acompañando al QR
						marginRight: '2mm',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}>
					{/* QR Achicado para dar espacio vertical */}
					<QRCodeSVG value={qrContent} size={46} level='M' />
				</div>
				<div
					style={{
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						lineHeight: '1.15',
					}}>
					<div
						style={{
							fontWeight: 'bold',
							fontSize: '11px', // Agrandado a 11px
							maxHeight: '2.4em',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}>
						{brand} {model}
					</div>
					<div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '1px' }}>
						Categoría {grade}
					</div>
					<div style={{ fontSize: '11px', fontWeight: 'bold' }}>
						N° Serie: {item.serial_number}
					</div>
				</div>
			</div>

			{/* Fila 3: Especificaciones Completas */}
			<div
				style={{
					fontSize: '11px', // Agrandado a 11px
					lineHeight: '1.2',
					textAlign: 'justify',
					overflow: 'hidden',
					flex: 1,
				}}>
				{renderSpecifications()}
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
					style={{
						position: 'fixed',
						top: '-10000px',
						left: '-10000px',
						width: '10px',
						height: '10px',
						visibility: 'hidden',
					}}
					title='Print Frame'
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
							<div className='flex justify-center overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 p-6'>
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
								<Button
									variant='solid'
									color='blue'
									onClick={handleManualPrint}
									disabled={isPrinting}>
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
