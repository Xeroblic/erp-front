import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';

interface CheckInSuccessStepsProps {
	lockerNumber: string;
	pin: string;
}

const CheckInSuccessSteps: React.FC<CheckInSuccessStepsProps> = ({ lockerNumber, pin }) => {
	const steps = [
		{
			id: 1,
			title: 'Ubica tu Casillero',
			description: (
				<>
					Dirígete al <span className='font-bold text-emerald-700'>Casillero Nº {lockerNumber}</span>. 
					Es el que acabas de escanear y está reservado para ti.
				</>
			),
			icon: 'HeroMapPin',
			color: 'blue',
		},
		{
			id: 2,
			title: 'Digita tu PIN de Acceso',
			description: (
				<>
					Ingresa el código <span className='font-mono font-bold text-xl tracking-wider text-emerald-600'>{pin}</span> en el teclado del mueble. 
					<span className='block mt-1 text-xs text-amber-600 font-medium'>* No compartas este PIN con nadie.</span>
				</>
			),
			icon: 'HeroKey',
			color: 'emerald',
		},
		{
			id: 3,
			title: 'Deposita y Asegura',
			description: 'Coloca tu equipo dentro del casillero y cierra la puerta firmemente hasta escuchar el clic de bloqueo.',
			icon: 'HeroArchiveBoxArrowDown',
			color: 'indigo',
		},
		{
			id: 4,
			title: '¡Todo listo!',
			description: 'Recibirás una notificación automática en tu correo una vez que nuestro servicio técnico retire y procese tu equipo.',
			icon: 'HeroBellAlert',
			color: 'rose',
		},
	];

	return (
		<Card className='overflow-hidden border-none bg-white/40 shadow-xl backdrop-blur-md'>
			<CardBody className='p-0'>
				<div className='flex flex-col lg:flex-row'>
					{/* Columna Izquierda: Instrucciones */}
					<div className='flex-1 p-8 lg:p-10'>
						<div className='mb-8'>
							<div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700'>
								<Icon icon='HeroCheckCircle' className='h-4 w-4' />
								Registro Completado
							</div>
							<h2 className='mt-4 text-4xl font-extrabold text-zinc-900'>
								¿Qué hacer ahora?
							</h2>
							<p className='mt-2 text-zinc-600'>
								Sigue estos pasos para finalizar el ingreso de tu equipo de forma segura.
							</p>
						</div>

						<div className='space-y-8'>
							{steps.map((step) => (
								<div key={step.id} className='flex gap-5'>
									<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-${step.color}-100 text-${step.color}-600 shadow-sm`}>
										<Icon icon={step.icon} className='h-6 w-6' />
									</div>
									<div className='space-y-1'>
										<h3 className='text-lg font-bold text-zinc-800'>
											{step.id}. {step.title}
										</h3>
										<p className='text-sm leading-relaxed text-zinc-600'>
											{step.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Columna Derecha: Área Visual (Espacio para SVGs) */}
					<div className='relative hidden w-full shrink-0 items-center justify-center bg-gradient-to-br from-zinc-900/5 to-zinc-900/10 p-12 lg:flex lg:w-[400px]'>
						<div className='relative flex h-full w-full flex-col items-center justify-center gap-8 text-center'>
							{/* Placeholder para el SVG visual */}
							<div className='flex h-64 w-64 items-center justify-center rounded-full bg-white/50 shadow-inner  outline-2 outline-dashed outline-zinc-300'>
								<div className='flex flex-col items-center gap-2 text-zinc-400'>
									<Icon icon='HeroPhoto' className='h-12 w-12' />
									<span className='text-xs font-medium'>[Espacio para Ilustración SVG]</span>
								</div>
							</div>
							
							<div className='space-y-2 px-6'>
								<h4 className='font-bold text-zinc-700'>Tu equipo está protegido</h4>
								<p className='text-xs text-zinc-500'>
									Nuestro sistema de casilleros inteligentes garantiza la seguridad de tu dispositivo las 24 horas.
								</p>
							</div>

							{/* Decoración abstracta */}
							<div className='absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl' />
							<div className='absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl' />
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default CheckInSuccessSteps;
