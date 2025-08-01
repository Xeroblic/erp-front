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
    const [isLoading, setIsLoading] = useState(false);

    // Empresa actual del usuario
    const currentCompany = user?.company ? {
        id: user.company.id,
        name: user.company.name,
        rut: user.company.rut || '',
        role: user.position || 'employee',
        is_primary: true // Se puede mejorar con info del backend
    } : null;

    // Cambiar empresa activa
    const switchCompany = useCallback(async (companyId: number): Promise<boolean> => {
        setIsLoading(true);
        try {
            await ApiService.fetchData({
                url: '/auth/switch-company',
                method: 'post',
                data: { company_id: companyId }
            });

            // Refrescar datos del usuario
            await dispatch(userMeThunk()).unwrap();

            toast.success('Empresa cambiada exitosamente');
            return true;
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error al cambiar empresa');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]);

    // Obtener empresas disponibles
    const refreshCompanies = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await ApiService.fetchData<{ companies: CompanyInfo[] }>({
                url: '/auth/available-companies',
                method: 'get'
            });
            setAvailableCompanies(response.data.companies);
        } catch (error: any) {
            toast.error('Error al cargar empresas disponibles');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Verificar acceso a empresa
    const canAccessCompany = useCallback((companyId: number): boolean => {
        if (!user) return false;

        // Super admin tiene acceso total
        if (user.authority?.includes('super-admin')) return true;

        // Verificar si el usuario tiene acceso a esta empresa
        return user.company?.id === companyId ||
            availableCompanies.some(company => company.id === companyId);
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
