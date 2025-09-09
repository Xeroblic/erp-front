import React from 'react';

const Bodegas = () => {
	return (
		<div className='p-6'>
			<div className='mx-auto max-w-7xl'>
				<div className='rounded-lg bg-white shadow-md'>
					<div className='border-b border-gray-200 px-6 py-4'>
						<div className='flex items-center justify-between'>
							<h1 className='text-3xl font-semibold text-gray-900'>
								Gestión de Bodegas
							</h1>
							<div className='flex gap-2'>
								<button className='rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'>
									Nueva Bodega
								</button>
								<button className='rounded-md bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700'>
									Nueva Ubicación
								</button>
							</div>
						</div>
					</div>
					<div className='p-6'>
						<div className='py-12 text-center'>
							<div className='mb-4 text-lg text-gray-500'>
								🏢 Gestión de Bodegas y Ubicaciones
							</div>
							<p className='mb-8 text-gray-600'>
								Administra tu red de bodegas, ubicaciones de almacenamiento y
								códigos QR.
								<br />
								Controla la capacidad, organización y seguimiento de tus espacios de
								almacén.
							</p>
							<div className='mb-8 grid grid-cols-1 gap-8 md:grid-cols-2'>
								{/* Bodegas */}
								<div className='rounded-lg border border-blue-200 bg-blue-50 p-6'>
									<h3 className='mb-4 text-xl font-bold text-blue-900'>
										🏢 Bodegas
									</h3>
									<div className='space-y-3'>
										<div className='rounded border bg-white p-4'>
											<h4 className='mb-2 font-semibold text-gray-900'>
												Tipos de Bodega
											</h4>
											<div className='space-y-1 text-sm text-gray-600'>
												<div>
													•{' '}
													<span className='font-medium'>Principal:</span>{' '}
													Bodega central
												</div>
												<div>
													• <span className='font-medium'>Sucursal:</span>{' '}
													Almacén de sucursal
												</div>
												<div>
													• <span className='font-medium'>Externa:</span>{' '}
													Bodega de terceros
												</div>
												<div>
													• <span className='font-medium'>Virtual:</span>{' '}
													Para productos digitales
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Ubicaciones */}
								<div className='rounded-lg border border-emerald-200 bg-emerald-50 p-6'>
									<h3 className='mb-4 text-xl font-bold text-emerald-900'>
										📍 Ubicaciones
									</h3>
									<div className='space-y-3'>
										<div className='rounded border bg-white p-4'>
											<h4 className='mb-2 font-semibold text-gray-900'>
												Tipos de Ubicación
											</h4>
											<div className='space-y-1 text-sm text-gray-600'>
												<div>
													•{' '}
													<span className='font-medium'>
														Almacenamiento:
													</span>{' '}
													Stock general
												</div>
												<div>
													• <span className='font-medium'>Picking:</span>{' '}
													Para preparación
												</div>
												<div>
													•{' '}
													<span className='font-medium'>Recepción:</span>{' '}
													Productos entrantes
												</div>
												<div>
													• <span className='font-medium'>Despacho:</span>{' '}
													Productos salientes
												</div>
												<div>
													•{' '}
													<span className='font-medium'>Cuarentena:</span>{' '}
													Control de calidad
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Características adicionales */}
							<div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
								<div className='rounded-lg bg-gray-50 p-6'>
									<h4 className='mb-2 font-semibold text-gray-900'>
										🏗️ Estructura Jerárquica
									</h4>
									<p className='text-sm text-gray-600'>
										Organiza ubicaciones con: Pasillo → Rack → Estante → Bin
									</p>
								</div>
								<div className='rounded-lg bg-gray-50 p-6'>
									<h4 className='mb-2 font-semibold text-gray-900'>
										📱 Códigos QR
									</h4>
									<p className='text-sm text-gray-600'>
										Genera QR automático para cada ubicación para rápida
										identificación
									</p>
								</div>
								<div className='rounded-lg bg-gray-50 p-6'>
									<h4 className='mb-2 font-semibold text-gray-900'>
										📊 Control de Capacidad
									</h4>
									<p className='text-sm text-gray-600'>
										Monitorea utilización actual vs. capacidad máxima
									</p>
								</div>
							</div>

							<div className='mt-8'>
								<p className='text-sm text-blue-600'>
									💡 <strong>Integración con Backend:</strong> Conectado
									automáticamente con:
									<br />
									<code className='rounded bg-gray-100 px-2 py-1'>
										GET/POST /api/warehouses
									</code>{' '}
									|
									<code className='rounded bg-gray-100 px-2 py-1'>
										GET/POST /api/warehouse-locations
									</code>{' '}
									|
									<code className='rounded bg-gray-100 px-2 py-1'>
										GET /api/qr-codes/:type/:id
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

export default Bodegas;
