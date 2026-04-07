import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../store/rootReducer';
import type { ISubempresa, ISucursal } from '../../../../interface/empresas.interface';
import type {
	AuthorizationAccessScope,
	AuthorizationBranchRef,
	AuthorizationSubsidiaryRef,
} from '../../../../types/authorization';

export type AccessBranch = AuthorizationBranchRef;

export type AccessSubsidiary = AuthorizationSubsidiaryRef;

export type UserAccess = AuthorizationAccessScope;

/**
	* Hook para obtener y transformar los accesos jerárquicos de un usuario
	* Combina datos de subsidiarias y sucursales desde los slices existentes
	* @param _userId - ID del usuario (reservado para futuro filtrado) 
*/
export const useUserAccess = (_userId?: number) => {
	// Obtener datos de los slices
	const subsidiariesList = useSelector((state: RootState) => state.subEmpresa.lista);
	const branchesList = useSelector((state: RootState) => state.sucursales.lista);
	const subsidiariesLoading = useSelector((state: RootState) => state.subEmpresa.loading);
	const branchesLoading = useSelector((state: RootState) => state.sucursales.loading);

	// Transformar subsidiarias al formato AccessSubsidiary
	const transformedSubsidiaries = useMemo<AccessSubsidiary[]>(() => {
		return subsidiariesList.map((sub: ISubempresa) => ({
			id: sub.id,
			name: sub.name || sub.subsidiary_name || '',
			company: sub.company_id
				? {
						id: sub.company_id,
						name: '', // El nombre de la empresa vendría del slice de empresa si es necesario
					}
				: null,
		}));
	}, [subsidiariesList]);

	// Transformar sucursales al formato AccessBranch
	const transformedBranches = useMemo<AccessBranch[]>(() => {
		return branchesList.map((branch: ISucursal) => ({
			id: branch.id,
			name: branch.name || branch.branch_name || '',
			subsidiary:
				branch.subsidiary_id || branch.subempresa_id
					? {
							id: (branch.subsidiary_id || branch.subempresa_id)!,
							name: branch.subsidiary_name || '',
						}
					: null,
			source: 'direct', // Esto podría venir de otra fuente de datos
			is_primary: false, // Esto también podría determinarse de otra forma
			position: branch.manager_name, // Usar el nombre del manager como posición temporal
		}));
	}, [branchesList]);

	// Combinar en el formato UserAccess
	const userAccess = useMemo<UserAccess>(() => {
		return {
			subsidiaries: transformedSubsidiaries,
			branches: transformedBranches,
		};
	}, [transformedSubsidiaries, transformedBranches]);

	const isLoading = subsidiariesLoading || branchesLoading;

	return {
		access: userAccess,
		isLoading,
		subsidiaries: transformedSubsidiaries,
		branches: transformedBranches,
	};
};
