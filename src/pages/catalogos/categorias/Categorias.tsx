import React from 'react';

const Categorias: React.FC = () => {
	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='mx-auto max-w-7xl'>
				{/* Header */}
				<div className='mb-8'>
					<h1 className='mb-2 text-3xl font-bold text-gray-900'>Gestión de Categorías</h1>
					<p className='text-gray-600'>
						Administra las categorías de productos para organizar tu inventario
					</p>
				</div>

				{/* Stats Cards */}
				<div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-4'>
					<div className='rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Total Categorías</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-green-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Categorías Activas</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-yellow-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Con Subcategorías</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Productos Asignados</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
				</div>

				{/* Main Content */}
				<div className='rounded-lg bg-white shadow-md'>
					<div className='border-b border-gray-200 p-6'>
						<div className='flex items-center justify-between'>
							<h2 className='text-xl font-semibold text-gray-900'>
								Lista de Categorías
							</h2>
							<button className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'>
								+ Nueva Categoría
							</button>
						</div>
					</div>

					<div className='p-6'>
						<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
							{/* Categorías Info */}
							<div className='space-y-4'>
								<h3 className='mb-4 text-lg font-semibold text-gray-800'>
									Estructura de Categorías
								</h3>

								<div className='rounded-lg bg-gray-50 p-4'>
									<h4 className='mb-2 font-medium text-gray-700'>
										Jerarquía de Categorías
									</h4>
									<ul className='space-y-2 text-sm text-gray-600'>
										<li>
											• Categorías principales (ej: Electrónicos, Ropa, Hogar)
										</li>
										<li>• Subcategorías (ej: Smartphones, Laptops, Tablets)</li>
										<li>• Sub-subcategorías (ej: iPhone, Samsung, Huawei)</li>
									</ul>
								</div>

								<div className='rounded-lg bg-blue-50 p-4'>
									<h4 className='mb-2 font-medium text-blue-800'>
										Funcionalidades
									</h4>
									<ul className='space-y-2 text-sm text-blue-700'>
										<li>✓ Crear categorías padre e hijas</li>
										<li>✓ Asignar códigos únicos</li>
										<li>✓ Definir propiedades específicas</li>
										<li>✓ Activar/desactivar categorías</li>
										<li>✓ Reordenar jerarquía</li>
									</ul>
								</div>
							</div>

							{/* API Integration Info */}
							<div className='space-y-4'>
								<h3 className='mb-4 text-lg font-semibold text-gray-800'>
									Endpoints Disponibles
								</h3>

								<div className='rounded-lg bg-green-50 p-4'>
									<h4 className='mb-2 font-medium text-green-800'>
										API de Categorías
									</h4>
									<div className='space-y-2 text-sm'>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-green-100 px-2 py-1 font-mono text-xs text-green-800'>
												GET
											</span>
											<code className='text-green-700'>/api/categories</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-blue-100 px-2 py-1 font-mono text-xs text-blue-800'>
												POST
											</span>
											<code className='text-blue-700'>/api/categories</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-yellow-100 px-2 py-1 font-mono text-xs text-yellow-800'>
												PUT
											</span>
											<code className='text-yellow-700'>
												/api/categories/:id
											</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-red-100 px-2 py-1 font-mono text-xs text-red-800'>
												DELETE
											</span>
											<code className='text-red-700'>
												/api/categories/:id
											</code>
										</div>
									</div>
								</div>

								<div className='rounded-lg bg-yellow-50 p-4'>
									<h4 className='mb-2 font-medium text-yellow-800'>
										Próximamente
									</h4>
									<ul className='space-y-1 text-sm text-yellow-700'>
										<li>• Tabla interactiva con datos reales</li>
										<li>• Formulario de creación/edición</li>
										<li>• Filtros y búsqueda avanzada</li>
										<li>• Vista árbol de categorías</li>
									</ul>
								</div>
							</div>
						</div>

						{/* Placeholder Table */}
						<div className='mt-8'>
							<div className='overflow-hidden rounded-lg border border-gray-200'>
								<table className='min-w-full divide-y divide-gray-200'>
									<thead className='bg-gray-50'>
										<tr>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Categoría
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Código
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Padre
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Productos
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Estado
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Acciones
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 bg-white'>
										<tr>
											<td
												colSpan={6}
												className='px-6 py-12 text-center text-gray-500'>
												<div className='space-y-2'>
													<p className='text-lg'>
														No hay categorías registradas
													</p>
													<p className='text-sm'>
														Conecta con el backend para cargar datos
														reales
													</p>
												</div>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Categorias;
