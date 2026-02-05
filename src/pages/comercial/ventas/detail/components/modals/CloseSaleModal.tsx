import React, { useMemo, useState, useEffect, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { useAppDispatch } from '@/store';
import { closeSaleThunk } from '@/store/slices/salesSlice';
import { ICloseSaleRequest, ISaleItem } from '@/interface';
// import CloseSaleItemRow from './CloseSaleItemRow'; // Ensure this matches filename
import CloseSaleItemRow from './CloseSaleItemRow';

type CloseSalePayloadItem = ICloseSaleRequest['items'][number];

interface Props {
	open: boolean;
	onClose: () => void;
	subsidiaryId: number;
	saleId: number;
	items: ISaleItem[];
	onSuccess?: () => void;
}

const CloseSaleModal: React.FC<Props> = ({
	open,
	onClose,
	subsidiaryId,
	saleId,
	items,
	onSuccess,
}) => {
	const dispatch = useAppDispatch();
	const confirmButtonRef = useRef<HTMLButtonElement>(null);

	// State: itemId -> array of serial strings
	const [serialInputs, setSerialInputs] = useState<Record<number, string[]>>({});
	// State: itemId -> index -> error message
	const [inputErrors, setInputErrors] = useState<Record<number, Record<number, string>>>({});

	const [globalError, setGlobalError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Initialize state on open
	useEffect(() => {
		if (open) {
			const initial: Record<number, string[]> = {};
			items.forEach((it) => {
				const qty = Math.max(1, Math.round(it.quantity));
				initial[it.id] = Array(qty).fill('');
			});
			setSerialInputs(initial);
			setInputErrors({});
			setGlobalError(null);

			// Auto-focus first input after a short delay to allow render
			setTimeout(() => {
				if (items.length > 0) {
					const firstId = `serial-input-${items[0].id}-0`;
					const el = document.getElementById(firstId);
					el?.focus();
				}
			}, 100);
		}
	}, [open, items]);

	const handleSerialChange = React.useCallback(
		(itemId: number, index: number, val: string) => {
			setSerialInputs((prev) => {
				const currentList = prev[itemId] ? [...prev[itemId]] : [];
				currentList[index] = val;
				return { ...prev, [itemId]: currentList };
			});
			// Clear error for this specific input on change
			if (inputErrors[itemId]?.[index]) {
				setInputErrors((prev) => {
					const itemErrors = { ...prev[itemId] };
					delete itemErrors[index];
					return { ...prev, [itemId]: itemErrors };
				});
			}
		},
		[inputErrors],
	);

	const handleEnter = React.useCallback(
		(currentItemId: number, currentIndex: number) => {
			// Find current item index in list
			const itemIndex = items.findIndex((it) => it.id === currentItemId);
			if (itemIndex === -1) return;

			const currentItem = items[itemIndex];
			const qty = Math.max(1, Math.round(currentItem.quantity));

			// 1. Try next index in same item
			if (currentIndex + 1 < qty) {
				const nextId = `serial-input-${currentItemId}-${currentIndex + 1}`;
				document.getElementById(nextId)?.focus();
				return;
			}

			// 2. Try next item, index 0
			if (itemIndex + 1 < items.length) {
				const nextItem = items[itemIndex + 1];
				const nextId = `serial-input-${nextItem.id}-0`;
				document.getElementById(nextId)?.focus();
				return;
			}

			// 3. Focus confirm button
			confirmButtonRef.current?.focus();
		},
		[items],
	);

	const parsedPayload = useMemo<CloseSalePayloadItem[]>(() => {
		return items
			.map((it) => {
				const serials = (serialInputs[it.id] || []).map((s) => s.trim()).filter(Boolean);

				// Generate description if serials exist
				const description =
					serials.length > 0 ? `N° Serie: ${serials.join(', ')}` : undefined;

				return {
					sale_item_id: it.id,
					serial_numbers: serials,
					product_detail: description,
				};
			})
			.filter((p) => p.serial_numbers.length > 0);
	}, [items, serialInputs]);

	const validate = (): boolean => {
		let isValid = true;
		const newErrors: Record<number, Record<number, string>> = {};

		items.forEach((it) => {
			const inputs = serialInputs[it.id] || [];
			const qty = Math.max(1, Math.round(it.quantity));

			// Check if all inputs for this item are filled?
			// User requirement said "Captured serial numbers mandatory".
			// Let's check for empty slots.
			for (let i = 0; i < qty; i++) {
				if (!inputs[i] || inputs[i].trim() === '') {
					if (!newErrors[it.id]) newErrors[it.id] = {};
					newErrors[it.id][i] = 'Requerido';
					isValid = false;
				}
			}
		});

		setInputErrors(newErrors);
		if (!isValid) {
			setGlobalError('Por favor complete todas las series requeridas.');
		}
		return isValid;
	};

	const handleClose = () => {
		setGlobalError(null);
		setInputErrors({});
		setIsSubmitting(false);
		onClose();
	};

	const handleConfirm = async () => {
		if (!validate()) return;

		setIsSubmitting(true);
		setGlobalError(null);
		try {
			const res = await dispatch(
				closeSaleThunk({ subsidiaryId, saleId, items: parsedPayload }),
			).unwrap();
			// Success
			onSuccess?.();
			handleClose();
		} catch (err: any) {
			console.error('Close Sale Error', err);
			// Try to map backend errors
			// Assuming backend returns 422 with errors keyed by payload index or something
			// For now, just show global
			const msg = err.message || 'Error al cerrar venta';
			setGlobalError(msg);

			// If we could parse detailed errors from backend (e.g. "items.0.serial_numbers.1": "Duplicate"),
			// we would map them to setInputErrors here.
			// Currently generic mapping:
			if (err.errors && typeof err.errors === 'object') {
				// Example backend error: "items.0.serial_numbers.0": ["Has already been taken"]
				// parsedPayload is what we sent. We need to map back to sale_item_id.

				const newBackendErrors: Record<number, Record<number, string>> = {};

				Object.keys(err.errors).forEach((key) => {
					// Detect pattern items.X.serial_numbers.Y
					// itemIndex X maps to parsedPayload[X]
					const match = key.match(/items\.(\d+)\.serial_numbers\.(\d+)/);
					if (match) {
						const payloadIndex = Number(match[1]); // Index in the sent array
						const serialIndex = Number(match[2]); // Index in the serials array

						const payloadItem = parsedPayload[payloadIndex];
						if (payloadItem) {
							const itemId = payloadItem.sale_item_id;
							if (!newBackendErrors[itemId]) newBackendErrors[itemId] = {};
							newBackendErrors[itemId][serialIndex] = err.errors[key][0];
						}
					}
				});

				if (Object.keys(newBackendErrors).length > 0) {
					setInputErrors(newBackendErrors);
				}
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal
			isOpen={open}
			setIsOpen={handleClose}
			size='xl'
			isScrollable
			isStaticBackdrop
			isStaticBackdropAnimation
			isAnimation={false}>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30'>
						<Icon
							icon='HeroClipboardDocumentCheck'
							className='h-6 w-6 text-emerald-700 dark:text-emerald-300'
						/>
					</div>
					<div>
						<Badge className='text-lg font-bold'>Cerrar venta (Escanear Series)</Badge>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>
							Escanee o ingrese las series. Presione Enter para saltar al siguiente
							campo.
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody className='space-y-4'>
				{globalError && (
					<Alert
						color='red'
						colorIntensity='500'
						variant='outline'
						icon='HeroExclamationTriangle'
						className='text-sm'>
						{globalError}
					</Alert>
				)}

				<div className='max-h-[60vh] space-y-3 overflow-y-auto pr-1'>
					{items.map((it) => (
						<CloseSaleItemRow
							key={it.id}
							item={it}
							values={serialInputs[it.id] || []}
							onChange={handleSerialChange}
							errors={inputErrors[it.id]}
							onEnter={handleEnter}
						/>
					))}

					{items.length === 0 && (
						<div className='rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300'>
							No hay ítems que requieran serie.
						</div>
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='flex w-full justify-end gap-3'>
					<Button
						variant='solid'
						onClick={handleClose}
						color='red'
						isDisable={isSubmitting}
						icon='HeroXMark'>
						Cancelar
					</Button>
					<Button
						ref={confirmButtonRef}
						color='emerald'
						variant='solid'
						onClick={handleConfirm}
						isLoading={isSubmitting}
						isDisable={isSubmitting || items.length === 0}
						icon={isSubmitting ? 'DuoLoading' : 'HeroCheckCircle'}>
						Confirmar cierre
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default CloseSaleModal;
