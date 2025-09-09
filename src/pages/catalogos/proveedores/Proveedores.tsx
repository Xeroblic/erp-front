import React from 'react';

const Proveedores: React.FC = () => {
	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='mx-auto max-w-7xl'>
				{/* Header */}
				<div className='mb-8'>
					<h1 className='mb-2 text-3xl font-bold text-gray-900'>
						Gestión de Proveedores
					</h1>
					<p className='text-gray-600'>
						Administra tu red de proveedores para optimizar las compras y el suministro
					</p>
				</div>

				{/* Stats Cards */}
				<div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-4'>
					<div className='rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Total Proveedores</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-green-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Proveedores Activos</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-orange-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Órdenes Pendientes</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-red-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Evaluación Promedio</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
				</div>

				{/* Main Content */}
				<div className='rounded-lg bg-white shadow-md'>
					<div className='border-b border-gray-200 p-6'>
						<div className='flex items-center justify-between'>
							<h2 className='text-xl font-semibold text-gray-900'>
								Lista de Proveedores
							</h2>
							<button className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'>
								+ Nuevo Proveedor
							</button>
						</div>
					</div>

					<div className='p-6'>
						<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
							{/* Proveedores Info */}
							<div className='space-y-4'>
								<h3 className='mb-4 text-lg font-semibold text-gray-800'>
									Información del Proveedor
								</h3>

								<div className='rounded-lg bg-gray-50 p-4'>
									<h4 className='mb-2 font-medium text-gray-700'>
										Datos Básicos
									</h4>
									<ul className='space-y-2 text-sm text-gray-600'>
										<li>
											• <strong>Razón Social:</strong> Nombre legal de la
											empresa
										</li>
										<li>
											• <strong>RUC/NIT:</strong> Identificación tributaria
										</li>
										<li>
											• <strong>Contacto Principal:</strong> Persona
											responsable
										</li>
										<li>
											• <strong>Teléfono y Email:</strong> Medios de
											comunicación
										</li>
										<li>
											• <strong>Dirección:</strong> Ubicación física
										</li>
										<li>
											• <strong>Sitio Web:</strong> Presencia digital
										</li>
									</ul>
								</div>

								<div className='rounded-lg bg-blue-50 p-4'>
									<h4 className='mb-2 font-medium text-blue-800'>
										Información Comercial
									</h4>
									<ul className='space-y-2 text-sm text-blue-700'>
										<li>✓ Términos de pago y crédito</li>
										<li>✓ Categorías de productos que suministra</li>
										<li>✓ Tiempo de entrega promedio</li>
										<li>✓ Condiciones especiales</li>
										<li>✓ Evaluación de desempeño</li>
										<li>✓ Historial de compras</li>
									</ul>
								</div>

								<div className='rounded-lg bg-green-50 p-4'>
									<h4 className='mb-2 font-medium text-green-800'>
										Tipos de Proveedores
									</h4>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div className='rounded border border-green-200 bg-white p-2'>
											<div className='font-medium text-green-800'>
												Nacionales
											</div>
											<div className='text-xs text-gray-600'>
												Dentro del país
											</div>
										</div>
										<div className='rounded border border-green-200 bg-white p-2'>
											<div className='font-medium text-green-800'>
												Internacionales
											</div>
											<div className='text-xs text-gray-600'>Importación</div>
										</div>
										<div className='rounded border border-green-200 bg-white p-2'>
											<div className='font-medium text-green-800'>
												Exclusivos
											</div>
											<div className='text-xs text-gray-600'>
												Productos únicos
											</div>
										</div>
										<div className='rounded border border-green-200 bg-white p-2'>
											<div className='font-medium text-green-800'>
												Ocasionales
											</div>
											<div className='text-xs text-gray-600'>
												Compras esporádicas
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* API Integration Info */}
							<div className='space-y-4'>
								<h3 className='mb-4 text-lg font-semibold text-gray-800'>
									Backend Integration
								</h3>

								<div className='rounded-lg bg-green-50 p-4'>
									<h4 className='mb-2 font-medium text-green-800'>
										API de Proveedores
									</h4>
									<div className='space-y-2 text-sm'>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-green-100 px-2 py-1 font-mono text-xs text-green-800'>
												GET
											</span>
											<code className='text-green-700'>/api/suppliers</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-blue-100 px-2 py-1 font-mono text-xs text-blue-800'>
												POST
											</span>
											<code className='text-blue-700'>/api/suppliers</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-yellow-100 px-2 py-1 font-mono text-xs text-yellow-800'>
												PUT
											</span>
											<code className='text-yellow-700'>
												/api/suppliers/:id
											</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-red-100 px-2 py-1 font-mono text-xs text-red-800'>
												DELETE
											</span>
											<code className='text-red-700'>/api/suppliers/:id</code>
										</div>
									</div>
								</div>

								<div className='rounded-lg bg-purple-50 p-4'>
									<h4 className='mb-2 font-medium text-purple-800'>
										APIs Relacionadas
									</h4>
									<div className='space-y-2 text-sm text-purple-700'>
										<div>
											📦 <code>/api/purchase-orders</code> - Órdenes de compra
										</div>
										<div>
											💰 <code>/api/supplier-payments</code> - Pagos
										</div>
										<div>
											📋 <code>/api/supplier-evaluations</code> - Evaluaciones
										</div>
										<div>
											📊 <code>/api/supplier-reports</code> - Reportes
										</div>
									</div>
								</div>

								<div className='rounded-lg bg-yellow-50 p-4'>
									<h4 className='mb-2 font-medium text-yellow-800'>
										Funciones Avanzadas
									</h4>
									<ul className='space-y-1 text-sm text-yellow-700'>
										<li>• Gestión de contactos múltiples</li>
										<li>• Integración con compras</li>
										<li>• Evaluación periódica de proveedores</li>
										<li>• Historial de precios y negociaciones</li>
										<li>• Alertas de vencimiento de contratos</li>
										<li>• Dashboard de desempeño</li>
									</ul>
								</div>

								<div className='rounded-lg bg-orange-50 p-4'>
									<h4 className='mb-2 font-medium text-orange-800'>
										Próximas Mejoras
									</h4>
									<ul className='space-y-1 text-sm text-orange-700'>
										<li>• Portal de proveedores</li>
										<li>• Cotizaciones automáticas</li>
										<li>• Integración EDI</li>
										<li>• Análisis predictivo</li>
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
												Proveedor
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												RUC/NIT
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Contacto
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Teléfono
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Evaluación
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
														No hay proveedores registrados
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

export default Proveedores;
