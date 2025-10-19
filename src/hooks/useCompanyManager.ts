import { useAppSelector, useAppDispatch } from '@/store';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ApiService from '@/services/ApiService';
import { toast } from 'react-toastify';
import { userMeThunk } from '@/store/slices/auth/authSlice';

interface CompanyInfo {
	id: number;
	name: string;
	rut: string;
	role: string;
	is_primary: boolean;
	subsidiary_id?: number;
}

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
	const dispatch = useAppDispatch();
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
				// 1) Cambia compañía/subsidiaria (usa signal local por si quieres cancelar acá también)
				const controller = new AbortController();
				await ApiService.fetchData({
					url: '/user/switch-company',
					method: 'post',
					data: {
						company_id: 1, // TODO: reemplazar por real si corresponde
						subsidiary_id: subsidiaryId,
					},
					signal: controller.signal,
				});

				// 2) Si la personalización YA tiene ese ID, no hagas PUT inútil
				const currentPersonalization = user?.personalizacion;
				if (currentPersonalization?.sucursal_principal !== subsidiaryId) {
					try {
						await ApiService.fetchData({
							url: '/user/personalization',
							method: 'put',
							data: {
								tema: currentPersonalization?.tema,
								font_size: currentPersonalization?.font_size,
								sucursal_principal: subsidiaryId,
							},
						});
					} catch (err) {
						// no bloquear por esto
						console.warn('Error updating personalization:', err);
					}
				}

				// 3) Refresca el user (idealmente trae la nueva subsidiary)
				await dispatch(userMeThunk()).unwrap();

				// 4) Actualiza el nombre de la subsidiaria actual usando el cache local
				const selectedCompany =
					availableCompanies.find((c) => c.subsidiary_id === subsidiaryId) ??
					cacheRef.current?.companies.find((c) => c.subsidiary_id === subsidiaryId);
				if (selectedCompany) setCurrentSubsidiaryName(selectedCompany.name);

				// 5) Invalida cache de empresas (por si cambió accesos)
				cacheRef.current = null;
				lastLoadedAtRef.current = null;

				toast.success('Empresa cambiada exitosamente');
				return true;
			} catch (error: any) {
				if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
					// aborto: no tirar toast de error ruidoso
					return false;
				}
				toast.error(error?.response?.data?.message || 'Error al cambiar empresa');
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[dispatch, user, availableCompanies],
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

				if (userSnapshot?.companies?.length) {
					derived = userSnapshot.companies.map((c: any) => ({
						id: c.id,
						name: c.name || c.company_name,
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
				} else if (personalization?.sucursal_principal) {
					// fallback mínimo con la sucursal guardada en personalización
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
                }>({ url: '/user/personalization', method: 'get', signal: controller.signal, dedupe: true, cacheTTLms: 300000 });

				let companies: CompanyInfo[] = [];
				let prettyName = currentSubsidiaryName;

				if (response.data.current_company?.subsidiaries?.length) {
					companies = response.data.current_company.subsidiaries.map((s) => ({
						id: s.id,
						name: s.subsidiary_name,
						rut: '',
						role: user?.position || 'employee',
						is_primary: false, // evita adivinar, no asumas que la primera es primary
						subsidiary_id: s.id,
					}));

					if (user?.personalizacion?.sucursal_principal && !user?.subsidiary) {
						const current = response.data.current_company.subsidiaries.find(
							(sub) => sub.id === user.personalizacion!.sucursal_principal,
						);
						if (current) prettyName = current.subsidiary_name;
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
			} catch (error: any) {
				if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
					// abortado: silencio
				} else {
					console.error('Error loading companies:', error);
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

	const canAccessCompany = useCallback(
		(companyId: number): boolean => {
			if (!user) return false;
			if (user.authority?.includes('super-admin')) return true;
			return (
				user.subsidiary?.id === companyId ||
				availableCompanies.some((c) => c.subsidiary_id === companyId)
			);
		},
		[user, availableCompanies],
	);

	const canAccessSubsidiary = useCallback(
		(subsidiaryId: number): boolean => {
			if (!user) return false;
			if (user.authority?.includes('super-admin')) return true;
			if (user.authority?.includes('company-admin')) return true;
			return user.subsidiary?.id === subsidiaryId;
		},
		[user],
	);

	const canAccessBranch = useCallback(
		(branchId: number): boolean => {
			if (!user) return false;
			if (user.authority?.includes('super-admin')) return true;
			if (user.authority?.includes('company-admin')) return true;
			if (user.authority?.includes('subsidiary-admin')) return true;
			return user.branch?.id === branchId;
		},
		[user],
	);

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
