import { useMemo } from 'react';
import type { IStockBranchAllocation } from '../types';

interface UseStockDeltaParams {
	totalSubsidiaryStock: number;
	allocations: IStockBranchAllocation[];
}

/**
 * Hook puro para calcular balance de stock distribuido entre sucursales
 * @Full_React
 */
export const useStockDelta = ({ totalSubsidiaryStock, allocations }: UseStockDeltaParams) => {
	return useMemo(() => {
		const sumAllocations = allocations.reduce(
			(acc, curr) => acc + (Number(curr.stock) || 0),
			0,
		);
		
		const delta = totalSubsidiaryStock - sumAllocations;
		const isBalanced = delta === 0;

		let message = 'Distribución exacta. El stock coincide con las sucursales.';
		if (delta > 0) {
			message = `Inconsistencia: Faltan ${delta} unidades por encontrar.`;
		} else if (delta < 0) {
			message = `Inconsistencia: Hay un exceso de ${Math.abs(delta)} unidades entre las sucursales.`;
		}

		return {
			totalSubsidiaryStock,
			sumAllocations,
			delta,
			isBalanced,
			message,
		};
	}, [totalSubsidiaryStock, allocations]);
};
