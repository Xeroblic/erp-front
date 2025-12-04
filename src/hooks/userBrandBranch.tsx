import { useEffect, useState, useCallback } from 'react';
import ApiService from '@/services/ApiService';
import { useAppSelector } from '@/store';

/**
 * Interface para las branches del usuario
 * Solo contiene los datos esenciales: id y nombre de la branch
 */
export interface UserBranch {
	id: number;
	name: string;
}

/**
 * Interface para el estado del hook
 */
interface UseUserBranchesState {
	branches: UserBranch[];
	loading: boolean;
	error: string | null;
}

/**
 * Interface para el retorno del hook
 */
interface UseUserBranchesReturn extends UseUserBranchesState {
	refetch: () => Promise<void>;
	clearError: () => void;
}

/**
 * Hook profesional para obtener las branches a las que un usuario tiene acceso
 *
 * @param userId - ID del usuario del cual obtener las branches
 * @param options - Opciones de configuración
 * @param options.fetchOnMount - Si debe hacer fetch automático al montar (default: true)
 * @param options.enabled - Si el hook está habilitado (default: true cuando hay userId)
 *
 * @returns {UseUserBranchesReturn} Estado con branches, loading, error y funciones auxiliares
 *
 * @example
 * ```tsx
 * const { branches, loading, error, refetch } = useUserBranches(userId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <Select>
 *     {branches.map(branch => (
 *       <option key={branch.id} value={branch.id}>
 *         {branch.name}
 *       </option>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export const useUserBranches = (
	userId?: number,
	options: {
		fetchOnMount?: boolean;
		enabled?: boolean;
	} = {},
): UseUserBranchesReturn => {
	const { fetchOnMount = true, enabled = !!userId } = options;

	const currentUserId = useAppSelector(
		(s) => s.auth.user?.id ?? (s.auth.user as any)?.pk ?? undefined,
	);
	const permisos = useAppSelector((s) => s.auth.permisos ?? []);
	const authUser = useAppSelector((s) => s.auth.user as any);

	const [state, setState] = useState<UseUserBranchesState>({
		branches: [],
		loading: false,
		error: null,
	});

	/**
	 * Función para obtener las branches del usuario desde la API
	 */
	const fetchUserBranches = useCallback(async (): Promise<void> => {
		if (!userId || !enabled) {
			setState({
				branches: [],
				loading: false,
				error: null,
			});
			return;
		}

		setState((prev) => ({ ...prev, loading: true, error: null }));

		try {
			// Si es self o no tiene permiso para ver usuarios, intentar desde store y luego /perfil
			const isSelf = currentUserId && Number(currentUserId) === Number(userId);
			const canViewUser = Array.isArray(permisos) && permisos.includes('view-user');
			if (isSelf || !canViewUser) {
				// 1) desde store
				if (authUser) {
					const meData = authUser;
					let raw = meData?.access?.branches ?? meData?.visible?.branches ?? [];
					if (!Array.isArray(raw) || raw.length === 0) {
						const b = meData?.branch;
						if (b?.id) raw = [{ id: b.id, name: b.name ?? b.branch_name }];
					}
					if (Array.isArray(raw) && raw.length) {
						const normalizedSelf: UserBranch[] = raw.map((b: any) => ({
							id: b.id,
							name: b.name || b.branch_name || `Branch ${b.id}`,
						}));
						setState({ branches: normalizedSelf, loading: false, error: null });
						return;
					}
				}
				// 2) fallback a /perfil
				const meResp = await ApiService.fetchData<{ success?: boolean; data?: any }>({
					url: '/perfil',
					method: 'get',
				});
				const meData = (meResp as any)?.data?.data ?? (meResp as any)?.data ?? ({} as any);
				let raw = meData?.access?.branches ?? meData?.visible?.branches ?? [];
				if (!Array.isArray(raw) || raw.length === 0) {
					const b = meData?.branch;
					if (b?.id) raw = [{ id: b.id, name: b.name ?? b.branch_name }];
				}
				const normalizedSelf: UserBranch[] = raw.map((b: any) => ({
					id: b.id,
					name: b.name || b.branch_name || `Branch ${b.id}`,
				}));
				setState({ branches: normalizedSelf, loading: false, error: null });
				return;
			}
			// Hacer petición al endpoint del usuario con includes específicos
			const response = await ApiService.fetchData<{
				success: boolean;
				data: {
					id: number;
					access?: {
						branches?: Array<{
							id: number;
							name?: string;
							branch_name?: string;
						}>;
					};
				};
			}>({
				url: `/users/${userId}?include=access`,
				method: 'get',
			});

			// Extraer y normalizar las branches del usuario (access + visible + branch)
			const userData = response.data.data || response.data;
			const acc = (userData as any)?.access?.branches ?? [];
			const vis = (userData as any)?.visible?.branches ?? [];
			const primary = (userData as any)?.branch;
			const _map = new Map<number, any>();
			[...acc, ...vis].forEach((b: any) => {
				if (b?.id && !_map.has(b.id)) _map.set(b.id, b);
			});
			if (primary?.id && !_map.has(primary.id)) {
				_map.set(primary.id, { id: primary.id, name: primary.name ?? primary.branch_name });
			}
			const rawBranches = Array.from(_map.values());

			// Mapear a la estructura simplificada
			const normalizedBranches: UserBranch[] = rawBranches.map((branch) => ({
				id: branch.id,
				name: branch.name || branch.branch_name || `Branch ${branch.id}`,
			}));

			setState({
				branches: normalizedBranches,
				loading: false,
				error: null,
			});
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message ||
				error?.message ||
				'Error al obtener las branches del usuario';

			setState({
				branches: [],
				loading: false,
				error: errorMessage,
			});

			console.error('[useUserBranches] Error:', errorMessage, error);
		}
	}, [userId, enabled, currentUserId, permisos]);

	/**
	 * Función para limpiar el error
	 */
	const clearError = useCallback(() => {
		setState((prev) => ({ ...prev, error: null }));
	}, []);

	/**
	 * Effect para fetch automático al montar o cuando cambia userId
	 */
	useEffect(() => {
		if (fetchOnMount && enabled && userId) {
			fetchUserBranches();
		}
	}, [userId, fetchOnMount, enabled, fetchUserBranches]);

	return {
		branches: state.branches,
		loading: state.loading,
		error: state.error,
		refetch: fetchUserBranches,
		clearError,
	};
};

