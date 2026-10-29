import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Tabs, { Tab } from '@/components/ui/Tabs';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import IngresoPedido from './components/IngresoPedido';
import PedidosTable, { PedidoMock } from './components/PedidosTable';
import Icon from '@/components/icon/Icon';
import useForceLightMode from '@/hooks/useForceLightMode';

// Mock data para las tablas
const pendientesMock: PedidoMock[] = [
	{
		id: '1001',
		rut: '11.222.333-4',
		cliente: 'Juan Pérez',
		canal: 'WhatsApp',
		fecha: '2023-10-25',
		cotizacion: true,
		estado: 'Pendiente',
	},
	{
		id: '1002',
		rut: '15.444.555-6',
		cliente: 'María González',
		canal: 'Correo',
		fecha: '2023-10-25',
		cotizacion: false,
		link: 'https://docs.google.com/document/d/...',
		estado: 'Procesando',
	},
	{
		id: '1004',
		rut: '76.123.456-7',
		cliente: 'Empresa ABC SpA',
		canal: 'Correo',
		fecha: '2023-10-24',
		cotizacion: true,
		link: 'https://erp.com/cotizacion/1004',
		estado: 'Pendiente',
	},
];

const completadosMock: PedidoMock[] = [
	{
		id: '0999',
		rut: '9.888.777-6',
		cliente: 'Carlos Silva',
		canal: 'Presencial',
		fecha: '2023-10-23',
		cotizacion: true,
		estado: 'Completado',
	},
	{
		id: '0998',
		rut: '77.888.999-0',
		cliente: 'Distribuidora XYZ',
		canal: 'WhatsApp',
		fecha: '2023-10-22',
		cotizacion: false,
		link: 'https://wa.me/...',
		estado: 'Completado',
	},
];

export default function PortalPedidosPage() {
	const [activeTab, setActiveTab] = useState<string>('nuevo');
	const { hash, id } = useParams<{ hash?: string; id?: string }>();
	const identifier = hash || id || '';

	useForceLightMode();
	return (
		<PageWrapper isProtectedRoute={false} name='Portal Pedidos'>
			<div className='min-h-screen w-full bg-zinc-50 dark:bg-zinc-950'>
				{/* Navbar Minimalista del Portal */}
				<header className='sticky top-0 z-10 w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'>
					<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
						<div className='flex h-16 items-center justify-between'>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30'>
									<Icon icon='HeroCubeTransparent' className='h-6 w-6' />
								</div>
								<h1 className='text-xl font-bold text-zinc-900 dark:text-white'>
									Portal Pedidos{' '}
									<span className='font-normal text-zinc-400'>
										| Zentria {identifier ? `(Agente: ${identifier})` : ''}
									</span>
								</h1>
							</div>
							<div className='flex items-center gap-4'>
								<div className='hidden text-sm text-zinc-500 dark:text-zinc-400 sm:block'>
									Atención al Cliente
								</div>
							</div>
						</div>
					</div>
				</header>

				{/* Main Content Area */}
				<main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8'>
					<div className='mb-8'>
						<h2 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100'>
							Gestión de Pedidos
						</h2>
						<p className='mt-2 text-lg text-zinc-600 dark:text-zinc-400'>
							Ingresa nuevas solicitudes o revisa el estado de los pedidos actuales
							fácilmente.
						</p>
					</div>

					{/* Tabs Container */}
					<div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-4'>
						<Tabs activeTab={activeTab} onTabChange={setActiveTab} className='w-full'>
							<Tab id='nuevo' text='Nuevo Pedido' icon='HeroPlusCircle'>
								<div className='pt-6'>
									<IngresoPedido />
								</div>
							</Tab>

							<Tab
								id='pendientes'
								text='Por Hacer'
								icon='HeroClock'
								badge={pendientesMock.length}>
								<div className='pt-6'>
									<PedidosTable
										data={pendientesMock}
										title='Pedidos Pendientes'
									/>
								</div>
							</Tab>

							<Tab id='completados' text='Ya Hechas' icon='HeroCheckCircle'>
								<div className='pt-6'>
									<PedidosTable
										data={completadosMock}
										title='Pedidos Completados'
									/>
								</div>
							</Tab>
						</Tabs>
					</div>
				</main>
			</div>
		</PageWrapper>
	);
}
