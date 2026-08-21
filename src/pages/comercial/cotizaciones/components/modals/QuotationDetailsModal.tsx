import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import QuotePrintableView from '../QuotePrintableView';
import type { IQuote } from '../../../../../interface/quotes.interface';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
import ApiService from '@/services/ApiService';
import Badge from '@/components/ui/Badge';
import EditQuotationModal from './ModalEditar/EditQuotationModal';
import { useAppDispatch, RootState } from '@/store';
import { updateQuote } from '@/store/slices/quotes/quotesSlice';
import { useSelector } from 'react-redux';
import Tooltip from '@/components/ui/Tooltip';

interface QuotationDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	quotation: IQuote | null;
	isLoading: boolean;
	onDownloadPdf?: (id: number) => void;
	/** Aprueba la cotización (status → approved) y refresca el detalle en el padre. */
	onApprove?: () => Promise<void>;
}

const PRINT_CONTAINER_ID = 'quote-printable-container';

const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
	isOpen,
	onClose,
	quotation,
	isLoading,
	onDownloadPdf,
	onApprove,
}) => {
	const [downloading, setDownloading] = useState(false);
	const [isPrinting, setIsPrinting] = useState(false);
	const [approving, setApproving] = useState(false);
	const navigate = useNavigate();

	const currentUser = useSelector((state: RootState) => state.auth.user);

	const getPdfBlob = async () => {
		if (!quotation) return null;
		const { generateQuotePdf } = await import('../../utils/pdf/generateQuotePdf');
		return generateQuotePdf(quotation, currentUser);
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

		// If already converted, redirect to sale
		if (quotation.is_converted_to_sale) {
			const saleId = quotation.sale?.id || quotation.sale_id;
			if (saleId) {
				onClose();
				navigate(`/comercial/ventas/${saleId}`);
			} else {
				toast.error('No se encontró el ID de la venta asociada');
			}
			return;
		}

		if (
			!window.confirm('¿Estás seguro de que deseas convertir esta cotización en una venta?')
		) {
			return;
		}

		try {
			setConverting(true);

			const res = await ApiService.fetchNormalized({
				url: `/subsidiaries/${quotation.subsidiary_id}/quotes/${quotation.id}/convert-to-sale`,
				method: 'POST',
				data: {
					sale_number: null,
				},
			});

			toast.success('Cotización convertida en venta correctamente');
			onClose();

			// Redirect to the new sale
			const saleId = res?.sale?.id || res?.data?.sale?.id;
			if (saleId) {
				navigate(`/comercial/ventas/${saleId}`);
			}
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

	// Flujo de la cotización: draft/sent → [Aprobar] → approved → [Generar Venta]
	// → converted → [Ir a Venta Realizada]. Los botones se muestran según el estado.
	const normalizedStatus = String(quotation?.status ?? '').toLowerCase();
	const isConverted = !!quotation?.is_converted_to_sale || normalizedStatus === 'converted';
	const isApproved = normalizedStatus === 'approved';
	const canApprove =
		!isConverted && (normalizedStatus === 'draft' || normalizedStatus === 'sent');

	// La venta asociada ya está cerrada/completada: el estado real del ERP (is_closed)
	// o el status completed/closed lo determinan.
	const linkedSale = quotation?.sale ?? null;
	const linkedSaleStatus = String(linkedSale?.status ?? '').toLowerCase();
	const isLinkedSaleClosed =
		!!linkedSale?.is_closed ||
		linkedSaleStatus === 'completed' ||
		linkedSaleStatus === 'closed';

	// No se puede editar una cotización ya convertida o cuya venta esté cerrada:
	// editarla descuadraría los datos respecto de la venta ya emitida.
	const editBlocked = isConverted || isLinkedSaleClosed;

	const handleApprove = async () => {
		if (!onApprove || approving) return;
		setApproving(true);
		try {
			await onApprove();
			toast.success('Cotización aprobada');
		} catch (error) {
			console.error(error);
			toast.error('No se pudo aprobar la cotización');
		} finally {
			setApproving(false);
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
							<Tooltip text='cerrar' placement='top-end'>
								<Button
									variant='solid'
									color='red'
									className='hover:bg-red-700/20'
									onClick={onClose}>
									Cerrar
								</Button>
							</Tooltip>

							{/* Editar: se oculta cuando la cotización ya está convertida o su
							    venta está cerrada (editarla descuadraría con la venta). */}
							{!editBlocked && (
								<Tooltip text='editar' placement='top-end'>
									<Button
										variant='solid'
										color='amber'
										className='hover:bg-amber-700/20'
										onClick={() => setIsEditModalOpen(true)}
										isDisable={!quotation || isLoading}>
										Editar
									</Button>
								</Tooltip>
							)}

							<Tooltip text='descargar' placement='top-end'>
								<Button
									variant='solid'
									color='sky'
									className='hover:bg-sky-700/20'
									onClick={handleDownload}
									isDisable={!quotation}
									isLoading={downloading}>
									Descargar PDF
								</Button>
							</Tooltip>

							{/* Aprobar: solo en borrador/enviada. Al aprobar se habilita
							    "Generar Venta". */}
							{canApprove && (
								<Tooltip text='aprobar cotización' placement='top-end'>
									<Button
										variant='solid'
										color='teal'
										className='hover:bg-teal-700/20'
										onClick={handleApprove}
										isDisable={!quotation || isLoading || approving}
										isLoading={approving}>
										Aprobar
									</Button>
								</Tooltip>
							)}

							{/* Generar Venta: solo cuando está aprobada y aún no convertida. */}
							{isApproved && !isConverted && (
								<Tooltip text='convertir a venta' placement='top-end'>
									<Button
										variant='solid'
										color='emerald'
										onClick={handleConvertToSale}
										isDisable={!quotation}
										className='text-emerald-700 hover:bg-emerald-700/20'
										isLoading={converting}>
										Generar Venta
									</Button>
								</Tooltip>
							)}

							{/* Ir a la venta ya creada. */}
							{isConverted && (
								<Tooltip text='ir a la venta realizada' placement='top-end'>
									<Button
										variant='solid'
										color='blue'
										onClick={handleConvertToSale}
										isDisable={!quotation}
										className='text-blue-700 hover:bg-blue-700/20'
										isLoading={converting}>
										Ir a Venta Realizada
									</Button>
								</Tooltip>
							)}
							<Tooltip text='imprimir' placement='top-end'>
								<Button
									variant='solid'
									color='blue'
									className='hover:bg-blue-700/20'
									onClick={handlePrint}
									isDisable={!quotation || isPrinting}>
									{isPrinting ? 'Generando PDF…' : 'Imprimir'}
								</Button>
							</Tooltip>
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
