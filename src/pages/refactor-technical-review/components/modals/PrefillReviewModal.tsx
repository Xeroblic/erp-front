import React, { useState, useEffect, useMemo } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import SelectReact from '@/components/form/SelectReact';
import { useAppDispatch } from '@/store';
import { fetchItems } from '@/store/slices/technicalReviews/thunks/itemsThunks';
import type { IItem } from '@/interface/technicalReviews.interface';

interface PrefillReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	batchId: number | null | undefined;
	productId: number | null | undefined;
	equipmentType: string;
	currentItemId: number;
	onSelectSource: (details: Record<string, any>) => void;
}

const PrefillReviewModal: React.FC<PrefillReviewModalProps> = ({
	isOpen,
	onClose,
	batchId,
	productId,
	equipmentType,
	currentItemId,
	onSelectSource,
}) => {
	const dispatch = useAppDispatch();
	const [items, setItems] = useState<IItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedItemId, setSelectedItemId] = useState<string>('');

	useEffect(() => {
		if (!isOpen) {
			setSelectedItemId('');
			setItems([]);
			return;
		}

		const loadItems = async () => {
			if (!batchId) return;
			setLoading(true);
			try {
				const result = await dispatch(
					fetchItems({
						params: {
							batch_id: batchId,
							equipment_type: equipmentType as any,
							per_page: 100, // asumiendo que no habrá más de 100 iguales en un solo lote que sirvan para prefill
						},
					}),
				).unwrap();

				// Filter list
				const filtered = result.items.filter((it) => {
					// Si tenemos productId, exigimos match exacto. Si no, solo verificamos que no sea él mismo y tenga details.
					const matchesProduct = productId ? it.product_id === productId : true;
					const isValid =
						it.id !== currentItemId && it.details && Object.keys(it.details).length > 0;
					return matchesProduct && isValid;
				});

				setItems(filtered);
			} catch (err) {
				console.error('Error loading items for prefill', err);
			} finally {
				setLoading(false);
			}
		};

		loadItems();
	}, [isOpen, batchId, productId, equipmentType, currentItemId, dispatch]);

	const reactSelectOptions = useMemo(() => {
		return items.map((it) => ({
			value: it.id.toString(),
			label: `Serie: ${it.serial_number} - ${
				it.review_status === 'reviewed' || it.review_status === 'approved'
					? 'Completado'
					: 'En progreso'
			}`,
		}));
	}, [items]);

	const handleApply = () => {
		if (!selectedItemId) return;
		const source = items.find((it) => it.id.toString() === selectedItemId);
		if (source && source.details) {
			onSelectSource(source.details);
			onClose();
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} isCentered size='md'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
						<Icon
							icon='HeroBolt'
							className='h-6 w-6 text-blue-600 dark:text-blue-400'
						/>
					</div>
					<span className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
						Pre-rellenar Serie
					</span>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-4 pt-2'>
					<p className='text-sm text-zinc-600 dark:text-zinc-400'>
						Selecciona un equipo del mismo lote y producto que ya haya sido revisado o
						tenga avance guardado para copiar sus opciones en este formulario.
					</p>

					{loading ? (
						<div className='flex justify-center p-6'>
							<span className='text-sm text-zinc-400'>Buscando similares...</span>
						</div>
					) : items.length === 0 ? (
						<div className='rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700/50 dark:bg-zinc-800/50'>
							<p className='text-sm text-zinc-500'>
								No se encontraron otros equipos ({equipmentType}) idénticos en este
								lote con opciones para copiar.
							</p>
						</div>
					) : (
						<div className='pt-2'>
							<SelectReact
								name='prefill-source-select'
								options={reactSelectOptions}
								value={
									reactSelectOptions.find(
										(opt) => opt.value === selectedItemId,
									) || null
								}
								onChange={(selected: any) =>
									setSelectedItemId(selected?.value || '')
								}
								placeholder='Busca y seleccione una serie...'
								isClearable
								isSearchable
							/>
						</div>
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='flex w-full justify-end gap-2'>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
					<Button
						variant='solid'
						color='blue'
						disabled={!selectedItemId || loading}
						onClick={handleApply}
						icon='HeroCheck'>
						Aplicar Datos
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default PrefillReviewModal;
