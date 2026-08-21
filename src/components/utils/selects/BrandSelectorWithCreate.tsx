import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch } from '@/store';
import { createBrand, fetchBrands, deleteBrand } from '@/store/slices/brands/brandsSlice';
import { BrandDedupModal } from '@/components/utils/QuickProductFlow/components/BrandDedupModal';
import type { IBrandForDedup } from '@/components/utils/QuickProductFlow/types/types';

// Copied deduplication utils
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

const findDuplicateBrands = (brands: IBrandForDedup[], targetBrandId: number): IBrandForDedup[] => {
	if (!brands.length || !targetBrandId) return [];
	const target = brands.find((b) => b.id === targetBrandId);
	if (!target) return [];
	const targetNormalized = normalizeName(target.name);
	return brands.filter((b) => isPotentialDuplicate(targetNormalized, normalizeName(b.name)));
};

interface BrandSelectorWithCreateProps {
	name: string;
	branchId: number | null;
	value: string | number | null;
	onChange: (brandId: string) => void;
	onBlur?: () => void;
	brandOptions: TSelectOption[];
	brandsLoading?: boolean;
	isDisabled?: boolean;
	placeholder?: string;
}

const BrandSelectorWithCreate: React.FC<BrandSelectorWithCreateProps> = ({
	name,
	branchId,
	value,
	onChange,
	onBlur,
	brandOptions,
	brandsLoading,
	isDisabled,
	placeholder,
}) => {
	const dispatch = useAppDispatch();
	const [isCreatingBrand, setIsCreatingBrand] = useState(false);

	// Dedup state
	const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
	const [dedupCandidates, setDedupCandidates] = useState<IBrandForDedup[]>([]);
	const [dedupDefaultKeepId, setDedupDefaultKeepId] = useState<number | null>(null);
	const [isDedupSubmitting, setIsDedupSubmitting] = useState(false);

	const handleCreateBrand = useCallback(
		async (brandName: string) => {
			if (!branchId) {
				toast.warning('Selecciona una sucursal primero para crear la marca');
				return;
			}
			const normalizedName = brandName.trim();
			if (!normalizedName) {
				toast.warn('Ingresa un nombre válido para la marca.');
				return;
			}

			setIsCreatingBrand(true);
			try {
				const createdBrand = await dispatch(
					createBrand({
						branchId,
						data: { name: normalizedName, is_active: true },
					}),
				).unwrap();

				const reloadedBrands = await dispatch(
					fetchBrands({ branchId, search: '' }),
				).unwrap();

				if (reloadedBrands?.items) {
					const brandList = reloadedBrands.items.map((b) => ({
						id: Number(b.id),
						name: b.name,
					}));
					const duplicates = findDuplicateBrands(brandList, createdBrand.id);

					if (duplicates.length > 1) {
						setDedupCandidates(duplicates);
						setDedupDefaultKeepId(createdBrand.id);
						setIsDedupModalOpen(true);
						onChange(String(createdBrand.id));
						toast.info('Detectamos marcas similares. Elige cuál conservar.');
						return;
					}
				}

				onChange(String(createdBrand.id));
				toast.success(`Marca "${createdBrand.name}" creada exitosamente`);
			} catch (error) {
				toast.error('Ocurrió un error al crear la marca');
			} finally {
				setIsCreatingBrand(false);
			}
		},
		[branchId, dispatch, onChange],
	);

	const onResolveBrandDedup = useCallback(
		async (keepBrandId: number) => {
			if (!branchId || !dedupCandidates.length || !keepBrandId) return;

			setIsDedupSubmitting(true);
			try {
				const toDelete = dedupCandidates.filter((b) => b.id !== keepBrandId);

				for (const badBrand of toDelete) {
					try {
						await dispatch(deleteBrand({ branchId, brandId: badBrand.id })).unwrap();
					} catch {
						toast.warning(`No se pudo eliminar la marca duplicada: ${badBrand.name}`);
					}
				}

				if (toDelete.length) {
					toast.info(`Se conservará la marca seleccionada.`);
				}

				onChange(String(keepBrandId));
				setIsDedupModalOpen(false);
			} catch (error) {
				toast.error(`Error al resolver duplicados`);
			} finally {
				setIsDedupSubmitting(false);
			}
		},
		[branchId, dedupCandidates, dispatch, onChange],
	);

	const handleCancelDedup = useCallback(async () => {
		if (dedupDefaultKeepId && branchId) {
			setIsDedupSubmitting(true);
			try {
				await dispatch(deleteBrand({ branchId, brandId: dedupDefaultKeepId })).unwrap();
				toast.info('Creación de marca cancelada.');
				onChange('');
			} catch (error) {
				toast.error('No se pudo cancelar la creación de la marca por completo.');
			} finally {
				setIsDedupSubmitting(false);
				setIsDedupModalOpen(false);
			}
		} else {
			setIsDedupModalOpen(false);
		}
	}, [dedupDefaultKeepId, branchId, dispatch, onChange]);

	const selectedOption = brandOptions.find((opt) => String(opt.value) === String(value)) || null;

	return (
		<>
			<SelectReact
				name={name}
				options={brandOptions}
				value={selectedOption}
				isCreatable={true}
				onCreateOption={handleCreateBrand}
				isLoading={brandsLoading || isCreatingBrand}
				onChange={(option) => {
					if (Array.isArray(option)) {
						onChange('');
						return;
					}
					const singleOption = (option ?? null) as TSelectOption | null;
					onChange(singleOption?.value ?? '');
				}}
				onBlur={onBlur}
				placeholder={placeholder}
				isDisabled={isDisabled || isCreatingBrand}
			/>

			{isDedupModalOpen && (
				<BrandDedupModal
					isOpen={isDedupModalOpen}
					onClose={handleCancelDedup}
					candidates={dedupCandidates}
					defaultKeepId={dedupDefaultKeepId}
					isSubmitting={isDedupSubmitting}
					onResolve={onResolveBrandDedup}
				/>
			)}
		</>
	);
};

export default BrandSelectorWithCreate;
