import React from 'react';
// eslint-disable-next-line import/extensions
import Icon from '@/components/icon/Icon';
// eslint-disable-next-line import/extensions
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';

interface ReminderMilestone {
	label: string;
	detail: string;
	accentClass: string;
	icon: 'HeroClock' | 'HeroExclamationTriangle' | 'HeroArrowPath';
}

interface ReminderFlow {
	id: 'internal' | 'customer';
	title: string;
	description: string;
	icon: 'HeroUsers' | 'HeroUser';
	accentClass: string;
	milestones: readonly ReminderMilestone[];
}

const reminderFlows: readonly ReminderFlow[] = [
	{
		id: 'internal',
		title: 'Equipo de cobranza y encargados',
		description: 'Avisos internos para anticipar y gestionar el cobro.',
		icon: 'HeroUsers',
		accentClass: 'border-blue-200 bg-blue-50/70 dark:border-blue-900/70 dark:bg-blue-950/20',
		milestones: [
			{
				label: '7 días antes',
				detail: 'Primer recordatorio previo.',
				accentClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
				icon: 'HeroClock',
			},
			{
				label: '2 días antes',
				detail: 'Segundo recordatorio previo.',
				accentClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
				icon: 'HeroClock',
			},
			{
				label: '1 día vencido',
				detail: 'Primer aviso de mora.',
				accentClass: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
				icon: 'HeroExclamationTriangle',
			},
			{
				label: 'Cada 5 días',
				detail: 'Se repite mientras exista saldo pendiente.',
				accentClass: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
				icon: 'HeroArrowPath',
			},
		],
	},
	{
		id: 'customer',
		title: 'Cliente deudor',
		description: 'No recibe avisos anticipados antes del vencimiento.',
		icon: 'HeroUser',
		accentClass:
			'border-violet-200 bg-violet-50/70 dark:border-violet-900/70 dark:bg-violet-950/20',
		milestones: [
			{
				label: 'Día del vencimiento',
				detail: 'Primer aviso al cliente.',
				accentClass:
					'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
				icon: 'HeroExclamationTriangle',
			},
			{
				label: 'Cada 10 días',
				detail: 'Se repite mientras exista saldo pendiente.',
				accentClass: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
				icon: 'HeroArrowPath',
			},
		],
	},
];

interface ReminderCadenceCardProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ReminderCadenceCard: React.FC<ReminderCadenceCardProps> = ({ isOpen, setIsOpen }) => (
	<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg' isScrollable>
		<ModalHeader>
			<div className='flex items-center gap-3'>
				<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm'>
					<Icon icon='HeroBellAlert' size='text-xl' color='white' />
				</div>
				<div>
					<h2>Recordatorios automáticos</h2>
					<p className='mt-1 text-sm font-normal text-zinc-600 dark:text-zinc-300'>
						Cadencia informativa de los avisos para documentos con saldo pendiente.
					</p>
				</div>
			</div>
		</ModalHeader>
		<ModalBody>
			<div className='grid gap-4 lg:grid-cols-2'>
				{reminderFlows.map((flow) => (
					<article
						key={flow.id}
						aria-labelledby={`${flow.id}-reminders-title`}
						className={`rounded-xl border p-4 ${flow.accentClass}`}>
						<div className='flex items-start gap-3'>
							<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-zinc-700 shadow-sm dark:bg-zinc-900/70 dark:text-zinc-200'>
								<Icon icon={flow.icon} size='text-lg' color='current' />
							</div>
							<div>
								<h3
									id={`${flow.id}-reminders-title`}
									className='font-semibold text-zinc-900 dark:text-white'>
									{flow.title}
								</h3>
								<p className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
									{flow.description}
								</p>
							</div>
						</div>
						<ul className='mt-4 space-y-3' aria-label={`Cadencia para ${flow.title}`}>
							{flow.milestones.map((milestone) => (
								<li key={milestone.label} className='flex items-start gap-3'>
									<div
										className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${milestone.accentClass}`}>
										<Icon
											icon={milestone.icon}
											size='text-base'
											color='current'
										/>
									</div>
									<div className='min-w-0'>
										<p className='font-medium text-zinc-900 dark:text-white'>
											{milestone.label}
										</p>
										<p className='text-sm text-zinc-600 dark:text-zinc-300'>
											{milestone.detail}
										</p>
									</div>
								</li>
							))}
						</ul>
					</article>
				))}
			</div>
			<p className='mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200'>
				Los recordatorios se evalúan diariamente a las 08:30, hora de Santiago, y se
				detienen cuando el documento queda pagado.
			</p>
		</ModalBody>
	</Modal>
);

export default ReminderCadenceCard;
