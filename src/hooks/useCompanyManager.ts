import { useAppSelector, useAppDispatch } from '@/store';
import { useState, useCallback } from 'react';
import ApiService from '@/services/ApiService';
import { toast } from 'react-toastify';
import { userMeThunk } from '@/store/slices/auth/authSlice';

interface CompanyInfo {
    id: number;
    name: string;
    rut: string;
    role: string;
    is_primary: boolean;
    subsidiary_id?: number; // Agregamos subsidiary_id para el nuevo flujo
}

interface UseCompanyManager {
    currentCompany: CompanyInfo | null;
    availableCompanies: CompanyInfo[];
    isLoading: boolean;
    switchCompany: (companyId: number) => Promise<boolean>;
    refreshCompanies: () => Promise<void>;
    canAccessCompany: (companyId: number) => boolean;
    canAccessSubsidiary: (subsidiaryId: number) => boolean;
    canAccessBranch: (branchId: number) => boolean;
}

const useCompanyManager = (): UseCompanyManager => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [availableCompanies, setAvailableCompanies] = useState<CompanyInfo[]>([]);
    const [currentSubsidiaryName, setCurrentSubsidiaryName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Empresa actual del usuario basada en personalización o datos actuales
    const currentCompany = user?.subsidiary ? {
        id: user.subsidiary.id,
        name: user.subsidiary.name,
        rut: user.company?.rut || '',
        role: user.position || 'employee',
        is_primary: true,
        subsidiary_id: user.subsidiary.id
    } : user?.personalizacion?.sucursal_principal ? {
        id: user.personalizacion.sucursal_principal,
        name: currentSubsidiaryName || `Subsidiaria ${user.personalizacion.sucursal_principal}`,
        rut: '',
        role: user.position || 'employee',
        is_primary: false,
        subsidiary_id: user.personalizacion.sucursal_principal
    } : user?.authority?.includes('super-admin') ? {
        id: 0,
        name: 'Administración Global',
        rut: '00000000-0',
        role: 'super-admin',
        is_primary: true,
        subsidiary_id: 0
    } : null;

    // Cambiar empresa activa (cambiar subsidiaria)
    const switchCompany = useCallback(async (subsidiaryId: number): Promise<boolean> => {
        setIsLoading(true);
        try {
            // Para subsidiarias de la misma empresa, enviamos el company_id (1) y subsidiary_id
            await ApiService.fetchData({
                url: '/user/switch-company',
                method: 'post',
                data: {
                    company_id: 1, // ID de EcoTech SPA
                    subsidiary_id: subsidiaryId // ID de la subsidiaria seleccionada
                }
            });

            // Actualizar personalización con la nueva subsidiaria principal
            const currentPersonalization = user?.personalizacion;
            if (currentPersonalization) {
                try {
                    await ApiService.fetchData({
                        url: '/user/personalization',
                        method: 'put',
                        data: {
                            tema: currentPersonalization.tema,
                            font_size: currentPersonalization.font_size,
                            sucursal_principal: subsidiaryId
                        }
                    });
                } catch (personalizationError) {
                    console.warn('Error updating personalization:', personalizationError);
                    // No fallar el cambio de empresa si falla la actualización de personalización
                }
            }

            // Refrescar datos del usuario
            await dispatch(userMeThunk()).unwrap();

            // Actualizar el nombre de la subsidiaria actual
            const selectedCompany = availableCompanies.find(c => c.subsidiary_id === subsidiaryId);
            if (selectedCompany) {
                setCurrentSubsidiaryName(selectedCompany.name);
            }

            toast.success('Empresa cambiada exitosamente');
            return true;
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al cambiar empresa');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, user]);

    // Obtener empresas disponibles desde personalización
    const refreshCompanies = useCallback(async () => {
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
                        branches: Array<{
                            id: number;
                            branch_name: string;
                        }>;
                    }>;
                } | null;
            }>({
                url: '/user/personalization',
                method: 'get'
            });

            // Si hay una empresa actual con subsidiarias, usamos esas
            if (response.data.current_company?.subsidiaries) {
                const subsidiaries = response.data.current_company.subsidiaries.map(subsidiary => ({
                    id: subsidiary.id,
                    name: subsidiary.subsidiary_name,
                    rut: '', // No viene en la respuesta, podríamos agregarlo después
                    role: user?.position || 'employee',
                    is_primary: subsidiary.id === 1, // Asumir que la primera es primary
                    subsidiary_id: subsidiary.id
                }));
                setAvailableCompanies(subsidiaries);

                // Actualizar currentCompany si se basa en sucursal_principal de personalización
                if (user?.personalizacion?.sucursal_principal && !user?.subsidiary) {
                    // Buscar el nombre correcto de la subsidiaria desde los datos obtenidos
                    const currentSubsidiary = response.data.current_company.subsidiaries.find(
                        sub => sub.id === user.personalizacion?.sucursal_principal
                    );
                    if (currentSubsidiary) {
                        setCurrentSubsidiaryName(currentSubsidiary.subsidiary_name);
                    }
                }
            }
            // Si no hay empresa actual pero hay empresas disponibles, usamos esas
            else if (response.data.companies && response.data.companies.length > 0) {
                const companies = response.data.companies.map(company => ({
                    id: company.id,
                    name: company.company_name,
                    rut: '', // No viene en la respuesta
                    role: company.position_in_company || 'employee',
                    is_primary: company.is_primary === 1,
                    subsidiary_id: company.id
                }));
                setAvailableCompanies(companies);
            }
            // Si es super-admin sin empresas específicas, crear una entrada por defecto
            else if (user?.authority?.includes('super-admin')) {
                setAvailableCompanies([{
                    id: 0,
                    name: 'Administración Global',
                    rut: '00000000-0',
                    role: 'super-admin',
                    is_primary: true,
                    subsidiary_id: 0
                }]);
            } else {
                setAvailableCompanies([]);
            }
        } catch (error: any) {
            console.error('Error loading companies:', error);
            toast.error('Error al cargar empresas disponibles');
            setAvailableCompanies([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Verificar acceso a empresa (realmente subsidiaria)
    const canAccessCompany = useCallback((companyId: number): boolean => {
        if (!user) return false;

        // Super admin tiene acceso total
        if (user.authority?.includes('super-admin')) return true;

        // Verificar si el usuario tiene acceso a esta subsidiaria
        return user.subsidiary?.id === companyId ||
            availableCompanies.some(company => company.subsidiary_id === companyId);
    }, [user, availableCompanies]);

    // Verificar acceso a subsidiaria
    const canAccessSubsidiary = useCallback((subsidiaryId: number): boolean => {
        if (!user) return false;

        // Super admin tiene acceso total
        if (user.authority?.includes('super-admin')) return true;

        // Company admin tiene acceso a todas las subsidiarias de su empresa
        if (user.authority?.includes('company-admin')) return true;

        // Verificar si es admin de esa subsidiaria específica
        return user.subsidiary?.id === subsidiaryId;
    }, [user]);

    // Verificar acceso a sucursal
    const canAccessBranch = useCallback((branchId: number): boolean => {
        if (!user) return false;

        // Super admin tiene acceso total
        if (user.authority?.includes('super-admin')) return true;

        // Company admin tiene acceso a todas las sucursales
        if (user.authority?.includes('company-admin')) return true;

        // Subsidiary admin tiene acceso a sucursales de su subsidiaria
        if (user.authority?.includes('subsidiary-admin')) return true;

        // Branch admin solo a su sucursal
        return user.branch?.id === branchId;
    }, [user]);

    return {
        currentCompany,
        availableCompanies,
        isLoading,
        switchCompany,
        refreshCompanies,
        canAccessCompany,
        canAccessSubsidiary,
        canAccessBranch
    };
};

export default useCompanyManager;
