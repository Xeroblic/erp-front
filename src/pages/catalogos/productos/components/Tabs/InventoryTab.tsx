import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface InventoryTabProps {
	// Aquí puedes agregar props específicas para el inventario
}

const InventoryTab: React.FC<InventoryTabProps> = () => {
	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Icon icon='HeroCubeTransparent' className='h-5 w-5' />
						Gestión de Inventario
					</CardTitle>
				</CardHeader>
				<CardBody>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='rounded-lg border p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm text-gray-600'>Stock Total</p>
									<p className='text-2xl font-bold'>1,234</p>
								</div>
								<div className='rounded-full bg-blue-100 p-3'>
									<Icon
										icon='HeroCubeTransparent'
										className='h-6 w-6 text-blue-600'
									/>
								</div>
							</div>
						</div>

						<div className='rounded-lg border p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm text-gray-600'>Productos en Stock Bajo</p>
									<p className='text-2xl font-bold text-orange-600'>15</p>
								</div>
								<div className='rounded-full bg-orange-100 p-3'>
									<Icon
										icon='HeroExclamationTriangle'
										className='h-6 w-6 text-orange-600'
									/>
								</div>
							</div>
						</div>

						<div className='rounded-lg border p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm text-gray-600'>Productos Agotados</p>
									<p className='text-2xl font-bold text-red-600'>3</p>
								</div>
								<div className='rounded-full bg-red-100 p-3'>
									<Icon icon='HeroXCircle' className='h-6 w-6 text-red-600' />
								</div>
							</div>
						</div>
					</div>

					<div className='mt-6 flex flex-wrap gap-2'>
						<Button variant='outline' icon='HeroArrowDownTray'>
							Importar Inventario
						</Button>
						<Button variant='outline' icon='HeroArrowUpTray'>
							Exportar Inventario
						</Button>
						<Button color='amber' icon='HeroExclamationTriangle'>
							Ver Stock Bajo
						</Button>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Movimientos Recientes</CardTitle>
				</CardHeader>
				<CardBody>
					<div className='space-y-3'>
						{[1, 2, 3, 4, 5].map((item) => (
							<div
								key={item}
								className='flex items-center justify-between border-b pb-3 last:border-0'>
								<div className='flex items-center gap-3'>
									<div className='rounded-full bg-green-100 p-2'>
										<Icon icon='HeroPlus' className='h-4 w-4 text-green-600' />
									</div>
									<div>
										<p className='font-medium'>Entrada de inventario</p>
										<p className='text-sm text-gray-600'>
											Producto ejemplo #{item}
										</p>
									</div>
								</div>
								<div className='text-right'>
									<Badge color='green'>+50 unidades</Badge>
									<p className='text-sm text-gray-500'>Hace 2 horas</p>
								</div>
							</div>
						))}
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default InventoryTab;
