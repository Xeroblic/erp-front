import React, { useEffect, useMemo, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import { toast } from 'react-toastify';
import { useAppDispatch } from '@/store';
import { createItem } from '@/store/slices/technicalReviews';
import type { EquipmentType } from '@/interface/technicalReviews.interface';
import ApiService from '@/services/ApiService';

const TECHNICAL_REVIEWS_PREFIX = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (branchId: number, path: string) =>
	join(TECHNICAL_REVIEWS_PREFIX, `/branches/${branchId}/technical-reviews${path}`);

interface CreateReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	branchId: number | null;
	productOptions: TSelectOption[];
	warehouseOptions: TSelectOption[];
	customerSupplierOptions: TSelectOption[];
	onSuccess: (itemId: number) => void;
}

interface BatchOption extends TSelectOption {
	pendingCount?: number;
	entryDate?: string | null;
}

const EQUIPMENT_OPTIONS: TSelectOption[] = [
	{ value: 'notebook', label: 'Notebook' },
	{ value: 'desktop', label: 'Desktop' },
	{ value: 'aio', label: 'All-in-One' },
	{ value: 'docking', label: 'Docking' },
	{ value: 'monitor', label: 'Monitor' },
];

const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
	isOpen,
	onClose,
	branchId,
	productOptions,
	warehouseOptions,
	customerSupplierOptions,
	onSuccess,
}) => {
	const dispatch = useAppDispatch();
	const [serialNumber, setSerialNumber] = useState('');
	const [selectedProduct, setSelectedProduct] = useState<TSelectOption | null>(null);
	const [selectedEquipment, setSelectedEquipment] = useState<TSelectOption | null>(
		EQUIPMENT_OPTIONS[0],
	);
	const [selectedWarehouse, setSelectedWarehouse] = useState<TSelectOption | null>(null);
	const [selectedCustomerSupplier, setSelectedCustomerSupplier] = useState<TSelectOption | null>(
		null,
	);
	const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
	const [selectedBatch, setSelectedBatch] = useState<BatchOption | null>(null);
	const [manualBatchId, setManualBatchId] = useState<number | null>(null);
	const [loadingBatches, setLoadingBatches] = useState(false);
	const [creatingItem, setCreatingItem] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Reset form whenever modal closes
	useEffect(() => {
		if (!isOpen) {
			setSerialNumber('');
			setSelectedProduct(null);
			setSelectedEquipment(EQUIPMENT_OPTIONS[0]);
			setSelectedWarehouse(null);
			setSelectedCustomerSupplier(null);
			setSelectedBatch(null);
			setError(null);
		}
	}, [isOpen]);

	const fetchOpenBatches = async () => {
		if (!branchId) return;
		setLoadingBatches(true);
		try {
			const response = await ApiService.fetchData<{ data?: any[] }>({
				url: ep(branchId, '/batches'),
				method: 'get',
				params: {
					status: 'open',
					per_page: 100,
				},
			});

			const list = Array.isArray(response.data?.data)
				? response.data?.data
				: Array.isArray(response.data)
					? (response.data as any[])
					: [];

			const options: BatchOption[] = list.map((batch: any) => {
				const entryDate = batch.entry_date
					? new Date(batch.entry_date).toLocaleDateString('es-CL')
					: null;
				const labelParts = [
					batch.code || batch.name || `Lote #${batch.id}`,
					entryDate ? `• ${entryDate}` : null,
					typeof batch.pending_count === 'number'
						? `• Pendientes: ${batch.pending_count}`
						: null,
				].filter(Boolean);

				return {
					value: String(batch.id),
					label: labelParts.join(' '),
					pendingCount:
						typeof batch.pending_count === 'number' ? batch.pending_count : undefined,
					entryDate,
				};
			});

			setBatchOptions(options);

			const manualBatch = list.find((batch: any) => {
				const base =
					`${batch.name ?? ''} ${batch.slug ?? ''} ${batch.code ?? ''}`.toLowerCase();
				return base.includes('manual');
			});

			if (manualBatch) {
				setManualBatchId(manualBatch.id);
				const manualOption =
					options.find((opt) => opt.value === String(manualBatch.id)) ?? null;
				setSelectedBatch((prev) => prev ?? manualOption);
			} else {
				setManualBatchId(null);
			}
		} catch (err: any) {
			setError(err?.message ?? 'No se pudieron cargar los lotes abiertos');
		} finally {
			setLoadingBatches(false);
		}
	};

	useEffect(() => {
		if (isOpen && branchId) {
			fetchOpenBatches();
		}
	}, [isOpen, branchId]);

	const hasManualBatch = Boolean(manualBatchId);

	const equipmentValue = useMemo(
		() => (selectedEquipment ? (selectedEquipment.value as EquipmentType) : undefined),
		[selectedEquipment],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!branchId) {
			setError('Selecciona una sucursal válida');
			return;
		}

		const finalBatchId =
			selectedBatch?.value ?? (manualBatchId !== null ? String(manualBatchId) : null);

		if (!finalBatchId) {
			setError('Debes seleccionar un lote (se recomienda crear uno manual)');
			return;
		}

		if (!serialNumber.trim()) {
			setError('Ingresa el número de serie');
			return;
		}
		if (!equipmentValue) {
			setError('Selecciona el tipo de equipo');
			return;
		}
		if (!selectedWarehouse) {
			setError('Selecciona una bodega');
			return;
		}

		setError(null);
		setCreatingItem(true);

		try {
			const payload = {
				batch_id: Number(finalBatchId),
				serial_number: serialNumber.trim(),
				product_id: selectedProduct ? Number(selectedProduct.value) : undefined,
				equipment_type: equipmentValue,
				warehouse_id: Number(selectedWarehouse.value),
				customer_supplier_id: selectedCustomerSupplier
					? Number(selectedCustomerSupplier.value)
					: undefined,
			};

			const result = await dispatch(
				createItem({
					branchId,
					data: payload,
				}),
			).unwrap();

			toast.success('Revisión creada correctamente');
			onClose();
			onSuccess(result.id);
		} catch (err: any) {
			const message =
				err?.response?.data?.message ?? err?.message ?? 'No se pudo crear la revisión';
			setError(message);
			toast.error(message);
		} finally {
			setCreatingItem(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroClipboardDocumentList' className='h-5 w-5 text-blue-500' />
					<span>Nueva revisión manual</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<form onSubmit={handleSubmit} className='space-y-4'>
					{!hasManualBatch && (
						<Card className='border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'>
							<CardBody className='flex items-start gap-2 text-sm text-amber-700 dark:text-amber-200'>
								<Icon icon='HeroExclamationTriangle' className='mt-0.5 h-4 w-4' />
								<span>
									⚠️ Debe existir un lote "Manual" para registrar revisiones
									sueltas. Crea uno o selecciona un lote existente.
								</span>
							</CardBody>
						</Card>
					)}

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Número de serie <span className='text-red-500'>*</span>
						</label>
						<Input
							name='serial_number'
							value={serialNumber}
							onChange={(e) => setSerialNumber(e.target.value)}
							placeholder='Ej: NB-001-REV'
							autoComplete='off'
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Tipo de equipo <span className='text-red-500'>*</span>
						</label>
						<SelectReact
							name='equipment_type'
							options={EQUIPMENT_OPTIONS}
							value={selectedEquipment}
							onChange={(option) =>
								setSelectedEquipment(option as TSelectOption | null)
							}
							placeholder='Seleccionar tipo'
							isSearchable={false}
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Producto (opcional)
						</label>
						<SelectReact
							name='product_id'
							options={productOptions}
							value={selectedProduct}
							onChange={(option) =>
								setSelectedProduct(option as TSelectOption | null)
							}
							placeholder='Seleccionar producto'
							isClearable
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Bodega <span className='text-red-500'>*</span>
						</label>
						<SelectReact
							name='warehouse_id'
							options={warehouseOptions}
							value={selectedWarehouse}
							onChange={(option) =>
								setSelectedWarehouse(option as TSelectOption | null)
							}
							placeholder='Seleccionar bodega'
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Cliente / Proveedor (opcional)
						</label>
						<SelectReact
							name='customer_supplier_id'
							options={customerSupplierOptions}
							value={selectedCustomerSupplier}
							onChange={(option) =>
								setSelectedCustomerSupplier(option as TSelectOption | null)
							}
							placeholder='Seleccionar cliente/proveedor'
							isClearable
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
							Lote de revisión <span className='text-red-500'>*</span>
						</label>
						<SelectReact
							name='batch_id'
							options={batchOptions}
							value={selectedBatch}
							onChange={(option) => setSelectedBatch(option as BatchOption | null)}
							isLoading={loadingBatches}
							placeholder='Seleccionar lote abierto'
						/>
					</div>

					{error && <p className='text-sm text-red-500'>{error}</p>}

					<div className='flex justify-end gap-2 border-t pt-4'>
						<Button variant='outline' onClick={onClose} isDisable={creatingItem}>
							Cancelar
						</Button>
						<Button color='blue' isLoading={creatingItem}>
							Crear revisión
						</Button>
					</div>
				</form>
			</ModalBody>
		</Modal>
	);
};

export default CreateReviewModal;