/**
 * Alias para mantener compatibilidad con diferentes convenciones de nombrado
 */
export const useUserBranchAccess = useUserBranches;

export default useUserBranches;

/* ============================================================================
 * EJEMPLOS DE USO
 * ============================================================================

// Ejemplo 1: Uso básico
const MyComponent = ({ userId }: { userId: number }) => {
	const { branches, loading, error } = useUserBranches(userId);

	if (loading) return <Spinner />;
	if (error) return <Alert color="red">{error}</Alert>;

	return (
		<ul>
			{branches.map((branch) => (
				<li key={branch.id}>{branch.name}</li>
			))}
		</ul>
	);
};

// Ejemplo 2: Con refetch manual
const MyComponentWithRefresh = ({ userId }: { userId: number }) => {
	const { branches, loading, refetch } = useUserBranches(userId);

	return (
		<div>
			<button onClick={refetch} disabled={loading}>
				Recargar branches
			</button>
			<BranchList branches={branches} />
		</div>
	);
};

// Ejemplo 3: Sin fetch automático
const MyComponentLazy = ({ userId }: { userId: number }) => {
	const { branches, loading, refetch } = useUserBranches(userId, {
		fetchOnMount: false
	});

	return (
		<div>
			<button onClick={refetch}>Cargar branches</button>
			{loading ? <Spinner /> : <BranchList branches={branches} />}
		</div>
	);
};

// Ejemplo 4: Con habilitación condicional
const MyComponentConditional = ({ userId, shouldFetch }: { 
	userId: number; 
	shouldFetch: boolean;
}) => {
	const { branches, loading } = useUserBranches(userId, {
		enabled: shouldFetch
	});

	return <BranchList branches={branches} loading={loading} />;
};

// Ejemplo 5: En un Select/Dropdown
const BranchSelector = ({ userId, onChange }: { 
	userId: number; 
	onChange: (branchId: number) => void;
}) => {
	const { branches, loading, error } = useUserBranches(userId);
	const [selected, setSelected] = useState<number | null>(null);

	const handleChange = (branchId: number) => {
		setSelected(branchId);
		onChange(branchId);
	};

	return (
		<Select
			value={selected || ''}
			onChange={(e) => handleChange(Number(e.target.value))}
			disabled={loading}
		>
			<option value="">Selecciona una branch</option>
			{branches.map((branch) => (
				<option key={branch.id} value={branch.id}>
					{branch.name}
				</option>
			))}
		</Select>
	);
};

// Ejemplo 6: Con manejo de errores
const BranchListWithErrorHandling = ({ userId }: { userId: number }) => {
	const { branches, loading, error, clearError, refetch } = useUserBranches(userId);

	if (loading) return <LoadingSpinner />;

	if (error) {
		return (
			<Alert color="red" onClose={clearError}>
				<p>{error}</p>
				<button onClick={refetch}>Reintentar</button>
			</Alert>
		);
	}

	if (branches.length === 0) {
		return <EmptyState message="Este usuario no tiene acceso a ninguna branch" />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Branches Disponibles ({branches.length})</CardTitle>
			</CardHeader>
			<CardBody>
				{branches.map((branch) => (
					<Badge key={branch.id} color="blue">
						{branch.name}
					</Badge>
				))}
			</CardBody>
		</Card>
	);
};

============================================================================ */
