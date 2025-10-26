import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';

interface AnalyticsTabProps {
	// Agregar props específicas para el análisis
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
	return (
		<div className='space-y-6'>
			<div className='grid gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Icon icon='HeroChartBarSquare' className='h-5 w-5' />
							Productos Más Vendidos
						</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='space-y-4'>
							{[1, 2, 3, 4, 5].map((item) => (
								<div key={item} className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600'>
											{item}
										</div>
										<div>
											<p className='font-medium'>Producto Ejemplo {item}</p>
											<p className='text-sm text-gray-500'>
												SKU: PRD-{item}00{item}
											</p>
										</div>
									</div>
									<div className='text-right'>
										<p className='font-semibold'>{100 - item * 15} vendidos</p>
										<p className='text-sm text-gray-500'>Este mes</p>
									</div>
								</div>
							))}
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Icon icon='HeroChartPie' className='h-5 w-5' />
							Distribución por Categoría
						</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='space-y-4'>
							{['Electrónicos', 'Hogar', 'Deportes', 'Ropa', 'Otros'].map(
								(category, index) => (
									<div
										key={category}
										className='flex items-center justify-between'>
										<div className='flex items-center gap-3'>
											<div
												className={`h-4 w-4 rounded-full ${
													[
														'bg-blue-500',
														'bg-green-500',
														'bg-yellow-500',
														'bg-purple-500',
														'bg-gray-500',
													][index]
												}`}
											/>
											<span className='font-medium'>{category}</span>
										</div>
										<span className='text-sm text-gray-600'>
											{30 - index * 5}%
										</span>
									</div>
								),
							)}
						</div>
					</CardBody>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle className='flex items-center gap-2'>
							<Icon icon='HeroDocumentChartBar' className='h-5 w-5' />
							Reportes y Análisis
						</CardTitle>
						<div className='flex gap-2'>
							<Button variant='outline' size='sm' icon='HeroCalendarDays'>
								Este mes
							</Button>
							<Button variant='outline' size='sm' icon='HeroArrowDownTray'>
								Exportar
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardBody>
					<div className='grid gap-4 md:grid-cols-4'>
						<div className='rounded-lg bg-gray-50 p-4 text-center'>
							<p className='text-2xl font-bold text-blue-600'>$45,230</p>
							<p className='text-sm text-gray-600'>Valor Total Inventario</p>
						</div>
						<div className='rounded-lg bg-gray-50 p-4 text-center'>
							<p className='text-2xl font-bold text-green-600'>$12,450</p>
							<p className='text-sm text-gray-600'>Ventas del Mes</p>
						</div>
						<div className='rounded-lg bg-gray-50 p-4 text-center'>
							<p className='text-2xl font-bold text-orange-600'>15.2%</p>
							<p className='text-sm text-gray-600'>Margen Promedio</p>
						</div>
						<div className='rounded-lg bg-gray-50 p-4 text-center'>
							<p className='text-2xl font-bold text-purple-600'>89</p>
							<p className='text-sm text-gray-600'>Productos Activos</p>
						</div>
					</div>

					<div className='mt-6'>
						<h4 className='mb-4 font-medium'>Tendencias</h4>
						<div className='flex h-64 items-center justify-center rounded-lg bg-gray-100'>
							<div className='text-center text-gray-500'>
								<Icon
									icon='HeroChartBarSquare'
									className='mx-auto mb-2 h-12 w-12'
								/>
								<p>Gráfico de tendencias aquí</p>
								<p className='text-sm'>Implementar con librería de gráficos</p>
							</div>
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default AnalyticsTab;
