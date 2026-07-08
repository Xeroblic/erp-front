import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';
import useOrgContextSwitcher from '@/hooks/useOrgContextSwitcher';
import useAuthorization from '@/hooks/useAuthorization';
import type { IUserMe } from '@/interface/user.interface';

interface CompanyInfo {
	id: number;
	name: string;
	rut: string;
	role: string;
	is_primary: boolean;
	subsidiary_id?: number;
}

/** Forma laxa de un item de `user.companies` (el backend puede usar name o company_name). */
type UserCompanyLike = {
	id: number;
	name?: string;
	company_name?: string;
	rut?: string;
	role?: string;
	is_primary?: boolean | number;
};

/** Ids de subsidiarias/empresas accesibles derivadas del usuario, sin `any`. */
const collectAccessibleSubsidiaryIds = (user: IUserMe | undefined): Set<number> => {
	const ids = new Set<number>();
	(user?.companies ?? []).forEach((company) => {
		if (company?.id) ids.add(company.id);
	});
	if (user?.subsidiary?.id) ids.add(user.subsidiary.id);
	if (user?.company?.id) ids.add(user.company.id);
	return ids;
};

interface UseCompanyManager {
	currentCompany: CompanyInfo | null;
	availableCompanies: CompanyInfo[];
	isLoading: boolean;
	switchCompany: (companyId: number) => Promise<boolean>;
	refreshCompanies: (opts?: { force?: boolean }) => Promise<void>;
	canAccessCompany: (companyId: number) => boolean;
	canAccessSubsidiary: (subsidiaryId: number) => boolean;
	canAccessBranch: (branchId: number) => boolean;
}

