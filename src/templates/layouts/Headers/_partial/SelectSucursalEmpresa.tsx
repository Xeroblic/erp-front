import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { GroupBase } from 'react-select';
import SelectReact, { TSelectGroups, TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	selectPersonalizacionUsuario,
	selectIsInitialized as selectPersonalizacionInitialized,
	obtenerPersonalizacionThunk,
	actualizarSucursalPrincipalThunk,
} from '@/store/slices/personalizacion/personalizacionSlice';
import { setTechnicalReviewsContext } from '@/store/slices/technicalReviews';
import { selectUserBranches, type UserBranchInfo } from '@/store/selectors/userBranchesSelectors';
import ApiService from '@/services/ApiService';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

type BranchOptionMeta = {
	branch: UserBranchInfo;
	isPreferred: boolean;
};

type BranchOption = TSelectOption & {
	meta?: BranchOptionMeta;
};

const EMPTY_SUBSIDIARY_ACCESS: Array<{ id?: number | null }> = [];

const FALLBACK_GROUP_LABEL = 'Sucursales';

const buildGroupLabel = (branch: UserBranchInfo): string => {
	if (branch.subsidiaryName) return branch.subsidiaryName;
	if (branch.companyName) return branch.companyName;
	return FALLBACK_GROUP_LABEL;
};

