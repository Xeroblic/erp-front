import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import { InvitationStats } from '@/interface/invitacion.interface';

const EstadisticasInvitations = ({ currentStats }: { currentStats: InvitationStats }) => {
	return (
		<>
			<Card className='border-gray-200 transition-shadow hover:shadow-md dark:border-gray-700'>
				<CardBody className='p-6'>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30'>
							<Icon
								icon='HeroClipboardDocumentList'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
								Total
							</p>
							<p className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
								{currentStats.total}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card className='border-amber-200 bg-amber-50 transition-shadow hover:shadow-md dark:border-amber-800 dark:bg-amber-900/10'>
				<CardBody className='p-6'>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30'>
							<Icon
								icon='HeroClock'
								className='h-6 w-6 text-amber-600 dark:text-amber-400'
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-amber-700 dark:text-amber-400'>
								Pendientes
							</p>
							<p className='text-2xl font-bold text-amber-900 dark:text-amber-100'>
								{currentStats.pending}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card className='border-blue-200 bg-blue-50 transition-shadow hover:shadow-md dark:border-blue-800 dark:bg-blue-900/10'>
				<CardBody className='p-6'>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30'>
							<Icon
								icon='HeroPaperAirplane'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-blue-700 dark:text-blue-400'>
								Enviadas
							</p>
							<p className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
								{currentStats.sent}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card className='border-emerald-200 bg-emerald-50 transition-shadow hover:shadow-md dark:border-emerald-800 dark:bg-emerald-900/10'>
				<CardBody className='p-6'>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30'>
							<Icon
								icon='HeroCheckCircle'
								className='h-6 w-6 text-emerald-600 dark:text-emerald-400'
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
								Aceptadas
							</p>
							<p className='text-2xl font-bold text-emerald-900 dark:text-emerald-100'>
								{currentStats.accepted}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card className='border-red-200 bg-red-50 transition-shadow hover:shadow-md dark:border-red-800 dark:bg-red-900/10'>
				<CardBody className='p-6'>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30'>
							<Icon
								icon='HeroXCircle'
								className='h-6 w-6 text-red-600 dark:text-red-400'
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-red-700 dark:text-red-400'>
								Expiradas
							</p>
							<p className='text-2xl font-bold text-red-900 dark:text-red-100'>
								{currentStats.expired}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>
		</>
	);
};

export default EstadisticasInvitations;
