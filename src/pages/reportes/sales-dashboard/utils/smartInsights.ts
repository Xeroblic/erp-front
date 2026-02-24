import type { SalesDashboardStats } from '../../types';

export const generateSmartInsights = (
	currentStats: SalesDashboardStats,
	previousStats?: SalesDashboardStats,
): string[] => {
	const insights: string[] = [];
	const formatter = new Intl.NumberFormat('es-CL', {
		style: 'currency',
		currency: 'CLP',
		maximumFractionDigits: 0,
	});

	// 1. Rendimiento General
	if (currentStats.total > 0) {
		insights.push(
			`El volumen total de ventas alcanzó los ${formatter.format(
				currentStats.total,
			)} mediante ${currentStats.count} órdenes procesadas.`,
		);
	} else {
		insights.push('No se registraron ventas en el periodo seleccionado.');
	}

	// 2. Comparativa Mes a Mes (si existe previousStats)
	if (previousStats && previousStats.total > 0) {
		const growth = ((currentStats.total - previousStats.total) / previousStats.total) * 100;
		const trend = growth > 0 ? 'un crecimiento' : 'una contracción';
		insights.push(
			`Este periodo representa ${trend} del ${Math.abs(Math.round(growth))}% en comparación con el periodo anterior (${formatter.format(
				previousStats.total,
			)}).`,
		);
	}

	// 3. Salud de Devoluciones
	if (currentStats.retPct > 0) {
		if (currentStats.retPct > 15) {
			insights.push(
				`Atención: La tasa de devoluciones es alta (${currentStats.retPct.toFixed(
					1,
				)}%), totalizando ${formatter.format(
					currentStats.refundedTotal,
				)}. Se recomienda investigar las causas de reembolso.`,
			);
		} else {
			insights.push(
				`La tasa de devoluciones se mantiene controlada en un ${currentStats.retPct.toFixed(
					1,
				)}% (${formatter.format(currentStats.refundedTotal)}).`,
			);
		}
	} else if (currentStats.total > 0) {
		insights.push('Excelente indicador: No se procesaron devoluciones en este periodo.');
	}

	// 4. Proyección ML
	if (currentStats.projectedTotal > 0) {
		insights.push(
			`El algoritmo de pronóstico estima que los ingresos a 30 días escalarán alrededor de ${formatter.format(
				currentStats.projectedTotal,
			)} si se mantiene la tendencia reciente.`,
		);
	}

	return insights;
};