const SelectSucursalEmpresa = () => {
	const dispatch = useAppDispatch();
	const { user } = useAppSelector((state) => state.auth);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const personalizacionInitialized = useAppSelector(selectPersonalizacionInitialized);

	useEffect(() => {
		if (!personalizacionInitialized) {
			void dispatch(obtenerPersonalizacionThunk());
		}
	}, [dispatch, personalizacionInitialized]);

	const branches = useAppSelector(selectUserBranches);
	// Los datos vienen del store (sin fetch): no hay estados de carga/error.
	const branchesLoading = false;
	const branchesError: string | null = null;

	const accessibleSubsidiaryIds = useMemo(() => {
		const subsidiaries = new Set<number>();
		const availableSubsidiaries = user?.access?.subsidiaries ?? EMPTY_SUBSIDIARY_ACCESS;
		availableSubsidiaries.forEach((sub) => {
			if (sub?.id) subsidiaries.add(sub.id);
		});
		return subsidiaries;
	}, [user?.access?.subsidiaries]);

	const filteredBranches = useMemo(() => {
		if (!branches.length) return [];
		if (accessibleSubsidiaryIds.size === 0) return branches;

		return branches.filter((branch) => {
			if (!branch.subsidiaryId) return true;
			return accessibleSubsidiaryIds.has(branch.subsidiaryId);
		});
	}, [branches, accessibleSubsidiaryIds]);

	const preferredBranchId = useMemo(() => {
		if (personalizacionUsuario?.sucursal_principal)
			return personalizacionUsuario.sucursal_principal;
		if (user?.branch?.id) return user.branch.id;
		if (user?.branch_id) return user.branch_id;
		return null;
	}, [personalizacionUsuario?.sucursal_principal, user?.branch?.id, user?.branch_id]);

	const [selectedSucursal, setSelectedSucursal] = useState<BranchOption | null>(null);

	const groupedOptions = useMemo<TSelectGroups>(() => {
		if (!filteredBranches.length) return [];

		const groups = new Map<string, BranchOption[]>();

		filteredBranches.forEach((branch) => {
			const groupLabel = buildGroupLabel(branch);

			const option: BranchOption = {
				value: String(branch.id),
				label: branch.name ?? `Sucursal ${branch.id}`,
				meta: {
					branch,
					isPreferred: preferredBranchId !== null && branch.id === preferredBranchId,
				},
			};

			if (!groups.has(groupLabel)) groups.set(groupLabel, []);
			groups.get(groupLabel)?.push(option);
		});

		return Array.from(groups.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([label, options]) => ({
				label,
				options: options.sort((a, b) => a.label.localeCompare(b.label)),
			})) as TSelectGroups;
	}, [filteredBranches, preferredBranchId]);

	useEffect(() => {
		if (!filteredBranches.length) {
			setSelectedSucursal((prev) => (prev === null ? prev : null));
			return;
		}

		if (preferredBranchId == null) {
			const first = groupedOptions[0]?.options?.[0] as BranchOption | undefined;
			setSelectedSucursal((prev) => {
				const next = first ?? null;
				if (prev?.value === next?.value) return prev;
				return next;
			});
			return;
		}

		const match = groupedOptions
			.flatMap((g) => g.options)
			.find((opt) => Number(opt.value) === Number(preferredBranchId)) as
			| BranchOption
			| undefined;

		if (!match && groupedOptions.length > 0) {
			const first = groupedOptions[0]?.options?.[0] as BranchOption | undefined;
			setSelectedSucursal((prev) => {
				const next = first ?? null;
				if (prev?.value === next?.value) return prev;
				return next;
			});
			return;
		}

		setSelectedSucursal((prev) => {
			const next = match ?? null;
			if (prev?.value === next?.value) return prev;
			return next;
		});
	}, [filteredBranches, groupedOptions, preferredBranchId]);

	useEffect(() => {
		if (!selectedSucursal?.meta?.branch) return;

		dispatch(
			setTechnicalReviewsContext({
				branchId: selectedSucursal.meta.branch.id,
				subsidiaryId: selectedSucursal.meta.branch.subsidiaryId ?? null,
			}),
		);
	}, [dispatch, selectedSucursal]);

	const handleChange = useCallback(
		async (option: BranchOption | null) => {
			setSelectedSucursal(option);

			const nextBranchId = option ? Number(option.value) : null;
			if (nextBranchId === preferredBranchId || nextBranchId === null) return;

			const nextSubsidiaryId = option?.meta?.branch?.subsidiaryId ?? null;
			dispatch(
				setTechnicalReviewsContext({
					branchId: nextBranchId,
					subsidiaryId: nextSubsidiaryId,
				}),
			);

			try {
				await dispatch(actualizarSucursalPrincipalThunk(nextBranchId)).unwrap();

				const companyId = personalizacionUsuario?.company_id ?? user?.company?.id;
				if (companyId) {
					try {
						await ApiService.fetchData({
							url: '/user/switch-company',
							method: 'post',
							data: { company_id: companyId },
						});
					} catch (err) {
						console.warn('switch-company fallback failed:', err);
					}
				}

				window.dispatchEvent(
					new CustomEvent('user-branch-changed', {
						detail: { branchId: nextBranchId, subsidiaryId: nextSubsidiaryId },
					}),
				);

				toast.success('Sucursal principal actualizada');
			} catch (error: any) {
				toast.error(error?.message ?? 'No se pudo actualizar la sucursal principal');
			}
		},
		[dispatch, personalizacionUsuario?.company_id, preferredBranchId, user?.company?.id],
	);

	const formatOptionLabel = useCallback((option: BranchOption) => {
		const branchMeta = option.meta?.branch;
		const isPreferred = option.meta?.isPreferred ?? false;

		const displayName = branchMeta?.name ?? option.label;
		const displaySubsidiary = branchMeta?.subsidiaryName ?? null;
		const displayCity = branchMeta?.city ?? null;

		return (
			<div className='flex items-center gap-3'>
				<span className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'>
					<Icon icon='HeroBuildingOffice2' className='h-4 w-4' />
				</span>
				<div className='flex flex-col'>
					<span className='font-medium text-neutral-800 dark:text-neutral-50'>
						{displayName}
					</span>
					<div className='flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400'>
						{displaySubsidiary && <span>{displaySubsidiary}</span>}
						{displayCity && (
							<>
								<span aria-hidden='true' className='text-neutral-400'>
									&middot;
								</span>
								<span>{displayCity}</span>
							</>
						)}
						{isPreferred && (
							<>
								<span aria-hidden='true' className='text-neutral-400'>
									&middot;
								</span>
								<span className='flex items-center gap-1 text-emerald-500'>
									<Icon icon='HeroStar' className='h-3.5 w-3.5' />
									<span>Preferida</span>
								</span>
							</>
						)}
					</div>
				</div>
			</div>
		);
	}, []);

	const formatGroupLabel = useCallback(
		(group: GroupBase<TSelectOption>) => (
			<div className='flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
				<span className='flex items-center gap-2'>
					<Icon icon='HeroBuildingStorefront' className='h-4 w-4 text-neutral-400' />
					{group.label ?? FALLBACK_GROUP_LABEL}
				</span>
			</div>
		),
		[],
	);

	const selectPortalTarget = useMemo(() => {
		if (typeof document === 'undefined') return undefined;
		return document.body;
	}, []);

	const [modalOpen, setModalOpen] = useState(false);

	const handleSelectChange = useCallback(
		(option: TSelectOption | readonly TSelectOption[] | null) => {
			if (Array.isArray(option)) {
				void handleChange(null);
				return;
			}
			void handleChange((option as BranchOption) ?? null);
		},
		[handleChange],
	);

	const selectStyles = useMemo(
		() => ({
			menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
			menu: (base: any) => ({ ...base, maxWidth: '100vw', width: '100%', left: 0 }),
			menuList: (base: any) => ({ ...base, maxHeight: '50vh', width: '100%' }),
		}),
		[],
	);

	// props del Select para reutilizarlas en desktop + modal
	const selectProps = useMemo(
		() => ({
			className: 'branch-selector w-full bg-white dark:bg-zinc-600/90',
			noOptionsMessage: () => (branchesError ? 'Error al cargar' : 'Sin Opciones'),
			placeholder: branchesLoading
				? 'Cargando sucursales...'
				: !groupedOptions.length
					? 'Sin sucursales disponibles'
					: 'Selecciona una sucursal',
			dimension: 'sm' as const,
			name: 'select_empresa',
			isLoading: branchesLoading,
			isDisabled: branchesLoading || !!branchesError,
			isClearable: false,
			isSearchable: true,
			value: selectedSucursal as TSelectOption | null,
			options: groupedOptions,
			formatOptionLabel: (option: TSelectOption) => formatOptionLabel(option as BranchOption),
			formatGroupLabel,
			onChange: handleSelectChange,
			menuPortalTarget: selectPortalTarget,
			styles: selectStyles,
		}),
		[
			branchesError,
			branchesLoading,
			formatGroupLabel,
			formatOptionLabel,
			groupedOptions,
			handleSelectChange,
			selectPortalTarget,
			selectStyles,
			selectedSucursal,
		],
	);

	return (
		<>
			{/* DESKTOP */}
			<div className='hidden w-full sm:block sm:min-w-[260px] sm:max-w-xs'>
				<SelectReact {...selectProps} />
			</div>

			{/* MOBILE BUTTON */}
			<Button
				onClick={() => setModalOpen(true)}
				className='flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 dark:bg-zinc-600/90 sm:hidden'>
				<span className='flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 shadow-sm'>
					<Icon icon='HeroBuildingOffice2' className='h-4 w-4' />
				</span>
				<span>
					{selectedSucursal?.label
						? selectedSucursal.label.length > 6
							? `${selectedSucursal.label.slice(0, 6)}...`
							: selectedSucursal.label
						: 'Selecciona una sucursal'}
				</span>
			</Button>

			{/* MOBILE MODAL */}
			<Modal isOpen={modalOpen} setIsOpen={setModalOpen} isStaticBackdrop>
				<ModalHeader>Selecciona una sucursal</ModalHeader>
				<ModalBody>
					<SelectReact
						{...selectProps}
						onChange={(option: any) => {
							if (Array.isArray(option)) {
								void handleChange(null);
								return;
							}

							void handleChange((option as BranchOption) ?? null);
							setModalOpen(false);
						}}
					/>
				</ModalBody>
			</Modal>

			{branchesError && (
				<p className='mt-1 text-xs text-red-500' role='alert'>
					{branchesError}
				</p>
			)}
		</>
	);
};

export default SelectSucursalEmpresa;
