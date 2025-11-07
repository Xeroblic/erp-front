/**
 * Hook para obtener el branchId actual del usuario
 * Extrae el branchId desde la personalización del usuario
 */
import { useMemo } from 'react';
import { useAppSelector } from '../store';
import { selectPersonalizacionUsuario } from '../store/slices/personalizacion/personalizacionSlice';

export const useCurrentBranch = () => {
    const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
    const { user } = useAppSelector((state: any) => state.auth);

    const branchId = useMemo(() => {
        // 1. Prioridad: sucursal_principal de personalización
        if (personalizacionUsuario?.sucursal_principal) {
            return personalizacionUsuario.sucursal_principal;
        }

        // 2. Fallback: branch del usuario autenticado
        if (user?.branch?.id) {
            return user.branch.id;
        }

        // 3. Fallback: branch_id directo del usuario
        if (user?.branch_id) {
            return user.branch_id;
        }

        // 4. Sin branch disponible
        return null;
    }, [personalizacionUsuario?.sucursal_principal, user?.branch?.id, user?.branch_id]);

    return {
        branchId,
        hasValidBranch: branchId !== null,
    };
};
