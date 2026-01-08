/**
 * PrintLabel - Componente para imprimir etiquetas HORIZONTALES de 8x6cm con QR
 * Se usa en las acciones de la tabla de revisiones técnicas
 */
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { IItem } from '@/interface/technicalReviews.interface';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface PrintLabelProps {
	item: IItem | null;
	isOpen: boolean;
	onClose: () => void;
}

const PrintLabel: React.FC<PrintLabelProps> = ({ item, isOpen, onClose }) => {
	if (!item) return null;

	const qrContent = `${window.location.origin}/technical-reviews/items/${item.id}`;

	const equipmentType =
		typeof item.equipment_type === 'object'
			? (item.equipment_type as any)?.label ||
				(item.equipment_type as any)?.value ||
				'Desconocido'
			: item.equipment_type || 'Desconocido';

	const serialNumber = item.serial_number || 'SIN SERIE';

	// Helper para extraer valores de objetos {value, label, description}
	const extractValue = (val: any): string => {
		if (val == null) return '';
		if (typeof val === 'object' && 'value' in val) return String(val.value || '');
		if (typeof val === 'object' && 'label' in val) return String(val.label || '');
		return String(val);
	};

	const grade = extractValue(item.grade) || 'C';

	const attrs = item.attributes_json || {};
	const details = item.details || {};
	const combined = { ...attrs, ...details };

	const brand = extractValue(combined.brand);
	const model = extractValue(combined.model);

	const buildSpecs = (): string => {
		const parts: string[] = [];

		if (combined.observations) {
			return extractValue(combined.observations).toUpperCase();
		}

		if (combined.processor) parts.push(`Procesador: ${extractValue(combined.processor)}`);
		if (combined.ram_size) parts.push(`RAM: ${extractValue(combined.ram_size)}`);
		if (combined.storage_size && combined.storage_technology) {
			parts.push(
				`Disco: ${extractValue(combined.storage_size)} ${extractValue(combined.storage_technology)}`,
			);
		} else if (combined.storage_size) {
			parts.push(`Disco: ${extractValue(combined.storage_size)}`);
		}
		if (combined.screen_inches)
			parts.push(`Pantalla: ${extractValue(combined.screen_inches)}"`);
		if (combined.battery_status)
			parts.push(`Batería: ${extractValue(combined.battery_status)}`);
		if (combined.keyboard_layout)
			parts.push(`Teclado: ${extractValue(combined.keyboard_layout)}`);
		if (combined.has_backlit_keyboard) parts.push(`Retroiluminado: SI`);
		if (combined.general_condition)
			parts.push(`Estado: ${extractValue(combined.general_condition)}`);

		return parts.join(' ').toUpperCase();
	};

	const specs = buildSpecs();
	const productName = `${brand} ${model}`.trim().toUpperCase() || 'PRODUCTO SIN ESPECIFICAR';

	const handlePrint = () => {
		window.print();
	};

	return (
		<>
			<Modal isOpen={isOpen} setIsOpen={onClose} size='xl' isStaticBackdrop>
				<ModalHeader>Imprimir Etiqueta</ModalHeader>
				<ModalBody>
					<div className='flex flex-col gap-4'>
						<div className='flex justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-6'>
							<div
								id='label-print-area'
								className='label-container'
								style={{
									width: '80mm',
									height: '60mm',
									border: '1px solid #000',
									padding: '3mm',
									boxSizing: 'border-box',
									fontFamily: 'Arial, sans-serif',
									fontSize: '9px',
									backgroundColor: '#fff',
									color: '#000',
									display: 'flex',
									flexDirection: 'column',
									position: 'relative',
								}}>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'flex-start',
										marginBottom: '2mm',
										height: '28mm',
									}}>
									<div style={{ flex: 1 }}>
										<div
											style={{
												fontSize: '18px',
												fontWeight: 'bold',
												marginBottom: '1mm',
											}}>
											ecopc
										</div>
										<div
											style={{
												fontSize: '9px',
												textDecoration: 'underline',
											}}>
											www.ecopc.cl
										</div>
									</div>

									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}>
										<QRCodeSVG value={qrContent} size={70} level='M' />
									</div>
								</div>

								<div
									style={{
										display: 'flex',
										gap: '3mm',
										alignItems: 'flex-start',
										marginBottom: '2mm',
									}}>
									<div
										style={{
											flexShrink: 0,
										}}>
										<QRCodeSVG value={qrContent} size={45} level='M' />
									</div>

									<div style={{ flex: 1, fontSize: '10px' }}>
										<div
											style={{
												fontWeight: 'bold',
												fontSize: '11px',
												marginBottom: '1mm',
												lineHeight: '1.2',
											}}>
											{productName}
										</div>
										<div style={{ marginBottom: '0.5mm' }}>
											<span style={{ fontWeight: 'bold' }}>
												Categoría {grade}
											</span>
										</div>
										<div style={{ fontWeight: 'bold' }}>
											N° Serie: {serialNumber}
										</div>
									</div>
								</div>

								<div
									style={{
										fontSize: '7px',
										lineHeight: '1.2',
										wordBreak: 'break-word',
										borderTop: '1px solid #000',
										paddingTop: '1mm',
									}}>
									<strong>Observación:</strong> {specs || 'Sin observaciones'}
								</div>
							</div>
						</div>

						<div className='flex justify-end gap-2'>
							<Button variant='outline' onClick={onClose}>
								<Icon icon='HeroXMark' className='mr-2' />
								Cancelar
							</Button>
							<Button variant='solid' color='blue' onClick={handlePrint}>
								<Icon icon='HeroPrinter' className='mr-2' />
								Imprimir
							</Button>
						</div>
					</div>
				</ModalBody>
			</Modal>

			<style>{`
				@media print {
					body * {
						visibility: hidden !important;
					}
					
					#label-print-area,
					#label-print-area * {
						visibility: visible !important;
					}
					
					#label-print-area {
						position: absolute !important;
						left: 0 !important;
						top: 0 !important;
						width: 80mm !important;
						height: 60mm !important;
						padding: 3mm !important;
						margin: 0 !important;
						box-sizing: border-box !important;
						font-family: Arial, sans-serif !important;
						font-size: 9px !important;
						background-color: #fff !important;
						color: #000 !important;
						border: 1px solid #000 !important;
						display: flex !important;
						flex-direction: column !important;
					}
					
					@page {
						size: 80mm 60mm;
						margin: 0;
					}
				}
			`}</style>
		</>
	);
};

export default PrintLabel;
