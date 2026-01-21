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
import EditQuotationModal from './ModalEditar/EditQuotationModal';
import { useAppDispatch } from '@/store';
import { updateQuote } from '@/store/slices/quotes/quotesSlice';

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

	const handlePrint = async () => {
		if (!quotation) return;
		setIsPrinting(true);
		try {
			const blob = await getPdfBlob();
			if (!blob) throw new Error('No se pudo generar el blob del PDF');
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank');
		} catch (error) {
			console.error(error);
			toast.error('No se pudo preparar la impresión');
		} finally {
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

	// State for Edit Modal
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const dispatch = useAppDispatch();
	const [isUpdating, setIsUpdating] = useState(false);

	const handleEditSubmit = async (values: any) => {
		if (!quotation) return;
		setIsUpdating(true);
		try {
			await dispatch(
				updateQuote({
					subsidiaryId: quotation.subsidiary_id ?? 1,
					quoteId: quotation.id,
					data: values,
				}),
			).unwrap();
			setIsEditModalOpen(false);
			// Optional: toast handled by slice usually, but we can verify
		} catch (error) {
			console.error(error);
			// Error toast handled by slice
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<>
			<Modal
				isOpen={isOpen}
				setIsOpen={onClose}
				size='xl'
				isStaticBackdrop
				isStaticBackdropAnimation
				isAnimation={false}>
				<ModalHeader>
					<div>
						<Badge className='text-xl font-semibold'>Detalles de Cotización</Badge>
						<p className='text-sm text-gray-600 dark:text-white'>{`ID #${quotation?.id ?? ''}`}</p>
					</div>
				</ModalHeader>

				<ModalBody className='max-h-[80vh] overflow-y-auto bg-gray-100 p-6'>
					{isLoading ? (
						<div className='flex items-center justify-center py-16 text-gray-600'>
							<div className='mr-3 h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent' />
							Cargando detalles de la cotización...
						</div>
					) : quotation ? (
						<div
							id={PRINT_CONTAINER_ID}
							className='mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-100'>
							<QuotePrintableView quote={quotation} />
						</div>
					) : (
						<p className='py-6 text-center text-sm text-gray-500'>
							Selecciona una cotización para ver sus detalles.
						</p>
					)}
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild className='mt-8 flex w-full flex-wrap justify-between gap-3'>
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

							{/* Edit Button */}
							<Button
								variant='outline'
								color='amber'
								onClick={() => setIsEditModalOpen(true)}
								isDisable={!quotation || isLoading}>
								Editar
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

							<Button
								color='blue'
								onClick={handlePrint}
								isDisable={!quotation || isPrinting}>
								{isPrinting ? 'Generando PDF…' : 'Imprimir'}
							</Button>
						</div>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			{quotation && (
				<EditQuotationModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					onSubmit={handleEditSubmit}
					quotation={quotation}
					loading={isUpdating}
				/>
			)}
		</>
	);
};

export { QuotationDetailsModal };
