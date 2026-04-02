/**
 * @deprecated Este hook será eliminado en futuras versiones.
 * Usa `useCurrentBranch` de `@/hooks/useCurrentBranch` para obtener
 * `branchId`, `subsidiaryId` y `visibleBranches` de forma reactiva
 * sin necesidad de llamadas API adicionales.
 *
 * Para validar permisos contextuales, usa `useAuthorization` de
 * `@/hooks/useAuthorization` con `canAccessBranch(branchId)`.
 *
 * @see useCurrentBranch
 * @see useAuthorization
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import ApiService from '@/services/ApiService';
import { useAppSelector } from '@/store';

const EMPTY_STRING_ARRAY: string[] = [];

/**
 * Interface para las branches del usuario
 * Solo contiene los datos esenciales: id y nombre de la branch
 */
export interface UserBranch {
	id: number;
	name: string;
	subsidiaryId?: number | null;
	subsidiaryName?: string | null;
	companyId?: number | null;
	companyName?: string | null;
	city?: string | null;
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

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as UnknownRecord;
	}
	return undefined;
};

const asRecordArray = (value: unknown): UnknownRecord[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => asRecord(item))
		.filter((item): item is UnknownRecord => item !== undefined);
};

const normalizeUserBranch = (branch: UnknownRecord): UserBranch => {
	const subsidiarySource =
		branch.subsidiary ?? branch.subsidiary_info ?? branch.subsidiary_id ?? null;
	const companySource = branch.company ?? null;

	const subsidiary = asRecord(subsidiarySource);
	const company = asRecord(companySource);

	const subsidiaryId =
		subsidiary?.id !== undefined
			? Number(subsidiary.id)
			: typeof subsidiarySource === 'number'
				? subsidiarySource
				: null;

	const subsidiaryName =
		typeof subsidiary?.name === 'string'
			? subsidiary.name
			: typeof subsidiary?.subsidiary_name === 'string'
				? subsidiary.subsidiary_name
				: typeof subsidiary?.branch_name === 'string'
					? subsidiary.branch_name
					: typeof branch.subsidiary_name === 'string'
						? branch.subsidiary_name
						: null;

	const companyId =
		company?.id !== undefined
			? Number(company.id)
			: typeof companySource === 'number'
				? companySource
				: null;

	const companyName =
		typeof company?.name === 'string'
			? company.name
			: typeof company?.company_name === 'string'
				? company.company_name
				: typeof branch.company_name === 'string'
					? branch.company_name
					: null;

	const id = Number(branch.id ?? 0);
	const fallbackName = Number.isFinite(id) && id > 0 ? `Branch ${id}` : 'Branch';

	return {
		id,
		name:
			(typeof branch.name === 'string' && branch.name) ||
			(typeof branch.branch_name === 'string' && branch.branch_name) ||
			fallbackName,
		subsidiaryId: Number.isFinite(Number(subsidiaryId)) ? Number(subsidiaryId) : null,
		subsidiaryName,
		companyId: Number.isFinite(Number(companyId)) ? Number(companyId) : null,
		companyName,
		city:
			typeof branch.city === 'string'
				? branch.city
				: typeof branch.city_name === 'string'
					? branch.city_name
					: typeof branch.location === 'string'
						? branch.location
						: null,
	};
};

const mergeBranchSources = (
	access: unknown,
	visible: unknown,
	primary?: unknown,
): UnknownRecord[] => {
	const map = new Map<number, UnknownRecord>();
	for (const branch of [...asRecordArray(access), ...asRecordArray(visible)]) {
		const id = Number(branch.id ?? 0);
		if (Number.isFinite(id) && id > 0 && !map.has(id)) {
			map.set(id, branch);
		}
	}

	const primaryRecord = asRecord(primary);
	if (primaryRecord) {
		const id = Number(primaryRecord.id ?? 0);
		if (Number.isFinite(id) && id > 0 && !map.has(id)) {
			map.set(id, {
				id,
				name: primaryRecord.name ?? primaryRecord.branch_name,
				subsidiary: primaryRecord.subsidiary ?? null,
				company:
					primaryRecord.company ?? asRecord(primaryRecord.subsidiary)?.company ?? null,
				city: primaryRecord.city ?? null,
			});
		}
	}

	return Array.from(map.values());
};

const getErrorMessage = (error: unknown): string => {
	const response = asRecord(asRecord(error)?.response);
	const data = asRecord(response?.data);
	if (typeof data?.message === 'string' && data.message.trim()) return data.message;
	if (error instanceof Error && error.message.trim()) return error.message;
	return 'Error al obtener las branches del usuario';
};

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
 * 
 * // Aqui se llama al hook y a alguns funciones dentro de la vista deseada
 * const { branches, loading, error, refetch } = useUserBranches(userId);
 *
 * 
 * // cargamos los datos en un select 
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
 *
 * @deprecated Usa `useCurrentBranch` de `@/hooks/useCurrentBranch` en su lugar.
 */
