import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import type { IBatchAdjustStockPayload } from '@/interface/stock.interface';

interface InventoryImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	branchId: number | null;
	onSubmit: (payload: IBatchAdjustStockPayload) => Promise<void>;
	isSubmitting: boolean;
}

const parseCsv = (content: string): string[][] => {
	return content
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map((line) => {
			const values: string[] = [];
			let current = '';
			let inQuotes = false;
			for (let index = 0; index < line.length; index += 1) {
				const char = line[index];
				if (char === '"') {
					if (inQuotes && line[index + 1] === '"') {
						current += '"';
						index += 1;
					} else {
						inQuotes = !inQuotes;
					}
					continue;
				}
				if (char === ',' && !inQuotes) {
					values.push(current);
					current = '';
					continue;
				}
				current += char;
			}
			values.push(current);
			return values.map((value) => value.trim());
		});
};

const InventoryImportModal: React.FC<InventoryImportModalProps> = ({
	isOpen,
	onClose,
	branchId,
	onSubmit,
	isSubmitting,
}) => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [reason, setReason] = useState('Ajuste masivo por importación');
	const [notes, setNotes] = useState('');

	const resetState = () => {
		setSelectedFile(null);
		setReason('Ajuste masivo por importación');
		setNotes('');
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const handleClose = () => {
		if (isSubmitting) return;
		resetState();
		onClose();
	};

	const handleImport = async () => {
		if (!branchId) {
			toast.error('Debes seleccionar una sucursal para importar inventario');
			return;
		}
		if (!selectedFile) {
			toast.info('Selecciona un archivo CSV para importar');
			return;
		}
		if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
			toast.error('Solo se admite importación de archivos CSV');
			return;
		}
		const content = await selectedFile.text();
		const rows = parseCsv(content);
		if (rows.length < 2) {
			toast.error('El archivo no contiene datos de inventario');
			return;
		}
		const headers = rows[0].map((value) => value.toLowerCase());
		const productIdIndex = headers.indexOf('product_id');
		const quantityChangeIndex = headers.indexOf('quantity_change');
		if (productIdIndex === -1 || quantityChangeIndex === -1) {
			toast.error('El CSV debe incluir las columnas product_id y quantity_change');
			return;
		}
		const items = rows
			.slice(1)
			.map((row) => {
				const productId = Number(row[productIdIndex] ?? 0);
				const quantityChange = Number(row[quantityChangeIndex] ?? 0);
				if (!Number.isFinite(productId) || productId <= 0) return null;
				if (!Number.isFinite(quantityChange) || quantityChange === 0) return null;
				return {
					product_id: productId,
					quantity_change: quantityChange,
				};
			})
			.filter((item): item is { product_id: number; quantity_change: number } => item !== null);
		if (items.length === 0) {
			toast.error('No se encontraron ajustes válidos en el archivo');
			return;
		}
		await onSubmit({
			branch_id: branchId,
			reason: reason.trim() || 'Ajuste masivo por importación',
			notes: notes.trim() || undefined,
			items,
		});
		resetState();
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered>
			<ModalHeader>Importar inventario</ModalHeader>
			<ModalBody>
				<div className='grid gap-4'>
					<div className='rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300'>
						<p className='font-medium'>Formato esperado</p>
						<p className='mt-1'>Usa un CSV con columnas `product_id` y `quantity_change`.</p>
						<p className='mt-1'>Puedes exportar primero el inventario, completar `quantity_change` y volver a importarlo.</p>
					</div>
					<div>
						<input
							ref={fileInputRef}
							type='file'
							accept='.csv,text/csv'
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const file = event.target.files?.[0] ?? null;
								setSelectedFile(file);
							}}
							className='hidden'
						/>
						<Button variant='outline' icon='HeroDocumentPlus' onClick={() => fileInputRef.current?.click()}>
							{selectedFile ? 'Cambiar archivo' : 'Seleccionar CSV'}
						</Button>
						{selectedFile && <p className='mt-2 text-xs text-neutral-500'>{selectedFile.name}</p>}
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200'>Motivo</label>
						<Input id='inventory-import-reason' name='inventory-import-reason' value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} />
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200'>Notas</label>
						<Input id='inventory-import-notes' name='inventory-import-notes' value={notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} />
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='ml-auto flex items-center gap-3'>
					<Button variant='outline' onClick={handleClose} isDisable={isSubmitting}>Cancelar</Button>
					<Button color='blue' icon='HeroArrowUpTray' onClick={() => void handleImport()} isLoading={isSubmitting}>
						Importar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default InventoryImportModal;
