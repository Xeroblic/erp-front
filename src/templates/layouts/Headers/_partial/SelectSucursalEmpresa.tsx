import { useEffect, useMemo, useState } from 'react';
import SelectReact, { TSelectGroups, TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	selectPersonalizacionUsuario,
	selectIsInitialized as selectPersonalizacionInitialized,
	obtenerPersonalizacionThunk,
	actualizarSucursalPrincipalThunk,
} from '@/store/slices/personalizacion/personalizacionSlice';
import { useUserBranches } from '@/pages/catalogos/productos/components/modals/hooks/userBranch';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';

function SelectSucursalEmpresa() {
	const dispatch = useAppDispatch();
	const { user } = useAppSelector((state) => state.auth);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const personalizacionInitialized = useAppSelector(selectPersonalizacionInitialized);

	const userId = user?.id || (user as any)?.pk || null;

	useEffect(() => {
		if (!personalizacionInitialized) {
			dispatch(obtenerPersonalizacionThunk());
		}
	}, [dispatch, personalizacionInitialized]);

	const {
		branches,
		loading: branchesLoading,
		error: branchesError,
	} = useUserBranches(userId ?? undefined, { enabled: !!userId });

	const preferredBranchId = useMemo(() => {
		if (personalizacionUsuario?.sucursal_principal) {
			return personalizacionUsuario.sucursal_principal;
		}
		if (user?.branch?.id) return user.branch.id;
		if (user?.branch_id) return user.branch_id;
		return null;
	}, [personalizacionUsuario?.sucursal_principal, user?.branch?.id, user?.branch_id]);

	const [selectedSucursal, setSelectedSucursal] = useState<TSelectOption | null>(null);

	const optionsEmpresas = useMemo<TSelectGroups>(() => {
		if (!branches.length) return [];
		return [
			{
				label: 'Sucursales',
				options: branches.map((branch) => ({
					value: String(branch.id),
					label: branch.name ?? `Sucursal ${branch.id}`,
				})),
			},
		];
	}, [branches]);

	useEffect(() => {
		if (!branches.length) {
			setSelectedSucursal(null);
			return;
		}

		if (preferredBranchId == null) {
			const firstOption = optionsEmpresas[0]?.options?.[0] ?? null;
			setSelectedSucursal(firstOption ?? null);
			return;
		}

		const match = optionsEmpresas
			.flatMap((group) => group.options)
			.find((option) => Number(option.value) === Number(preferredBranchId));

		setSelectedSucursal(match ?? null);
	}, [branches, optionsEmpresas, preferredBranchId]);

	const handleChange = async (option: TSelectOption | null) => {
		setSelectedSucursal(option);
		const nextBranchId = option ? Number(option.value) : null;
		if (nextBranchId === preferredBranchId || nextBranchId === null) return;
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
					detail: { branchId: nextBranchId },
				}),
			);
			toast.success('Sucursal principal actualizada');
		} catch (error: any) {
			toast.error(error?.message ?? 'No se pudo actualizar la sucursal principal');
		}
	};

	return (
		<div className='w-[20vw]'>
			<SelectReact
				className='w-full'
				noOptionsMessage={() => (branchesError ? 'Error al cargar' : 'Sin Opciones')}
				placeholder='Selecciona la sucursal'
				dimension='sm'
				name='select_empresa'
				isLoading={branchesLoading}
				isDisabled={branchesLoading || !!branchesError}
				value={selectedSucursal}
				options={optionsEmpresas}
				onChange={(option) => handleChange((option as TSelectOption) ?? null)}
			/>
			{branchesError && (
				<p className='mt-1 text-xs text-red-500'>{branchesError}</p>
			)}
		</div>
	);
}

export default SelectSucursalEmpresa;
