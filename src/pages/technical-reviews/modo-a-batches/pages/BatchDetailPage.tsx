/**
 * Technical Reviews - Batch Detail
 * Detalle de un lote con BatchDetail y BatchTabs integrados
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchBatchById,
	selectSelectedBatch,
	selectBatchesLoading,
	createItem,
	selectCreating,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import BatchDetail from '@/pages/technical-reviews/components/batches/BatchDetail';
import BatchTabs from '@/pages/technical-reviews/components/batches/BatchTabs';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { EquipmentType } from '@/interface/technicalReviews.interface';
import ApiService from '@/services/ApiService';

const EQUIPMENT_TYPE_OPTIONS: TSelectOption[] = [
	{ value: 'notebook', label: 'Notebook' },
	{ value: 'desktop', label: 'Desktop' },
	{ value: 'aio', label: 'All-in-One' },
	{ value: 'docking', label: 'Docking' },
	{ value: 'monitor', label: 'Monitor' },
];

const TECHNICAL_REVIEWS_PREFIX = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (branchId: number, path: string) =>
	join(TECHNICAL_REVIEWS_PREFIX, `/branches/${branchId}/technical-reviews${path}`);

const BatchDetailPage: React.FC = () => {
	const { batchId } = useParams<{ batchId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const batch = useAppSelector(selectSelectedBatch);
	const batchLoading = useAppSelector(selectBatchesLoading);
	const creatingItem = useAppSelector(selectCreating);
	const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
	const [quickEntrySerial, setQuickEntrySerial] = useState('');
	const [quickEntryError, setQuickEntryError] = useState<string | null>(null);
	const [quickEntryType, setQuickEntryType] = useState<EquipmentType>('notebook');
	const [quickEntrySuccess, setQuickEntrySuccess] = useState<string | null>(null);
	const [missingSerial, setMissingSerial] = useState<string | null>(null);
	const [isMissingSerialModalOpen, setIsMissingSerialModalOpen] = useState(false);
	const [firstReviewDate, setFirstReviewDate] = useState<string | null>(null);
	const [firstReviewLoading, setFirstReviewLoading] = useState(false);
	const isTypeSelectorFocusedRef = useRef(false);
	const quickEntryInputRef = useRef<HTMLInputElement | null>(null);
	const scannerBufferRef = useRef('');
	const scannerTimeoutRef = useRef<number | null>(null);
	const batchNumericId = batch?.id;

	const resetQuickEntryForm = useCallback(() => {
		setQuickEntrySerial('');
		setQuickEntryError(null);
		setQuickEntrySuccess(null);
		setQuickEntryType('notebook');
	}, []);

	const handleQuickEntryModalToggle = useCallback(
		(open: boolean) => {
			setIsQuickEntryOpen(open);
			if (!open) {
				resetQuickEntryForm();
			}
		},
		[resetQuickEntryForm],
	);

	useEffect(() => {
		if (!isQuickEntryOpen) return;
		const handle = window.setTimeout(() => {
			quickEntryInputRef.current?.focus();
		}, 50);
		return () => window.clearTimeout(handle);
	}, [isQuickEntryOpen]);

	const keepQuickEntryFocus = (event?: React.FocusEvent<HTMLInputElement>) => {
		if (!isQuickEntryOpen || isTypeSelectorFocusedRef.current) return;
		const nextElement = event?.relatedTarget as HTMLElement | null;
		if (nextElement && nextElement.closest('[data-quick-entry-allow-blur="true"]')) {
			return;
		}
		window.requestAnimationFrame(() => {
			quickEntryInputRef.current?.focus();
		});
	};

	useEffect(() => {
		if (!batchId || !branchId) return;
		const parsedBatchId = parseInt(batchId);
		dispatch(fetchBatchById({ branchId, batchId: parsedBatchId }));
	}, [dispatch, batchId, branchId]);

	useEffect(() => {
		if (!branchId || !batchNumericId) {
			setFirstReviewDate(null);
			setFirstReviewLoading(false);
			return;
		}

		let isMounted = true;

		const fetchFirstReviewedItem = async () => {
			setFirstReviewLoading(true);
			try {
				const response = await ApiService.fetchData<{ data?: any[] }>({
					url: ep(branchId, '/items'),
					method: 'get',
					params: {
						batch_id: batchNumericId,
						review_status: 'approved',
						sort: 'reviewed_at',
						direction: 'asc',
						per_page: 1,
					},
				});

				const list = Array.isArray(response.data?.data)
					? response.data?.data
					: Array.isArray(response.data)
						? (response.data as any[])
						: [];

				const firstItem = list[0];
				const date =
					firstItem?.reviewed_at ||
					firstItem?.completed_review_at ||
					firstItem?.updated_at ||
					firstItem?.created_at ||
					null;

				if (isMounted) {
					setFirstReviewDate(date ?? null);
				}
			} catch (error) {
				console.error('Error al obtener la primera revisión del lote', error);
				if (isMounted) {
					setFirstReviewDate(null);
				}
			} finally {
				if (isMounted) {
					setFirstReviewLoading(false);
				}
			}
		};

		fetchFirstReviewedItem();

		return () => {
			isMounted = false;
		};
	}, [branchId, batchNumericId]);

	const handleBack = () => {
		navigate('/technical-reviews/batches');
	};

	const handleViewItem = useCallback(
		(itemId: number) => {
			navigate(`/technical-reviews/batches/${batchId}/items/${itemId}`);
		},
		[navigate, batchId],
	);

	const handleQuickEntrySubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();

		if (!batch || !branchId) {
			setQuickEntryError('Selecciona una sucursal y un lote válido antes de continuar');
			return;
		}

		const serial = quickEntrySerial.trim();
		if (!serial) {
			setQuickEntryError('Ingresa el número de serie');
			return;
		}
		if (!quickEntryType) {
			setQuickEntryError('Selecciona el tipo de equipo');
			return;
		}

		try {
			await dispatch(
				createItem({
					branchId,
					data: {
						batch_id: batch.id,
						serial_number: serial,
						equipment_type: quickEntryType,
					},
				}),
			).unwrap();

			setQuickEntrySerial('');
			setQuickEntryError(null);
			setQuickEntrySuccess(`Serie ${serial} registrada en estado pendiente.`);
			dispatch(fetchBatchById({ branchId, batchId: batch.id }));
			toast.success(`Serie ${serial} registrada correctamente.`);
		} catch (error: any) {
			const message =
				typeof error === 'string'
					? error
					: (error?.response?.data?.message ??
						error?.message ??
						'No se pudo registrar la serie');
			setQuickEntryError(message);
		}
	};

	const handleScannedSerial = useCallback(
		async (serial: string) => {
			if (!batch || !branchId) return;
			const normalizedSerial = serial.trim();
			if (!normalizedSerial) return;
			try {
				const response = await ApiService.fetchData<{ data?: any[] }>({
					url: ep(branchId, '/items'),
					method: 'get',
					params: {
						batch_id: batch.id,
						search: normalizedSerial,
						per_page: 1,
					},
				});
				const results = Array.isArray(response.data?.data)
					? response.data?.data
					: Array.isArray(response.data)
						? (response.data as any[])
						: [];

				if (results.length > 0 && results[0]?.id) {
					handleViewItem(results[0].id);
					return;
				}

				setMissingSerial(normalizedSerial);
				setIsMissingSerialModalOpen(true);
			} catch (error) {
				console.error('Error al buscar la serie escaneada', error);
			}
		},
		[batch, branchId, handleViewItem, resetQuickEntryForm],
	);

	useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			if (isQuickEntryOpen) return;
			const activeElement = document.activeElement as HTMLElement | null;
			if (
				activeElement &&
				(activeElement.tagName === 'INPUT' ||
					activeElement.tagName === 'TEXTAREA' ||
					activeElement.isContentEditable)
			) {
				return;
			}

			if (event.key === 'Enter') {
				const buffer = scannerBufferRef.current.trim();
				scannerBufferRef.current = '';
				if (buffer.length >= 3) {
					handleScannedSerial(buffer);
				}
				return;
			}

			if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
				scannerBufferRef.current += event.key;
				if (scannerTimeoutRef.current) {
					window.clearTimeout(scannerTimeoutRef.current);
				}
				scannerTimeoutRef.current = window.setTimeout(() => {
					scannerBufferRef.current = '';
				}, 150);
			}
		};

		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			if (scannerTimeoutRef.current) {
				window.clearTimeout(scannerTimeoutRef.current);
			}
		};
	}, [handleScannedSerial, isQuickEntryOpen]);

	const formatFirstReviewDate = (value: string | null): string => {
		if (!value) return 'Sin revisiones registradas';
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) {
			return value;
		}
		return parsed.toLocaleString('es-CL', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const firstReviewDisplay = firstReviewLoading
		? 'Buscando primera revisión aprobada…'
		: formatFirstReviewDate(firstReviewDate);

	const handleMissingSerialCancel = () => {
		setIsMissingSerialModalOpen(false);
		setMissingSerial(null);
	};

	const handleMissingSerialConfirm = () => {
		if (!missingSerial) return;
		resetQuickEntryForm();
		setQuickEntrySerial(missingSerial);
		setQuickEntrySuccess(null);
		setIsQuickEntryOpen(true);
		setIsMissingSerialModalOpen(false);
	};

	return (
		<>
			<PageWrapper name='batch-detail'>
				<Subheader>
					<SubheaderLeft>
						<Button variant='outline' onClick={handleBack} icon='HeroArrowLeft'>
							Volver
						</Button>
						<div className='ml-3'>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								{batch?.code || `Lote #${batchId}`}
							</h1>
							{batch && (
								<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
									{batch.warehouse?.name || `Bodega #${batch.warehouse_id}`} •{' '}
									Entrada: {batch.entry_date} • Primera revisión aprobada:{' '}
									{firstReviewDisplay}
								</p>
							)}
						</div>
					</SubheaderLeft>

					<SubheaderRight>
						<Button
							variant='outline'
							onClick={() => {
								resetQuickEntryForm();
								setIsQuickEntryOpen(true);
							}}>
							<Icon icon='HeroBolt' className='mr-2 h-4 w-4' />
							Ingreso rápido
						</Button>
						{/* Botón para registrar serie dentro del lote (ruta semántica REST) */}
						<Button
							color='green'
							onClick={() =>
								navigate(`/technical-reviews/batches/${batch?.id}/items/create`)
							}>
							<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
							Registrar Serie
						</Button>
					</SubheaderRight>
				</Subheader>

				<Container>
					{batchLoading ? (
						<Card>
							<CardBody>
								<div className='py-12 text-center'>
									<div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent' />
									<p className='mt-2 text-sm text-gray-600'>Cargando lote...</p>
								</div>
							</CardBody>
						</Card>
					) : !batch ? (
						<Card>
							<CardBody>
								<div className='py-12 text-center text-gray-500'>
									<Icon
										icon='HeroExclamationCircle'
										className='mx-auto mb-3 h-12 w-12 text-gray-400'
									/>
									<p>Lote no encontrado</p>
								</div>
							</CardBody>
						</Card>
					) : (
						<>
							{/* Información general del lote */}
							<BatchDetail batch={batch} />

							{/* Tabs con equipos por tipo */}
							<BatchTabs batch={batch} onItemClick={handleViewItem} />
						</>
					)}
				</Container>
			</PageWrapper>

			<Modal
				isOpen={isQuickEntryOpen}
				setIsOpen={() => handleQuickEntryModalToggle(false)}
				isCentered>
				<ModalHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroBolt' className='h-5 w-5 text-blue-500' />
						<span>Ingreso rápido de serie</span>
					</div>
				</ModalHeader>
				<form onSubmit={handleQuickEntrySubmit}>
					<ModalBody>
						<p className='mb-3 text-sm text-gray-600'>
							Ingresa el número de serie para registrarlo inmediatamente en el lote.
							Se creará en estado <strong>pendiente</strong>.
						</p>
						<Input
							name='quick-entry-serial'
							label='Número de serie'
							placeholder='Ej: NB-001-INGRESO'
							value={quickEntrySerial}
							autoComplete='off'
							ref={quickEntryInputRef}
							onChange={(e) => {
								setQuickEntrySerial(e.target.value);
								if (quickEntryError) setQuickEntryError(null);
								if (quickEntrySuccess) setQuickEntrySuccess(null);
							}}
							onBlur={(event) => keepQuickEntryFocus(event)}
							onKeyDown={(e) => {
								if (e.key === 'Tab') {
									e.preventDefault();
								}
							}}
						/>
						{/* <div
							className='mt-4'
							data-quick-entry-allow-blur='true'
							onPointerDownCapture={() => {
								isTypeSelectorFocusedRef.current = true;
							}}
							onPointerUpCapture={() => {
								window.setTimeout(() => {
									isTypeSelectorFocusedRef.current = false;
								}, 0);
							}}>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200'>
								Tipo de equipo
							</label>
							<SelectReact
								name='quick-entry-type'
								placeholder='Seleccionar tipo'
								options={EQUIPMENT_TYPE_OPTIONS}
								value={
									EQUIPMENT_TYPE_OPTIONS.find(
										(option) => option.value === quickEntryType,
									) || null
								}
								onChange={(option) => {
									const selected = option as TSelectOption | null;
									setQuickEntryType(
										(selected?.value as EquipmentType) || 'notebook',
									);
									if (quickEntryError) setQuickEntryError(null);
									if (quickEntrySuccess) setQuickEntrySuccess(null);
								}}
								onFocus={() => {
									isTypeSelectorFocusedRef.current = true;
								}}
								onBlur={() => {
									isTypeSelectorFocusedRef.current = false;
								}}
							/>
						</div> */}
						{quickEntryError && (
							<p className='mt-2 text-sm text-red-500'>{quickEntryError}</p>
						)}
						{quickEntrySuccess && (
							<p className='mt-2 text-sm text-green-600'>{quickEntrySuccess}</p>
						)}
					</ModalBody>
					<ModalFooter>
						<Button
							variant='outline'
							onClick={() => handleQuickEntryModalToggle(false)}
							isDisable={creatingItem}>
							Cancelar
						</Button>
						<Button
							color='blue'
							onClick={handleQuickEntrySubmit}
							isLoading={creatingItem}>
							Guardar serie
						</Button>
					</ModalFooter>
				</form>
			</Modal>

			<Modal
				isOpen={isMissingSerialModalOpen}
				setIsOpen={handleMissingSerialCancel}
				size='sm'>
				<ModalHeader>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroInformationCircle' className='h-5 w-5 text-amber-500' />
						<span>Serie no encontrada</span>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-gray-600 dark:text-gray-300'>
						La serie{' '}
						<span className='font-mono font-semibold text-gray-900 dark:text-gray-100'>
							{missingSerial}
						</span>{' '}
						no existe en este lote. ¿Deseas crearla mediante ingreso rápido?
					</p>
				</ModalBody>
				<ModalFooter className='flex justify-end gap-3'>
					<Button variant='outline' onClick={handleMissingSerialCancel}>
						Cancelar
					</Button>
					<Button color='green' onClick={handleMissingSerialConfirm}>
						Iniciar ingreso rápido
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default BatchDetailPage;
