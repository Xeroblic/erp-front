import React, { FC, memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import ApexCharts, { type ApexOptions } from 'apexcharts';
import colors from 'tailwindcss/colors';
import _ from 'lodash';

type ChartSeries = Parameters<ApexCharts['updateSeries']>[0];
type ChartType = NonNullable<NonNullable<ApexOptions['chart']>['type']>;

/** ApexCharts falla sin avisar en la UI: el error queda en consola para poder depurarlo. */
const reportChartError = (message: string, error: unknown): void => {
	// eslint-disable-next-line no-console
	console.error(message, error);
};

export interface IChartProps {
	options?: ApexOptions;
	series: ChartSeries;
	type: ChartType;
	width?: string | number;
	height?: string | number;
}

const isValidDimension = (value: string | number | undefined | null): value is string | number => {
	if (typeof value === 'number') {
		return Number.isFinite(value) && value >= 0;
	}
	if (typeof value === 'string') {
		return value.trim().length > 0 && value.trim() !== 'NaN';
	}
	return false;
};

const sanitizeDimension = <T extends string | number>(value: T | undefined, fallback: T): T => {
	return isValidDimension(value) ? value : fallback;
};

const Chart: FC<IChartProps> = (props) => {
	const { series, options = {}, type, width = '100%', height = 'auto' } = props;
	const chartRef = useRef<HTMLDivElement | null>(null);
	const chartInstanceRef = useRef<ApexCharts | null>(null);

	const sanitizedWidth = sanitizeDimension(width, '100%');
	const sanitizedHeight = height === 'auto' ? 'auto' : sanitizeDimension(height, 300);

	const defaultOptions: ApexOptions = useMemo(
		() => ({
			chart: {
				toolbar: {
					show: false,
				},
				animations: {
					enabled: true,
				},
			},
			colors: [
				colors.blue['500'],
				colors.emerald['500'],
				colors.amber['500'],
				colors.rose['500'],
				colors.purple['500'],
			],
			dataLabels: {
				enabled: false,
			},
			grid: {
				show: true,
				borderColor: `${colors.zinc['500']}25`,
				strokeDashArray: 0,
				xaxis: {
					lines: {
						show: false,
					},
				},
				yaxis: {
					lines: {
						show: true,
					},
				},
				padding: {
					top: 0,
					right: 10,
					bottom: 0,
					left: 10,
				},
			},
			legend: {
				labels: {
					colors: colors.zinc['500'],
				},
			},
			plotOptions: {
				bar: {
					borderRadius: 4,
				},
				candlestick: {
					colors: {
						upward: `${colors.green['500']}`,
						downward: `${colors.rose['500']}`,
					},
				},
				boxPlot: {
					colors: {
						upper: `${colors.green['500']}`,
						lower: `${colors.rose['500']}`,
					},
				},
			},
			stroke: {
				// show: true,
				// width: 2,
				// colors: ['transparent'],
			},
			tooltip: {
				theme: 'dark',
			},
			xaxis: {
				axisBorder: {
					show: true,
					color: `${colors.zinc['500']}50`,
				},
				axisTicks: {
					show: false,
				},
				labels: {
					style: {
						colors: colors.zinc['500'],
					},
				},
			},
			yaxis: {
				labels: {
					style: {
						colors: colors.zinc['500'],
					},
				},
				title: {
					style: {
						color: colors.zinc['500'],
					},
				},
			},
		}),
		[],
	);

	const buildOptions = useMemo(() => {
		const computedHeight = sanitizedHeight === 'auto' ? undefined : sanitizedHeight;
		return _.merge({}, defaultOptions, options, {
			chart: {
				...defaultOptions.chart,
				type,
				width: sanitizedWidth,
				height: computedHeight,
			},
		});
	}, [defaultOptions, options, type, sanitizedWidth, sanitizedHeight]);

	// La instancia se crea en el próximo frame: si la serie llega antes, el efecto de
	// actualización todavía no tiene instancia, así que la creación lee lo vigente.
	const latestConfigRef = useRef({ buildOptions, series });
	useLayoutEffect(() => {
		latestConfigRef.current = { buildOptions, series };
	}, [buildOptions, series]);

	useEffect(() => {
		const initChart = () => {
			if (!chartRef.current) return;
			if (chartInstanceRef.current) {
				try {
					chartInstanceRef.current.destroy();
				} catch (error) {
					reportChartError('No se pudo limpiar el gráfico previo', error);
				} finally {
					chartInstanceRef.current = null;
				}
			}

			const { buildOptions: currentOptions, series: currentSeries } = latestConfigRef.current;
			const instance = new ApexCharts(chartRef.current, {
				...currentOptions,
				series: currentSeries,
			});

			chartInstanceRef.current = instance;
			instance.render().catch((error: unknown) => {
				reportChartError('No se pudo renderizar el gráfico', error);
			});
		};

		// Usamos requestAnimationFrame para asegurar que el DOM esté listo y tenga dimensiones
		const animationFrameId = requestAnimationFrame(initChart);

		return () => {
			cancelAnimationFrame(animationFrameId);
			if (!chartInstanceRef.current) return;
			try {
				chartInstanceRef.current.destroy();
			} catch (error) {
				reportChartError('No se pudo destruir el gráfico', error);
			} finally {
				chartInstanceRef.current = null;
			}
		};
	}, []); // mount only

	useEffect(() => {
		const instance = chartInstanceRef.current;
		if (!instance) return;
		// `el` sólo existe mientras la instancia está montada; los tipos de ApexCharts no lo declaran.
		const isRendered = 'el' in instance && Boolean(instance.el);
		if (!chartRef.current || !chartRef.current.isConnected || !isRendered) return;
		const onUpdateError = (error: unknown) =>
			reportChartError('No se pudo actualizar el gráfico', error);
		try {
			instance.updateOptions(buildOptions, true, true).catch(onUpdateError);
			instance.updateSeries(series, true).catch(onUpdateError);
		} catch (error) {
			onUpdateError(error);
		}
	}, [buildOptions, series]);

	const inlineHeight = sanitizedHeight === 'auto' ? undefined : sanitizedHeight;
	const inlineWidth = sanitizedWidth;

	return <div ref={chartRef} style={{ width: inlineWidth, height: inlineHeight }} />;
};
Chart.displayName = 'Chart';

export default memo(Chart);
