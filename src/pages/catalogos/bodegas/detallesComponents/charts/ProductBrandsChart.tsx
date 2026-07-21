import React, { useMemo } from 'react';
import { ApexOptions } from 'apexcharts';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Chart from '@/components/Chart';
import Icon from '@/components/icon/Icon';
import useDarkMode from '@/hooks/useDarkMode';
import { IWarehouseProduct } from '@/interface/warehouse.interface';
import type { IProduct } from '@/interface/product.interface';

interface ProductBrandsChartProps {
	products: IWarehouseProduct[];
	allProducts: IProduct[];
}

/**
 * Gráfico de productos por marca
 * Muestra la distribución de productos en la bodega según su marca
 */
const ProductBrandsChart: React.FC<ProductBrandsChartProps> = ({ products, allProducts }) => {
	const { isDarkTheme } = useDarkMode();

	const brandData = useMemo(() => {
		// Sumar stock total por marca
		const brandStockMap = new Map<string, { stock: number; productCount: number }>();

		products.forEach((warehouseProduct) => {
			// Buscar el producto completo para obtener su marca
			const fullProduct = allProducts.find((p) => p.id === warehouseProduct.id);
			const brandName = fullProduct?.brand?.name || 'Sin Marca';
			const stock = warehouseProduct.quantity || 0;

			const current = brandStockMap.get(brandName) || { stock: 0, productCount: 0 };
			brandStockMap.set(brandName, {
				stock: current.stock + stock,
				productCount: current.productCount + 1,
			});
		});

		// Convertir a arrays para el chart
		const brands = Array.from(brandStockMap.keys());
		const stockData = Array.from(brandStockMap.values());

		// Ordenar por stock total (mayor a menor)
		const sorted = brands
			.map((brand, index) => ({
				brand,
				stock: stockData[index].stock,
				productCount: stockData[index].productCount,
			}))
			.sort((a, b) => b.stock - a.stock);

		return {
			brands: sorted.map((item) => item.brand),
			stocks: sorted.map((item) => item.stock),
			productCounts: sorted.map((item) => item.productCount),
		};
	}, [products, allProducts]);

	const chartOptions: ApexOptions = useMemo(
		() => ({
			chart: {
				type: 'bar',
				toolbar: { show: false },
				background: 'transparent',
			},
			plotOptions: {
				bar: {
					horizontal: true,
					borderRadius: 6,
					barHeight: '70%',
					dataLabels: {
						position: 'center',
					},
				},
			},
			dataLabels: {
				enabled: false,
			},
			xaxis: {
				categories: brandData.brands,
				labels: {
					style: {
						colors: isDarkTheme ? '#9ca3af' : '#6b7280',
						fontSize: '11px',
					},
				},
				axisBorder: {
					show: false,
				},
			},
			yaxis: {
				labels: {
					style: {
						colors: isDarkTheme ? '#9ca3af' : '#6b7280',
						fontSize: '12px',
						fontWeight: 500,
					},
				},
			},
			colors: ['#8b5cf6'],
			grid: {
				borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
				strokeDashArray: 4,
				xaxis: {
					lines: {
						show: true,
					},
				},
				yaxis: {
					lines: {
						show: false,
					},
				},
				padding: {
					left: 10,
					right: 20,
				},
			},
			tooltip: {
				theme: isDarkTheme ? 'dark' : 'light',
				y: {
					formatter: (val: number) => `${val} unidad${val !== 1 ? 'es' : ''} en stock`,
				},
			},
			legend: {
				show: false,
			},
		}),
		[isDarkTheme, brandData.brands],
	);

	const series = [
		{
			name: 'Stock Total',
			data: brandData.stocks,
		},
	];

	const totalStock = brandData.stocks.reduce((sum, stock) => sum + stock, 0);
	const totalBrands = brandData.brands.length;
	const totalProducts = brandData.productCounts.reduce((sum, count) => sum + count, 0);

	return (
		<Card>
			<CardHeader className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroTag' className='size-5 text-violet-500' />
					<CardTitle>Stock por Marca</CardTitle>
				</div>
				<div className='text-sm text-zinc-500 dark:text-zinc-400'>
					{totalBrands} marca{totalBrands !== 1 ? 's' : ''} • {totalStock} unidades •{' '}
					{totalProducts} productos
				</div>
			</CardHeader>
			<CardBody>
				{totalProducts > 0 ? (
					<Chart
						series={series}
						options={chartOptions}
						type='bar'
						height={Math.max(250, totalBrands * 60)}
						width='100%'
					/>
				) : (
					<div className='flex h-48 items-center justify-center text-zinc-400'>
						<div className='text-center'>
							<Icon
								icon='HeroInboxStack'
								className='mx-auto mb-2 size-12 opacity-50'
							/>
							<p className='text-sm'>No hay productos asociados</p>
						</div>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default ProductBrandsChart;
