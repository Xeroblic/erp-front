import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import { formatCurrency } from './formatCurrency';

export const StatsCards = ({ stats }: { stats: any }) => (
	<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
		<Card>
			<CardBody>
				<div className='flex items-center'>
					<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400/20'>
						<Icon icon='HeroDocumentText' className='h-6 w-6 text-blue-600' />
					</div>
					<div>
						<p className='text-sm font-medium'>Total</p>
						<p className='text-2xl font-bold'>{stats.total}</p>
					</div>
				</div>
			</CardBody>
		</Card>
		{/* ... (El resto de las cards iguales, solo asegúrate de pasar props) ... */}
		{/* AHORRE ESPACIO AQUÍ PERO DEBES PONER LAS OTRAS 4 CARDS IGUAL QUE ANTES */}
		<Card>
			<CardBody>
				<div className='flex items-center'>
					<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-400/20'>
						<Icon icon='HeroPencilSquare' className='h-6 w-6' />
					</div>
					<div>
						<p className='text-sm font-medium'>Borradores</p>
						<p className='text-2xl font-bold'>{stats.byStatus.draft || 0}</p>
					</div>
				</div>
			</CardBody>
		</Card>
		<Card>
			<CardBody>
				<div className='flex items-center'>
					<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-400/20'>
						<Icon icon='HeroPaperAirplane' className='h-6 w-6 text-amber-600' />
					</div>
					<div>
						<p className='text-sm font-medium'>Enviadas</p>
						<p className='text-2xl font-bold'>{stats.byStatus.sent || 0}</p>
					</div>
				</div>
			</CardBody>
		</Card>
		<Card>
			<CardBody>
				<div className='flex items-center'>
					<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-400/20'>
						<Icon icon='HeroCheckCircle' className='h-6 w-6 text-green-600' />
					</div>
					<div>
						<p className='text-sm font-medium'>Aprobadas</p>
						<p className='text-2xl font-bold'>{stats.byStatus.approved || 0}</p>
					</div>
				</div>
			</CardBody>
		</Card>
		{/* <Card>
            <CardBody>
                <div className='flex items-center'>
                    <div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100'>
                        <Icon icon='HeroCurrencyDollar' className='h-6 w-6 text-emerald-600' />
                    </div>
                    <div>
                        <p className='text-sm font-medium '>Valor Total</p>
                        <p className='text-lg font-bold '>{formatCurrency(stats.totalAmount)}</p>
                    </div>
                </div>
            </CardBody>
        </Card> */}
	</div>
);
