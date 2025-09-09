import React from 'react';

const Clientes: React.FC = () => {
	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='mx-auto max-w-7xl'>
				{/* Header */}
				<div className='mb-8'>
					<h1 className='mb-2 text-3xl font-bold text-gray-900'>Gestión de Clientes</h1>
					<p className='text-gray-600'>
						Administra tu cartera de clientes para optimizar las ventas y el servicio al
						cliente
					</p>
				</div>

				{/* Stats Cards */}
				<div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-4'>
					<div className='rounded-lg border-l-4 border-cyan-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Total Clientes</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-green-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Clientes Activos</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-orange-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Clientes VIP</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
					<div className='rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow'>
						<h3 className='text-sm font-medium text-gray-500'>Ventas Este Mes</h3>
						<p className='text-2xl font-bold text-gray-900'>--</p>
					</div>
				</div>

				{/* Main Content */}
				<div className='rounded-lg bg-white shadow-md'>
					<div className='border-b border-gray-200 p-6'>
						<div className='flex items-center justify-between'>
							<h2 className='text-xl font-semibold text-gray-900'>
								Lista de Clientes
							</h2>
							<button className='rounded-lg bg-cyan-600 px-4 py-2 text-white transition-colors hover:bg-cyan-700'>
								+ Nuevo Cliente
							</button>
						</div>
					</div>

					<div className='p-6'>
						<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
							{/* Clientes Info */}
							<div className='space-y-4'>
								<h3 className='mb-4 text-lg font-semibold text-gray-800'>
									Información del Cliente
								</h3>

								<div className='rounded-lg bg-gray-50 p-4'>
									<h4 className='mb-2 font-medium text-gray-700'>
										Datos Personales/Empresariales
									</h4>
									<ul className='space-y-2 text-sm text-gray-600'>
										<li>
											• <strong>Nombre/Razón Social:</strong> Identificación
											del cliente
										</li>
										<li>
											• <strong>Documento:</strong> Cédula, RUC, Pasaporte
										</li>
										<li>
											• <strong>Email y Teléfono:</strong> Contacto principal
										</li>
										<li>
											• <strong>Dirección:</strong> Ubicación y entrega
										</li>
										<li>
											• <strong>Fecha de Registro:</strong> Antigüedad
										</li>
										<li>
											• <strong>Tipo de Cliente:</strong> Particular o Empresa
										</li>
									</ul>
								</div>

								<div className='rounded-lg bg-cyan-50 p-4'>
									<h4 className='mb-2 font-medium text-cyan-800'>
										Información Comercial
									</h4>
									<ul className='space-y-2 text-sm text-cyan-700'>
										<li>✓ Límite de crédito autorizado</li>
										<li>✓ Condiciones de pago</li>
										<li>✓ Descuentos y promociones aplicables</li>
										<li>✓ Historial de compras</li>
										<li>✓ Preferencias de productos</li>
										<li>✓ Estado de cuenta</li>
									</ul>
								</div>

								<div className='rounded-lg bg-green-50 p-4'>
									<h4 className='mb-2 font-medium text-green-800'>
										Clasificación de Clientes
									</h4>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div className='rounded border border-green-200 bg-white p-2'>
											<div className='font-medium text-green-800'>VIP</div>
											<div className='text-xs text-gray-600'>
												Alto volumen
											</div>
										</div>
										<div className='rounded border border-green-200 bg-white p-2'>
											<div className='font-medium text-green-800'>
												Regulares
											</div>
											<div className='text-xs text-gray-600'>
												Compras frecuentes
											</div>
										</div>
										<div className='rounded border border-green-200 bg-white p-2'>
											<div className='font-medium text-green-800'>Nuevos</div>
											<div className='text-xs text-gray-600'>
												Recién registrados
											</div>
										</div>
										<div className='rounded border border-green-200 bg-white p-2'>
											<div className='font-medium text-green-800'>
												Inactivos
											</div>
											<div className='text-xs text-gray-600'>
												Sin compras recientes
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
										API de Clientes
									</h4>
									<div className='space-y-2 text-sm'>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-green-100 px-2 py-1 font-mono text-xs text-green-800'>
												GET
											</span>
											<code className='text-green-700'>/api/customers</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-blue-100 px-2 py-1 font-mono text-xs text-blue-800'>
												POST
											</span>
											<code className='text-blue-700'>/api/customers</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-yellow-100 px-2 py-1 font-mono text-xs text-yellow-800'>
												PUT
											</span>
											<code className='text-yellow-700'>
												/api/customers/:id
											</code>
										</div>
										<div className='flex items-center space-x-2'>
											<span className='rounded bg-red-100 px-2 py-1 font-mono text-xs text-red-800'>
												DELETE
											</span>
											<code className='text-red-700'>/api/customers/:id</code>
										</div>
									</div>
								</div>

								<div className='rounded-lg bg-purple-50 p-4'>
									<h4 className='mb-2 font-medium text-purple-800'>
										APIs Relacionadas
									</h4>
									<div className='space-y-2 text-sm text-purple-700'>
										<div>
											🛒 <code>/api/sales-orders</code> - Órdenes de venta
										</div>
										<div>
											💳 <code>/api/customer-payments</code> - Pagos
										</div>
										<div>
											📊 <code>/api/customer-analytics</code> - Análisis
										</div>
										<div>
											🎯 <code>/api/customer-segments</code> - Segmentación
										</div>
										<div>
											📧 <code>/api/customer-communications</code> -
											Comunicación
										</div>
									</div>
								</div>

								<div className='rounded-lg bg-blue-50 p-4'>
									<h4 className='mb-2 font-medium text-blue-800'>
										Funciones CRM
									</h4>
									<ul className='space-y-1 text-sm text-blue-700'>
										<li>• Seguimiento de interacciones</li>
										<li>• Historial de compras detallado</li>
										<li>• Programación de seguimientos</li>
										<li>• Gestión de oportunidades</li>
										<li>• Campañas de marketing dirigidas</li>
										<li>• Análisis de comportamiento</li>
									</ul>
								</div>

								<div className='rounded-lg bg-orange-50 p-4'>
									<h4 className='mb-2 font-medium text-orange-800'>
										Próximas Mejoras
									</h4>
									<ul className='space-y-1 text-sm text-orange-700'>
										<li>• Portal del cliente</li>
										<li>• Sistema de puntos/fidelización</li>
										<li>• Chat en tiempo real</li>
										<li>• Recomendaciones personalizadas</li>
										<li>• Integración con redes sociales</li>
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
												Cliente
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Documento
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Email
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Teléfono
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Tipo
											</th>
											<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
												Última Compra
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
												colSpan={8}
												className='px-6 py-12 text-center text-gray-500'>
												<div className='space-y-2'>
													<p className='text-lg'>
														No hay clientes registrados
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

export default Clientes;
