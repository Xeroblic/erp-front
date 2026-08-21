// src/utils/predictions.ts

export const calculateLinearRegressionProjection = (
	continuousDataSales: number[],
	futureDays: number = 30,
): number => {
	const n = continuousDataSales.length;
	if (n === 0) return 0;
	if (n === 1) return continuousDataSales[0] * futureDays;

	let sumX = 0,
		sumY = 0,
		sumXY = 0,
		sumX2 = 0;

	for (let i = 0; i < n; i++) {
		sumX += i;
		sumY += continuousDataSales[i];
		sumXY += i * continuousDataSales[i];
		sumX2 += i * i;
	}

	const denominator = n * sumX2 - sumX * sumX;
	if (denominator === 0) return 0;

	const slope = (n * sumXY - sumX * sumY) / denominator;
	const intercept = (sumY - slope * sumX) / n;

	let computedProjection = 0;
	for (let futureDay = n; futureDay < n + futureDays; futureDay++) {
		const predictedValue = slope * futureDay + intercept;
		// Si el día predice pérdidas o ventas negativas, lo dejamos en 0
		computedProjection += Math.max(0, predictedValue);
	}

	return computedProjection;
};
