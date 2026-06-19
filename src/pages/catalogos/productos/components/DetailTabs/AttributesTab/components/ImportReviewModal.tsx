import React, { useCallback, useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import ApiService from '@/services/ApiService';

interface ImportReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImport: (details: Record<string, unknown>) => void;
	productId?: number;
}

interface ReviewItem {
	id: number;
	serial_number: string;
	equipment_type: string;
	review_status: string;
	grade: string | null;
	details: Record<string, unknown> | null;
	product?: { id: number; name: string } | null;
}

const ImportReviewModal: React.FC<ImportReviewModalProps> = ({ isOpen, onClose, onImport }) => {
	const { branchId } = useCurrentBranch();
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<ReviewItem[]>([]);

	const handleSearch = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!search.trim() || !branchId) return;

			setLoading(true);
			setError(null);
			try {
				const resp = await ApiService.fetchData<{ data?: unknown[] }>({
					url: `/branches/${branchId}/technical-reviews/items`,
					method: 'get',
					params: {
						search: search.trim(),
						review_status: 'approved',
						per_page: 20,
					},
				});
				const raw = resp.data?.data ?? resp.data;
				const items = Array.isArray(raw) ? (raw as ReviewItem[]) : [];
				setResults(items);
				if (items.length === 0) {
					setError('No se encontraron revisiones aprobadas con ese serial.');
				}
			} catch {
				setError('Error al buscar revisiones.');
			} finally {
				setLoading(false);
			}
		},
		[search, branchId],
	);

	const handleSelect = (item: ReviewItem) => {
		if (!item.details) return;
		onImport(item.details);
	};

	const handleClose = () => {
		setSearch('');
		setResults([]);
		setError(null);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => handleClose()} size='lg' isScrollable isCentered>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroArrowDownTray' className='h-5 w-5 text-violet-500' />
					Importar desde revisión técnica
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<p className='text-sm text-neutral-500 dark:text-neutral-400'>
						Busca una revisión técnica aprobada por número de serie para pre-llenar los
						atributos.
					</p>

					<form onSubmit={(e) => void handleSearch(e)} className='flex gap-2'>
						<div className='flex-1'>
							<Input
								id='import-serial-search'
								name='import-serial-search'
								type='text'
								placeholder='Número de serie del equipo…'
								value={search}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setSearch(e.target.value)
								}
								aria-label='Buscar por número de serie'
							/>
						</div>
						<Button
							type='submit'
							variant='solid'
							color='blue'
							size='default'
							icon='HeroMagnifyingGlass'
							isDisable={loading || !search.trim()}
							isLoading={loading}>
							Buscar
						</Button>
					</form>

					{error && (
						<div className='rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300'>
							<Icon icon='HeroInformationCircle' className='mr-1.5 inline h-4 w-4' />
							{error}
						</div>
					)}

					{loading && (
						<div className='flex items-center justify-center py-6'>
							<Icon
								icon='HeroArrowPath'
								className='mr-2 h-5 w-5 animate-spin text-violet-500'
							/>
							<span className='text-sm text-neutral-500'>Buscando…</span>
						</div>
					)}

					{!loading && results.length > 0 && (
						<div className='space-y-2'>
							<p className='text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500'>
								{results.length} resultado{results.length !== 1 ? 's' : ''}
							</p>
							{results.map((item) => (
								<div
									key={item.id}
									className='flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800/50'>
									<div className='min-w-0 flex-1'>
										<div className='flex items-center gap-2'>
											<span className='font-mono text-sm font-semibold text-neutral-800 dark:text-neutral-100'>
												{item.serial_number}
											</span>
											{item.grade && (
												<Badge color='blue' variant='solid'>
													Grado {item.grade}
												</Badge>
											)}
											<Badge color='emerald' variant='outline'>
												{item.equipment_type}
											</Badge>
										</div>
										{item.product?.name && (
											<p className='mt-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
												{item.product.name}
											</p>
										)}
									</div>
									<Button
										variant='solid'
										color='violet'
										size='xs'
										icon='HeroArrowDownTray'
										onClick={() => handleSelect(item)}
										isDisable={!item.details}
										aria-label={`Importar revisión ${item.serial_number}`}>
										Importar
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' color='zinc' size='sm' onClick={handleClose}>
					Cerrar
				</Button>
				<div />
			</ModalFooter>
		</Modal>
	);
};

export default ImportReviewModal;
