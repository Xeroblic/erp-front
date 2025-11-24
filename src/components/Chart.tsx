import React, { FC, memo, useEffect, useMemo, useRef } from 'react';
import ApexCharts from 'apexcharts';
import colors from 'tailwindcss/colors';
import _ from 'lodash';

// Derive the Apex types from the class definition (the bundled d.ts exports only the class)
type ApexOptions = Parameters<ApexCharts['updateOptions']>[0];
type ChartSeries = Parameters<ApexCharts['updateSeries']>[0];
type ChartType = NonNullable<NonNullable<ApexOptions['chart']>['type']>;

export interface IChartProps {
	options?: ApexOptions;
	series: ChartSeries;
	type: ChartType;
	width?: string | number;
	height?: string | number;
}

const Chart: FC<IChartProps> = (props) => {
	const { series, options = {}, type, width = '100%', height = 'auto' } = props;
	const chartRef = useRef<HTMLDivElement | null>(null);
	const chartInstanceRef = useRef<ApexCharts | null>(null);

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
		return _.merge({}, defaultOptions, options, {
			chart: {
				...defaultOptions.chart,
				type,
				width,
				height: height === 'auto' ? undefined : height,
			},
		});
	}, [defaultOptions, options, type, width, height]);

	useEffect(() => {
		if (!chartRef.current) return;
		const instance = new ApexCharts(chartRef.current, {
			...buildOptions,
			series,
		});
		chartInstanceRef.current = instance;
		instance.render();

		return () => {
			instance.destroy();
			chartInstanceRef.current = null;
		};
	}, []); // mount only

	useEffect(() => {
		if (!chartInstanceRef.current) return;
		chartInstanceRef.current.updateOptions(buildOptions, true, true);
		chartInstanceRef.current.updateSeries(series, true);
	}, [buildOptions, series]);

	const inlineHeight = height === 'auto' ? undefined : height;
	const inlineWidth = width;

	return <div ref={chartRef} style={{ width: inlineWidth, height: inlineHeight }} />;
};
Chart.displayName = 'Chart';

export default memo(Chart);
