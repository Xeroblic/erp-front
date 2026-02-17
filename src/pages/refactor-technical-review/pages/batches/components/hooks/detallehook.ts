import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchBatchById,
	updateBatch,
	createItem,
	selectSelectedBatch,
	selectBatchesLoading,
	selectUpdating,
	selectCreating,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { TColors } from '@/types/colors.type';
import { EquipmentType } from '@/interface/technicalReviews.interface';
import ApiService from '@/services/ApiService';

// Helper functions for API URL
const TECHNICAL_REVIEWS_PREFIX =
	(import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (branchId: number, path: string) =>
	join(TECHNICAL_REVIEWS_PREFIX, `/branches/${branchId}/technical-reviews${path}`);

export const useDetalleLote = () => {
	const { batchId } = useParams<{ batchId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const batch = useAppSelector(selectSelectedBatch);
	const loading = useAppSelector(selectBatchesLoading);
	const updatingBatch = useAppSelector(selectUpdating);
	const creatingItem = useAppSelector(selectCreating);

	// ── Editable expected quantity ──────────────────────────────
	const [isEditingExpectedQty, setIsEditingExpectedQty] = useState(false);
	const [expectedQtyDraft, setExpectedQtyDraft] = useState('0');
	const [expectedQtyError, setExpectedQtyError] = useState<string | null>(null);

	// ── Quick Entry & Scanning State ────────────────────────────
	const [activeTab, setActiveTab] = useState<EquipmentType | 'all'>('all'); // Tab state logic
	const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
	const [quickEntrySerial, setQuickEntrySerial] = useState('');
	const [quickEntryError, setQuickEntryError] = useState<string | null>(null);
	const [quickEntryType, setQuickEntryType] = useState<EquipmentType>('notebook');
	const [quickEntrySuccess, setQuickEntrySuccess] = useState<string | null>(null);
	
	const [missingSerial, setMissingSerial] = useState<string | null>(null);
	const [isMissingSerialModalOpen, setIsMissingSerialModalOpen] = useState(false);

	const [operationMode, setOperationMode] = useState<'entry' | 'print'>('entry');
	const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
	const [selectedItemForPrint, setSelectedItemForPrint] = useState<any>(null);

	// Refs for focus management
	const isTypeSelectorFocusedRef = useRef(false);
	const quickEntryInputRef = useRef<HTMLInputElement | null>(null);
	const scannerBufferRef = useRef('');
	const scannerTimeoutRef = useRef<number | null>(null);

	// ── Fetch batch on mount ───────────────────────────────────
	useEffect(() => {
		if (branchId && batchId) {
			dispatch(fetchBatchById({ branchId, batchId: Number(batchId) }));
		}
	}, [dispatch, branchId, batchId]);

	// Sync draft when batch loads
	useEffect(() => {
		if (batch) {
			setExpectedQtyDraft(String(batch.expected_quantity ?? 0));
		}
	}, [batch?.expected_quantity]);

	// ── Expected Qty handlers ──────────────────────────────────
	const handleStartEditingExpectedQty = () => {
		setExpectedQtyDraft(String(batch?.expected_quantity ?? 0));
		setExpectedQtyError(null);
		setIsEditingExpectedQty(true);
	};

	const handleCancelExpectedQty = () => {
		setExpectedQtyDraft(String(batch?.expected_quantity ?? 0));
		setExpectedQtyError(null);
		setIsEditingExpectedQty(false);
	};

	const handleSaveExpectedQty = async () => {
		const parsedValue = Number(expectedQtyDraft);
		if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
			setExpectedQtyError('Ingresa una cantidad válida mayor a 0');
			return;
		}
		if (!branchId || !batch) {
			setExpectedQtyError('Selecciona una sucursal válida antes de guardar');
			return;
		}
		if (parsedValue === (batch.expected_quantity || 0)) {
			setIsEditingExpectedQty(false);
			return;
		}
		try {
			await dispatch(
				updateBatch({
					branchId,
					batchId: batch.id,
					data: { expected_quantity: parsedValue },
				}),
			).unwrap();
			setIsEditingExpectedQty(false);
			setExpectedQtyError(null);
		} catch (error: any) {
			const message =
				typeof error === 'string'
					? error
					: (error?.message ?? 'No se pudo actualizar la cantidad esperada');
			setExpectedQtyError(message);
		}
	};

	// ── Quick Entry Logic ──────────────────────────────────────
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

	// Auto-focus input when modal opens
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

	// ── Scanning Logic ─────────────────────────────────────────
	const handleViewItem = useCallback(
		(itemId: number) => {
			navigate(`/technical-reviews/batches/${batchId}/items/${itemId}`);
		},
		[navigate, batchId],
	);

	const handleScannedSerial = useCallback(
		async (serial: string) => {
			if (!batch || !branchId) return;
			const normalizedSerial = serial.trim();
			
			try {
				const response = await ApiService.fetchData<{ data?: any[] }>({
					url: ep(branchId, '/items'),
					method: 'get',
					params: { batch_id: batch.id, search: normalizedSerial, per_page: 1 },
				});
				const results = response.data?.data || [];
				const foundItem = results[0];

				if (operationMode === 'print') {
					// MODO IMPRESIÓN
					if (foundItem && foundItem.serial_number === normalizedSerial) {
						setSelectedItemForPrint(foundItem);
						setIsPrintModalOpen(true);
					} else {
						toast.error(`La serie "${normalizedSerial}" no existe en este lote.`);
					}
				} else {
					// MODO INGRESO
					if (foundItem && foundItem.id) {
						handleViewItem(foundItem.id);
					} else {
						setMissingSerial(normalizedSerial);
						setIsMissingSerialModalOpen(true);
					}
				}
			} catch (error) {
				console.error('Error en escaneo:', error);
			}
		},
		[batch, branchId, operationMode, handleViewItem]
	);

	// Scanner listener
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

	// ── Modal Handlers ─────────────────────────────────────────
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

	const handleClosePrintModal = useCallback(() => {
		setIsPrintModalOpen(false);
		setSelectedItemForPrint(null);
	}, []);

	// ── Derived values ─────────────────────────────────────────
	const expectedQty = batch?.expected_quantity || 0;
	const receivedQty = batch?.received_quantity || 0;
	const completedQty = batch?.completed_quantity || 0;
	const pendingQty = receivedQty - completedQty;
	const progressPercentage = expectedQty > 0 ? Math.round((completedQty / expectedQty) * 100) : 0;

	const statusColor = (): TColors => {
		if (!batch) return 'zinc';
		const status = String(batch.status).toUpperCase();
		switch (status) {
			case 'DRAFT':
				return 'blue';
			case 'IN_PROGRESS':
				return 'amber';
			case 'COMPLETED':
				return 'emerald';
			case 'CANCELLED':
				return 'red';
			default:
				return 'zinc';
		}
	};

	return {
		batch,
		loading,
		updatingBatch,
		creatingItem,
		navigate,
		// Expected quantity editing
		isEditingExpectedQty,
		expectedQtyDraft,
		setExpectedQtyDraft,
		expectedQtyError,
		setExpectedQtyError,
		handleStartEditingExpectedQty,
		handleCancelExpectedQty,
		handleSaveExpectedQty,
		// Derived values
		expectedQty,
		receivedQty,
		completedQty,
		pendingQty,
		progressPercentage,
		statusColor,
		// Scanner & Operation Mode
		operationMode,
		setOperationMode,
		// Quick Entry Modal
		isQuickEntryOpen,
		handleQuickEntryModalToggle,
		quickEntrySerial,
		setQuickEntrySerial,
		quickEntryType,
		setQuickEntryType,
		quickEntryError,
		setQuickEntryError,
		quickEntrySuccess,
		setQuickEntrySuccess,
		handleQuickEntrySubmit,
		quickEntryInputRef,
		keepQuickEntryFocus,
		isTypeSelectorFocusedRef,
		// Missing Serial Modal
		isMissingSerialModalOpen,
		missingSerial,
		handleMissingSerialCancel,
		handleMissingSerialConfirm,
		// Print Modal
		isPrintModalOpen,
		selectedItemForPrint,
		handleClosePrintModal,
		// Filtering
		activeTab,
		setActiveTab,
	};
};