const useCompanyManager = (): UseCompanyManager => {
	const { switchContext } = useOrgContextSwitcher();
	// Autorización por scope: fuente única (antes duplicada con lógica más pobre).
	const { canAccessCompany, canAccessSubsidiary, canAccessBranch } = useAuthorization();
	const user = useAppSelector((state) => state.auth.user);
	const personalizationFromStore = useAppSelector(
		(state) => state.personalizacion?.personalizacionUsuario,
	);

	const [availableCompanies, setAvailableCompanies] = useState<CompanyInfo[]>([]);
	const [currentSubsidiaryName, setCurrentSubsidiaryName] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);

	// refs para dedupe/cancelación/cache
	const refreshInFlightRef = useRef<AbortController | null>(null);
	const lastLoadedAtRef = useRef<number | null>(null);
	const cacheRef = useRef<{ companies: CompanyInfo[]; currentName: string } | null>(null);

	const currentCompany = useMemo<CompanyInfo | null>(() => {
		if (user?.subsidiary) {
			return {
				id: user.subsidiary.id,
				name: user.subsidiary.name,
				rut: user.company?.rut || '',
				role: user.position || 'employee',
				is_primary: true,
				subsidiary_id: user.subsidiary.id,
			};
		}
		if (user?.personalizacion?.sucursal_principal) {
			return {
				id: user.personalizacion.sucursal_principal,
				name:
					currentSubsidiaryName ||
					`Subsidiaria ${user.personalizacion.sucursal_principal}`,
				rut: '',
				role: user.position || 'employee',
				is_primary: false,
				subsidiary_id: user.personalizacion.sucursal_principal,
			};
		}
		if (user?.authority?.includes('super-admin')) {
			return {
				id: 0,
				name: 'Administración Global',
				rut: '00000000-0',
				role: 'super-admin',
				is_primary: true,
				subsidiary_id: 0,
			};
		}
		return null;
	}, [
		user?.subsidiary,
		user?.company?.rut,
		user?.position,
		user?.personalizacion?.sucursal_principal,
		user?.authority,
		currentSubsidiaryName,
	]);

	const switchCompany = useCallback(
		async (subsidiaryId: number): Promise<boolean> => {
			setIsLoading(true);
			try {
				// Delega el cambio en el hook centralizado: resuelve el company_id REAL
				// (ya no `1` hardcodeado) y emite el evento con semántica correcta
				// (la subsidiaria NO viaja dentro de `branchId`).
				const ok = await switchContext({
					subsidiaryId,
					sucursalPrincipal: subsidiaryId,
					eventBranchId: null,
					successMessage: 'Empresa cambiada exitosamente',
				});

				if (ok) {
					// Actualiza el nombre de la subsidiaria actual desde el cache local.
					const selectedCompany =
						availableCompanies.find((c) => c.subsidiary_id === subsidiaryId) ??
						cacheRef.current?.companies.find((c) => c.subsidiary_id === subsidiaryId);
					if (selectedCompany) setCurrentSubsidiaryName(selectedCompany.name);

					// Invalida cache de empresas (por si cambiaron accesos).
					cacheRef.current = null;
					lastLoadedAtRef.current = null;
				}

				return ok;
			} finally {
				setIsLoading(false);
			}
		},
		[switchContext, availableCompanies],
	);

	const refreshCompanies = useCallback(
		async ({ force = false }: { force?: boolean } = {}) => {
			// 0) si ya tenemos datos útiles en el store, construir sin pedir a la API
			if (!force) {
				const personalization = personalizationFromStore;

				// También podemos derivar desde auth.user
				const userSnapshot = user;

				let derived: CompanyInfo[] = [];
				let derivedName = currentSubsidiaryName;

				const accessibleSubsidiaryIds = collectAccessibleSubsidiaryIds(userSnapshot);

				if (userSnapshot?.companies?.length) {
					// ✅ Solo companies accesibles
					derived = (userSnapshot.companies as UserCompanyLike[])
						.filter(
							(c) => !accessibleSubsidiaryIds.size || accessibleSubsidiaryIds.has(c.id),
						)
						.map((c) => ({
							id: c.id,
							name: c.name || c.company_name || `Empresa ${c.id}`,
							rut: c.rut || '',
							role: c.role || userSnapshot.position || 'employee',
							is_primary: Boolean(c.is_primary),
							subsidiary_id: c.id,
						}));
				} else if (userSnapshot?.subsidiary) {
					derived = [
						{
							id: userSnapshot.subsidiary.id,
							name: userSnapshot.subsidiary.name,
							rut: userSnapshot.company?.rut || '',
							role: userSnapshot.position || 'employee',
							is_primary: true,
							subsidiary_id: userSnapshot.subsidiary.id,
						},
					];
					derivedName = userSnapshot.subsidiary.name;
				} else if (
					personalization?.sucursal_principal &&
					(!accessibleSubsidiaryIds.size ||
						accessibleSubsidiaryIds.has(personalization.sucursal_principal))
				) {
					// Sólo si está en accesibles (o no podemos determinar).
					derived = [
						{
							id: personalization.sucursal_principal,
							name: `Subsidiaria ${personalization.sucursal_principal}`,
							rut: '',
							role: userSnapshot?.position || 'employee',
							is_primary: false,
							subsidiary_id: personalization.sucursal_principal,
						},
					];
				}

				if (derived.length > 0) {
					setAvailableCompanies(derived);
					setCurrentSubsidiaryName(derivedName);
					cacheRef.current = { companies: derived, currentName: derivedName };
					lastLoadedAtRef.current = Date.now();
					return;
				}
			}

			// usa cache si existe y no forzaste
			if (!force && cacheRef.current) {
				setAvailableCompanies(cacheRef.current.companies);
				setCurrentSubsidiaryName(cacheRef.current.currentName);
				return;
			}

			// dedupe: si ya hay una request corriendo, cancelar la anterior
			if (refreshInFlightRef.current) {
				refreshInFlightRef.current.abort();
			}
			const controller = new AbortController();
			refreshInFlightRef.current = controller;

			setIsLoading(true);
			try {
				const response = await ApiService.fetchData<{
					personalization: {
						id: number;
						user_id: number;
						tema: number;
						font_size: number;
						sucursal_principal: number | null;
						company_id: number;
						created_at: string;
						updated_at: string;
					};
					companies: Array<{
						id: number;
						company_name: string;
						is_primary: number;
						position_in_company: string;
						subsidiaries_count: number;
						branches_count: number;
					}>;
					current_company: {
						id: number;
						company_name: string;
						subsidiaries: Array<{
							id: number;
							subsidiary_name: string;
							branches_count: number;
							branches: Array<{ id: number; branch_name: string }>;
						}>;
					} | null;
				}>({
					url: '/user/personalization',
					method: 'get',
					signal: controller.signal,
					dedupe: true,
					cacheTTLms: 300000,
				});

				let companies: CompanyInfo[] = [];
				let prettyName = currentSubsidiaryName;

				const accessibleSubsidiaryIds = collectAccessibleSubsidiaryIds(user);

				if (response.data.current_company?.subsidiaries?.length) {
					// ✅ FILTRAR: Solo mostrar subsidiarias a las que el usuario tiene acceso
					const allSubsidiaries = response.data.current_company.subsidiaries;
					const accessibleSubsidiaries =
						accessibleSubsidiaryIds.size > 0
							? allSubsidiaries.filter((s) => accessibleSubsidiaryIds.has(s.id))
							: allSubsidiaries; // Si no podemos determinar, mostrar todas (fallback)

					companies = accessibleSubsidiaries.map((s) => ({
						id: s.id,
						name: s.subsidiary_name,
						rut: '',
						role: user?.position || 'employee',
						is_primary: false,
						subsidiary_id: s.id,
					}));

					if (user?.personalizacion?.sucursal_principal && !user?.subsidiary) {
						const current = accessibleSubsidiaries.find(
							(sub) => sub.id === user.personalizacion!.sucursal_principal,
						);
						if (current) {
							prettyName = current.subsidiary_name;
						} else if (accessibleSubsidiaries.length > 0) {
							// sucursal_principal no accesible: usar la primera disponible.
							prettyName = accessibleSubsidiaries[0].subsidiary_name;
						}
					}
				} else if (response.data.companies?.length) {
					companies = response.data.companies.map((c) => ({
						id: c.id,
						name: c.company_name,
						rut: '',
						role: c.position_in_company || 'employee',
						is_primary: c.is_primary === 1,
						subsidiary_id: c.id,
					}));
				} else if (user?.authority?.includes('super-admin')) {
					companies = [
						{
							id: 0,
							name: 'Administración Global',
							rut: '00000000-0',
							role: 'super-admin',
							is_primary: true,
							subsidiary_id: 0,
						},
					];
				}

				setAvailableCompanies(companies);
				setCurrentSubsidiaryName(prettyName);

				// guarda cache
				cacheRef.current = { companies, currentName: prettyName };
				lastLoadedAtRef.current = Date.now();
			} catch (error: unknown) {
				const err = error as { name?: string };
				if (err?.name !== 'AbortError' && err?.name !== 'CanceledError') {
					toast.error('Error al cargar empresas disponibles');
					setAvailableCompanies([]);
					cacheRef.current = null;
					lastLoadedAtRef.current = null;
				}
			} finally {
				if (refreshInFlightRef.current === controller) {
					refreshInFlightRef.current = null;
				}
				setIsLoading(false);
			}
		},
		[user, currentSubsidiaryName, personalizationFromStore],
	);

	// Limpieza: abortar si se desmonta el hook
	useEffect(() => {
		return () => {
			refreshInFlightRef.current?.abort();
		};
	}, []);

	return {
		currentCompany,
		availableCompanies,
		isLoading,
		switchCompany,
		refreshCompanies,
		canAccessCompany,
		canAccessSubsidiary,
		canAccessBranch,
	};
};

export default useCompanyManager;
