import React from 'react';

const Productos = () => {
	return (
		<div className='p-6'>
			<div className='mx-auto max-w-7xl'>
				<div className='rounded-lg bg-white shadow-md'>
					<div className='border-b border-gray-200 px-6 py-4'>
						<div className='flex items-center justify-between'>
							<h1 className='text-3xl font-semibold text-gray-900'>Productos</h1>
							<button className='rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'>
								Nuevo Producto
							</button>
						</div>
					</div>
					<div className='p-6'>
						<div className='py-12 text-center'>
							<div className='mb-4 text-lg text-gray-500'>
								📦 Gestión de Productos
							</div>
							<p className='mb-8 text-gray-600'>
								Aquí podrás crear, editar y gestionar tu catálogo de productos.
								<br />
								Cada producto puede tener múltiples variantes, precios, y
								configuraciones de inventario.
							</p>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
								<div className='rounded-lg bg-gray-50 p-6'>
									<h3 className='mb-2 font-semibold text-gray-900'>
										Información Básica
									</h3>
									<p className='text-sm text-gray-600'>
										Nombre, SKU, descripción, categoría y marca del producto
									</p>
								</div>
								<div className='rounded-lg bg-gray-50 p-6'>
									<h3 className='mb-2 font-semibold text-gray-900'>
										Precios y Costos
									</h3>
									<p className='text-sm text-gray-600'>
										Precio base, precio de costo, descuentos y configuraciones
										comerciales
									</p>
								</div>
								<div className='rounded-lg bg-gray-50 p-6'>
									<h3 className='mb-2 font-semibold text-gray-900'>
										Control de Inventario
									</h3>
									<p className='text-sm text-gray-600'>
										Stock mínimo, ubicaciones, seguimiento por lote o serie
									</p>
								</div>
							</div>
							<div className='mt-8'>
								<p className='text-sm text-blue-600'>
									💡 <strong>Integración con Backend:</strong> Esta página se
									conectará automáticamente con los endpoints:
									<br />
									<code className='rounded bg-gray-100 px-2 py-1'>
										GET /api/products
									</code>{' '}
									|
									<code className='rounded bg-gray-100 px-2 py-1'>
										POST /api/products
									</code>{' '}
									|
									<code className='rounded bg-gray-100 px-2 py-1'>
										PUT /api/products/:id
									</code>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Productos;
