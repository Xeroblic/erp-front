import React from 'react';

const Marcas: React.FC = () => {
	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='mx-auto max-w-7xl'>
				{/* Header */}
				<div className='mb-8'>
					<h1 className='mb-2 text-3xl font-bold text-gray-900'>Gestión de Marcas</h1>
					<p className='text-gray-600'>
						Administra las marcas de productos para mejorar la organización del
						inventario
					</p>
				</div>

				{/* Stats Cards */}
				<div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-4'>
					<div className='rounded-lg border-l-4 border-indigo-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Total Marcas</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-green-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Marcas Activas</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-orange-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Con Logo</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Productos Asociados</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
				</div>

				{/* Main Content */}
				<div className='rounded-lg bg-white shadow-md'>
					<div className='border-b border-gray-200 p-6'>
						<div className='flex items-center justify-between'>
							<h2 className='text-xl font-semibold text-gray-900'>Lista de Marcas</h2>
							<button className='rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700'>
								+ Nueva Marca
							</button>
						</div>
					</div>

					<div className='p-6'>
						<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
							{/* Marcas Info */}
							<div className='space-y-4'>
								<h3 className='mb-4 text-lg font-semibold text-gray-800'>
									Información de Marcas
								</h3>

								<div className='rounded-lg bg-gray-50 p-4'>
									<h4 className='mb-2 font-medium text-gray-700'>
										Campos de Marca
									</h4>
									<ul className='space-y-2 text-sm text-gray-600'>
										<li>
											• <strong>Nombre:</strong> Denominación de la marca
										</li>
										<li>
											• <strong>Código:</strong> Identificador único
										</li>
										<li>
											• <strong>Descripción:</strong> Información adicional
										</li>
										<li>
											• <strong>Logo:</strong> Imagen de la marca
										</li>
										<li>
											• <strong>País de origen:</strong> Procedencia
										</li>
										<li>
											• <strong>Sitio web:</strong> URL oficial
										</li>
									</ul>
								</div>

								<div className='rounded-lg bg-indigo-50 p-4'>
									<h4 className='mb-2 font-medium text-indigo-800'>
										Funcionalidades
									</h4>
									<ul className='space-y-2 text-sm text-indigo-700'>
										<li>✓ Registro de marcas con información completa</li>
										<li>✓ Subida de logos e imágenes</li>
										<li>✓ Asociación con categorías de productos</li>
										<li>✓ Control de estado activo/inactivo</li>
										<li>✓ Búsqueda y filtrado avanzado</li>
									</ul>
								</div>
							</div>

							{/* API Integration Info */}
							<div className='space-y-4'>
								<h3 className='mb-4 text-lg font-semibold text-gray-800'>
									Integración Backend
								</h3>

								<div className='rounded-lg bg-green-50 p-4'>
									<h4 className='mb-2 font-medium text-green-800'>
										API de Marcas
									</h4>
									<div className='space-y-2 text-sm'>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-green-100 px-2 py-1 font-mono text-xs text-green-800'>
												GET
											</span>
											<code className='text-green-700'>/api/brands</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-blue-100 px-2 py-1 font-mono text-xs text-blue-800'>
												POST
											</span>
											<code className='text-blue-700'>/api/brands</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-yellow-100 px-2 py-1 font-mono text-xs text-yellow-800'>
												PUT
											</span>
											<code className='text-yellow-700'>/api/brands/:id</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-red-100 px-2 py-1 font-mono text-xs text-red-800'>
												DELETE
											</span>
											<code className='text-red-700'>/api/brands/:id</code>
										</div>
									</div>
								</div>

								<div className='rounded-lg bg-blue-50 p-4'>
									<h4 className='mb-2 font-medium text-blue-800'>
										Ejemplos de Marcas
									</h4>
									<div className='grid grid-cols-2 gap-2 text-sm text-blue-700'>
										<div className='rounded border bg-white p-2'>
											<div className='font-medium'>Apple</div>
											<div className='text-xs text-gray-600'>Tecnología</div>
										</div>
										<div className='rounded border bg-white p-2'>
											<div className='font-medium'>Samsung</div>
											<div className='text-xs text-gray-600'>
												Electrónicos
											</div>
										</div>
										<div className='rounded border bg-white p-2'>
											<div className='font-medium'>Nike</div>
											<div className='text-xs text-gray-600'>Deportes</div>
										</div>
										<div className='rounded border bg-white p-2'>
											<div className='font-medium'>Coca-Cola</div>
											<div className='text-xs text-gray-600'>Bebidas</div>
										</div>
									</div>
								</div>

								<div className='rounded-lg bg-orange-50 p-4'>
									<h4 className='mb-2 font-medium text-orange-800'>
										En Desarrollo
									</h4>
									<ul className='space-y-1 text-sm text-orange-700'>
										<li>• Gestor de archivos para logos</li>
										<li>• Formulario dinámico de creación</li>
										<li>• Vista previa de productos por marca</li>
										<li>• Reportes de marcas más vendidas</li>
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
												Logo
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Marca
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Código
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												País
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
												colSpan={7}
												className='px-6 py-12 text-center text-gray-500'>
												<div className='space-y-2'>
													<p className='text-lg'>
														No hay marcas registradas
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

export default Marcas;
