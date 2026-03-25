import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Button from '../ui/Button';
import { useAppDispatch } from '@/store';
import { fetchLibraryMedia, type ProductEntityParam } from '@/store/slices/products/productsSlice';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';

interface Props {
	open: boolean;
	entityParam: ProductEntityParam;
	entityId: number;
	onClose: () => void;
	onSelect: (media: any[]) => void;
}

const MediaLibraryModal: React.FC<Props> = ({ open, entityParam, entityId, onClose, onSelect }) => {
	const dispatch = useAppDispatch();
	const [items, setItems] = useState<any[]>([]);
	const [selected, setSelected] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (!open) return;
		(async () => {
			try {
				const res = await dispatch(fetchLibraryMedia({ entityParam, entityId })).unwrap();
				setItems(res.data ?? []);
			} catch (e) {
				// swallow for now; slice has error state
			}
		})();
	}, [open, entityParam, entityId, dispatch]);

	const toggle = (id: string) => {
		setSelected((s) => ({ ...s, [id]: !s[id] }));
	};

	const handleAttach = () => {
		const picked = items.filter((it) => selected[it.id]);
		onSelect(picked);
		onClose();
	};

	return (
		<Modal isOpen={open} setIsOpen={() => onClose()}>
			<ModalHeader>
				<h3 className='text-lg font-semibold'>Biblioteca de media</h3>
			</ModalHeader>
			<ModalBody>
				<div className='grid grid-cols-3 gap-2'>
					{items.map((it) => (
						<label key={it.id} className='block cursor-pointer'>
							<input
								type='checkbox'
								checked={!!selected[it.id]}
								onChange={() => toggle(it.id)}
								className='mr-2'
							/>
							<img
								src={ensureAbsoluteUrl(it.thumb || it.url) ?? undefined}
								alt={it.name || ''}
								className='h-24 w-full object-cover'
							/>
						</label>
					))}
				</div>
				<div className='mt-4 flex justify-end'>
					<Button onClick={onClose} variant='outline'>
						Cerrar
					</Button>
					<Button onClick={handleAttach} className='ml-2'>
						Adjuntar seleccionados
					</Button>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default MediaLibraryModal;