export const useUserBranches = (
	userId?: number,
	options: {
		fetchOnMount?: boolean;
		enabled?: boolean;
	} = {},
): UseUserBranchesReturn => {
	const { fetchOnMount = true, enabled = !!userId } = options;

	// ID del usuario autenticado (para fallback cuando pedimos nuestras propias branches)
	const currentUserId = useAppSelector((s) => {
		const authUser = asRecord(s.auth.user);
		const id = authUser?.id;
		if (typeof id === 'number') return id;
		const pk = authUser?.pk;
		return typeof pk === 'number' ? pk : undefined;
	});

	// Permisos reales normalizados del usuario autenticado
	const permisos = useAppSelector((s) => s.auth.user?.permisos);
	const safePermisos = permisos ?? EMPTY_STRING_ARRAY;
	const authUser = useAppSelector((s) => s.auth.user as unknown);
	const authUserRecord = asRecord(authUser);

	const [state, setState] = useState<UseUserBranchesState>({
		branches: [],
		loading: false,
		error: null,
	});
	const inFlightKeyRef = useRef<string | null>(null);

	/**
	 * Función para obtener las branches del usuario desde la API
	 */
	const fetchUserBranches = useCallback(async (): Promise<void> => {
		const requestKey = `${userId ?? 'none'}:${enabled ? 'enabled' : 'disabled'}`;

		if (!userId || !enabled) {
			inFlightKeyRef.current = null;
			setState((prev) => {
				if (!prev.branches.length && !prev.loading && prev.error === null) {
					return prev;
				}

				return {
					branches: [],
					loading: false,
					error: null,
				};
			});
			return;
		}

		if (inFlightKeyRef.current === requestKey) {
			return;
		}

		inFlightKeyRef.current = requestKey;

		setState((prev) => {
			if (prev.loading && prev.error === null) {
				return prev;
			}

			return { ...prev, loading: true, error: null };
		});

		try {
			// Si es el propio usuario o no tiene permiso global para ver usuarios,
			// intentamos usar el perfil ya cargado en store para evitar llamadas.
			const isSelf = currentUserId && Number(currentUserId) === Number(userId);
			const canViewUser = safePermisos.includes('view-user');
			if (isSelf || !canViewUser) {
				// 1) Intentar desde el store (userMeThunk ya carga /perfil en PageWrapper)
				if (authUserRecord) {
					const meData = authUserRecord;
					const rawBranches = mergeBranchSources(
						asRecord(meData?.access)?.branches,
						asRecord(meData?.visible)?.branches,
						meData?.branch,
					);

					if (rawBranches.length) {
						const normalizedSelf: UserBranch[] = rawBranches.map(normalizeUserBranch);
						inFlightKeyRef.current = null;
						setState({ branches: normalizedSelf, loading: false, error: null });
						return;
					}
				}

				// 2) Fallback a /perfil si el store aún no tiene access/visible
				const meResp = await ApiService.fetchData<{ success?: boolean; data?: unknown }>({
					url: '/perfil',
					method: 'get',
				});

				const mePayload = asRecord(meResp.data?.data) ?? asRecord(meResp.data) ?? {};
				const normalizedSelf: UserBranch[] = mergeBranchSources(
					asRecord(mePayload.access)?.branches,
					asRecord(mePayload.visible)?.branches,
					mePayload.branch,
				).map(normalizeUserBranch);

				inFlightKeyRef.current = null;
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

			// Extraer y normalizar las branches del usuario (unir access + visible + branch)
			const userData = asRecord(response.data.data) ?? asRecord(response.data) ?? {};
			const normalizedBranches: UserBranch[] = mergeBranchSources(
				asRecord(userData.access)?.branches,
				asRecord(userData.visible)?.branches,
				userData.branch,
			).map(normalizeUserBranch);

			inFlightKeyRef.current = null;
			setState({
				branches: normalizedBranches,
				loading: false,
				error: null,
			});
		} catch (error: unknown) {
			// Fallback: si 403 en /users/:id y es el propio usuario, usar /perfil
			const status = Number(asRecord(asRecord(error)?.response)?.status);
			const isForbidden = status === 403;
			const isSelfRequest = currentUserId && Number(currentUserId) === Number(userId);

			if (isForbidden && isSelfRequest) {
				try {
					const meResp = await ApiService.fetchData<{
						success?: boolean;
						data?: unknown;
					}>({
						url: '/perfil',
						method: 'get',
					});

					const meData = asRecord(meResp.data?.data) ?? asRecord(meResp.data) ?? {};
					const normalizedBranches: UserBranch[] = mergeBranchSources(
						asRecord(meData.access)?.branches,
						asRecord(meData.visible)?.branches,
						meData.branch,
					).map(normalizeUserBranch);

					inFlightKeyRef.current = null;
					setState({ branches: normalizedBranches, loading: false, error: null });
					return;
				} catch (_fallbackErr) {
					// continuar
				}
			}

			const errorMessage = getErrorMessage(error);

			inFlightKeyRef.current = null;
			setState({ branches: [], loading: false, error: errorMessage });
			console.error('[useUserBranches] Error:', errorMessage, error);
		}
	}, [userId, enabled, currentUserId, safePermisos, authUserRecord]);

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
 * Alias para mantener compatibilidad con diferentes convenciones de nombrado y asi poder disponer de la funcion en otros modulos por eempplo:
 * 
 * @deprecated Usa `useCurrentBranch` de `@/hooks/useCurrentBranch` en su lugar. de esta forma se evita el uso de este hook que es mas complejo y no es necesario para la mayoria de los casos.
 * 
 * 
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
