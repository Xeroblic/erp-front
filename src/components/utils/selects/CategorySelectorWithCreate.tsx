import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch } from '@/store';
import { createCategory, fetchCategories, deleteCategory } from '@/store/slices/categories/categoriesSlice';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

// -- Dedup Modal for Categories --
interface CategoryDedupModalProps {
	isOpen: boolean;
	onClose: () => void;
	candidates: { id: number; name: string }[];
	defaultKeepId: number | null;
	isSubmitting?: boolean;
	onResolve: (keepId: number) => Promise<void>;
}

const CategoryDedupModal: React.FC<CategoryDedupModalProps> = ({
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
				<h3 className='text-xl font-bold'>Resolver Categorías Duplicadas</h3>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4'>
					<div className='rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'>
						Se detectaron {candidates.length} categorías similares. Elige cuál deseas
						conservar. Las otras serán eliminadas.
					</div>

					<div className='space-y-3'>
						{candidates.map((cat) => (
							<label
								key={cat.id}
								className='flex cursor-pointer items-center gap-3 rounded-md border-2 border-zinc-200 p-3 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20'>
								<input
									type='radio'
									name='keepCategory'
									value={cat.id}
									checked={selectedKeepId === cat.id}
									onChange={(e) => setSelectedKeepId(Number(e.target.value))}
									disabled={isSubmitting}
									className='h-4 w-4'
								/>
								<div className='flex-1'>
									<p className='font-semibold text-zinc-900 dark:text-white'>
										{cat.name}
									</p>
									<p className='text-xs text-zinc-500 dark:text-zinc-400'>
										ID: {cat.id}
									</p>
								</div>
								{selectedKeepId === cat.id && (
									<span className='text-xs font-bold text-green-600 dark:text-green-400'>
										CONSERVAR
									</span>
								)}
							</label>
						))}
					</div>

					<div className='rounded-md bg-red-50 p-3 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-300'>
						<strong>Advertencia:</strong> Las categorías no seleccionadas serán eliminadas
						permanentemente. Este cambio no se puede deshacer.
					</div>
				</div>
			</ModalBody>

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

// -- Utilities --
const normalizeName = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.trim();

const isPotentialDuplicate = (a: string, b: string): boolean => {
	if (!a || !b) return false;
	if (a === b) return true;
	if (a.includes(b) || b.includes(a)) return true;
	const distance = Math.abs(a.length - b.length);
	if (distance > 1) return false;
	let mismatches = 0;
	let i = 0,
		j = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			i++;
			j++;
			continue;
		}
		mismatches++;
		if (mismatches > 1) return false;
		if (a.length > b.length) i++;
		else if (b.length > a.length) j++;
		else {
			i++;
			j++;
		}
	}
	return true;
};

const findDuplicateCategories = (
	categories: { id: number; name: string }[],
	targetId: number,
) => {
	if (!categories.length || !targetId) return [];
	const target = categories.find((c) => c.id === targetId);
	if (!target) return [];
	const targetNormalized = normalizeName(target.name);
	return categories.filter((c) =>
		isPotentialDuplicate(targetNormalized, normalizeName(c.name)),
	);
};

interface CategorySelectorWithCreateProps {
	name: string;
	branchId: number | null;
	value: TSelectOption[];
	onChange: (options: TSelectOption[]) => void;
	onBlur?: () => void;
	categoryOptions: TSelectOption[];
	categoriesLoading?: boolean;
	isDisabled?: boolean;
	placeholder?: string;
}

