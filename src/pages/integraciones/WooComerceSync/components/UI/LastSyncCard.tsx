import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/format.utils';
import { WooSyncJob } from '../../types/wooSync.types';
import { JobStatusBadge } from './StatusBadges';

type Props = {
	lastSync: WooSyncJob;
	onViewLog: () => void;
};

export default function LastSyncCard({ lastSync, onViewLog }: Props) {
	return (
		<Card className='mb-6'>
			<CardBody>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='font-medium'>
							Última sincronización: {lastSync.type === 'pull' ? 'Importación' : 'Actualización'}
						</h3>
						<p className='text-sm text-gray-600'>
							{formatDate(lastSync.started_at)} - {lastSync.products_updated ?? 0} productos procesados
						</p>
						{!!lastSync.errors?.length && (
							<p className='text-sm text-red-600'>
								{lastSync.errors.length} errores encontrados
							</p>
						)}
					</div>
					<div className='flex items-center space-x-2'>
						<JobStatusBadge status={lastSync.status} />
						<Button size='sm' variant='outline' icon='HeroEye' onClick={onViewLog}>
							Ver log
						</Button>
					</div>
				</div>
			</CardBody>
		</Card>
	);
}
