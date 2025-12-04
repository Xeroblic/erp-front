import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { deleteSubsidiaria } from '@/store/slices/subempresa/subEmpresaSlice';
import { useAppDispatch } from '@/store';

interface DeleteSubempresaModalProps {
	isOpen: boolean;
	onClose: () => void;
	subempresaId: number;
	subsiName: string;
	isNavigate?: boolean;
}

export default function DeleteSubempresaModal({
	isOpen,
	onClose,
	subempresaId,
	subsiName,
	isNavigate,
}: DeleteSubempresaModalProps & { subempresaId: number; subsiName: string }) {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const handleDeleteSubsidarie = () => {
		async function deleteSubsidarie() {
			try {
				await dispatch(deleteSubsidiaria(subempresaId)).unwrap();
				toast.success('Subempresa eliminada correctamente');
			} catch (error) {
				toast.error('Error al tratar de eliminar subsidaria');
			}
		}
		deleteSubsidarie();
		if (isNavigate) {
			navigate('/gestion/subempresa');
		} else {
			onClose();
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader className='text-2xl font-bold text-amber-500'>Advertencia</ModalHeader>
			<ModalBody>
				<div className='mb-4 flex items-center gap-3'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
						<Icon icon='HeroExclamationTriangle' className='text-xl text-red-600' />
					</div>
					<div>
						<h3 className='font-medium text-zinc-900 dark:text-zinc-100'>
							¿Eliminar {subsiName}?
						</h3>
						<p className='text-sm text-zinc-500'>Esta acción no se puede deshacer.</p>
					</div>
				</div>
				<p className='text-zinc-700 dark:text-zinc-300'>
					¿Estás seguro de que deseas eliminar esta subempresa? Todos los datos asociados
					se perderán permanentemente.
				</p>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='solid' color='red' onClick={() => handleDeleteSubsidarie()}>
						Eliminar Subempresa
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
}