const CategorySelectorWithCreate: React.FC<CategorySelectorWithCreateProps> = ({
	name,
	branchId,
	value,
	onChange,
	onBlur,
	categoryOptions,
	categoriesLoading,
	isDisabled,
	placeholder,
}) => {
	const dispatch = useAppDispatch();
	const [isCreatingCategory, setIsCreatingCategory] = useState(false);

	const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
	const [dedupCandidates, setDedupCandidates] = useState<{ id: number; name: string }[]>([]);
	const [dedupDefaultKeepId, setDedupDefaultKeepId] = useState<number | null>(null);
	const [isDedupSubmitting, setIsDedupSubmitting] = useState(false);

	const appendCategoryToValue = useCallback(
		(catId: number, catName: string) => {
			const newOpt: TSelectOption = { value: String(catId), label: catName };
			const filtered = value.filter((v) => v.value !== String(catId));
			onChange([...filtered, newOpt]);
		},
		[value, onChange],
	);

	const removeCategoryFromValue = useCallback(
		(catId: number) => {
			onChange(value.filter((v) => v.value !== String(catId)));
		},
		[value, onChange],
	);

	const handleCreateCategory = useCallback(
		async (categoryName: string) => {
			if (!branchId) {
				toast.warning('Selecciona una sucursal primero para crear la categoría');
				return;
			}
			const normalizedName = categoryName.trim();
			if (!normalizedName) {
				toast.warn('Ingresa un nombre válido para la categoría.');
				return;
			}

			setIsCreatingCategory(true);
			try {
				const createdCategory = await dispatch(
					createCategory({
						branchId,
						data: { name: normalizedName, is_active: true },
					}),
				).unwrap();

				const reloadedCategories = await dispatch(
					fetchCategories({ search: '' }),
				).unwrap();

				if (reloadedCategories?.items) {
					const categoryList = reloadedCategories.items.map((c) => ({
						id: Number(c.id),
						name: c.name,
					}));
					const duplicates = findDuplicateCategories(
						categoryList,
						createdCategory.id,
					);

					if (duplicates.length > 1) {
						setDedupCandidates(duplicates);
						setDedupDefaultKeepId(createdCategory.id);
						setIsDedupModalOpen(true);
						appendCategoryToValue(createdCategory.id, createdCategory.name);
						toast.info('Detectamos categorías similares. Elige cuál conservar.');
						return;
					}
				}

				appendCategoryToValue(createdCategory.id, createdCategory.name);
				toast.success(`Categoría "${createdCategory.name}" creada exitosamente`);
			} catch (error) {
				toast.error('Ocurrió un error al crear la categoría');
			} finally {
				setIsCreatingCategory(false);
			}
		},
		[branchId, dispatch, appendCategoryToValue],
	);

	const handleCancelDedup = useCallback(async () => {
		if (dedupDefaultKeepId) {
			setIsDedupSubmitting(true);
			try {
				await dispatch(deleteCategory(dedupDefaultKeepId)).unwrap();
				toast.info('Creación de categoría cancelada.');
				removeCategoryFromValue(dedupDefaultKeepId);
			} catch (error) {
				toast.error('No se pudo cancelar la creación de la categoría por completo.');
			} finally {
				setIsDedupSubmitting(false);
				setIsDedupModalOpen(false);
			}
		} else {
			setIsDedupModalOpen(false);
		}
	}, [dedupDefaultKeepId, dispatch, removeCategoryFromValue]);

	const onResolveCategoryDedup = useCallback(
		async (keepId: number) => {
			if (!dedupCandidates.length || !keepId) return;

			setIsDedupSubmitting(true);
			try {
				const toDelete = dedupCandidates.filter((c) => c.id !== keepId);

				for (const badCat of toDelete) {
					try {
						await dispatch(deleteCategory(badCat.id)).unwrap();
					} catch {
						toast.warning(`No se pudo eliminar la categoría duplicada: ${badCat.name}`);
					}
				}

				if (toDelete.length) {
					toast.info(`Se conservará la categoría seleccionada.`);
				}

				const keepCat = dedupCandidates.find((c) => c.id === keepId);
				if (dedupDefaultKeepId && keepId !== dedupDefaultKeepId) {
					removeCategoryFromValue(dedupDefaultKeepId);
					if (keepCat) {
						appendCategoryToValue(keepId, keepCat.name);
					}
				}

				setIsDedupModalOpen(false);
			} catch (error) {
				toast.error(`Error al resolver duplicados`);
			} finally {
				setIsDedupSubmitting(false);
			}
		},
		[
			dedupCandidates,
			dedupDefaultKeepId,
			dispatch,
			appendCategoryToValue,
			removeCategoryFromValue,
		],
	);

	return (
		<>
			<SelectReact
				name={name}
				options={categoryOptions}
				value={value}
				isMulti
				isCreatable={true}
				onCreateOption={handleCreateCategory}
				isLoading={categoriesLoading || isCreatingCategory}
				onChange={(option) => {
					const nextOptions = Array.isArray(option) ? option : option ? [option] : [];
					onChange(
						nextOptions.map((item) => ({
							value: item.value,
							label: item.label,
						})),
					);
				}}
				onBlur={onBlur}
				placeholder={placeholder}
				isDisabled={isDisabled || isCreatingCategory}
			/>

			{isDedupModalOpen && (
				<CategoryDedupModal
					isOpen={isDedupModalOpen}
					onClose={handleCancelDedup}
					candidates={dedupCandidates}
					defaultKeepId={dedupDefaultKeepId}
					isSubmitting={isDedupSubmitting}
					onResolve={onResolveCategoryDedup}
				/>
			)}
		</>
	);
};

export default CategorySelectorWithCreate;
