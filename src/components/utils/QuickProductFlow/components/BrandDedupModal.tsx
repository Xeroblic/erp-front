/**
 * Modal para resolver duplicados de marca
 * Permite al usuario elegir cuál marca conservar
 */
import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { IBrandForDedup } from '../types/types';

interface BrandDedupModalProps {
	isOpen: boolean;
	onClose: () => void;
	candidates: IBrandForDedup[];
	defaultKeepId: number | null;
	isSubmitting?: boolean;
	onResolve: (keepBrandId: number) => Promise<void>;
}

/**
 * Modal para resolver duplicados de marca
 * Muestra las opciones y permite seleccionar cuál conservar
 */
export const BrandDedupModal: React.FC<BrandDedupModalProps> = ({
	isOpen,
	onClose,
	candidates,
	defaultKeepId,
	isSubmitting = false,
	onResolve,
}) => {
	const [selectedKeepId, setSelectedKeepId] = useState(
		defaultKeepId || (candidates[0]?.id ?? null),
	);

	const handleResolve = async () => {
		if (!selectedKeepId) return;
		await onResolve(selectedKeepId);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<h3 className='text-xl font-bold'>Resolver Marcas Duplicadas</h3>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4'>
					{/* Información */}
					<div className='rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'>
						Se detectaron {candidates.length} marcas similares. Elige cuál deseas
						conservar. Las otras serán eliminadas.
					</div>

					{/* Lista de opciones */}
					<div className='space-y-3'>
						{candidates.map((brand) => (
							<label
								key={brand.id}
								className='flex cursor-pointer items-center gap-3 rounded-md border-2 border-zinc-200 p-3 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20'>
								<input
									type='radio'
									name='keepBrand'
									value={brand.id}
									checked={selectedKeepId === brand.id}
									onChange={(e) => setSelectedKeepId(Number(e.target.value))}
									disabled={isSubmitting}
									className='h-4 w-4'
								/>
								<div className='flex-1'>
									<p className='font-semibold text-zinc-900 dark:text-white'>
										{brand.name}
									</p>
									<p className='text-xs text-zinc-500 dark:text-zinc-400'>
										ID: {brand.id}
									</p>
								</div>
								{selectedKeepId === brand.id && (
									<span className='text-xs font-bold text-green-600 dark:text-green-400'>
										CONSERVAR
									</span>
								)}
							</label>
						))}
					</div>

					{/* Advertencia */}
					<div className='rounded-md bg-red-50 p-3 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-300'>
						<strong>Advertencia:</strong> Las marcas no seleccionadas serán eliminadas
						permanentemente. Este cambio no se puede deshacer.
					</div>
				</div>
			</ModalBody>

			{/* Footer */}
			<ModalFooter>
				<Button color='zinc' variant='outline' onClick={onClose} isDisable={isSubmitting}>
					Cancelar
				</Button>
				<Button
					color='green'
					variant='solid'
					onClick={handleResolve}
					isDisable={isSubmitting || !selectedKeepId}
					isLoading={isSubmitting}>
					{isSubmitting ? 'Resolviendo...' : 'Conservar Seleccionada'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};
