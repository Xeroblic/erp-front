import Card, { CardBody, CardTitle, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/format.utils';
import { WooSyncJob } from '../../types/wooSync.types';
import { JobStatusBadge } from './StatusBadges';

export default function LastSyncCard({ lastSync, onViewLog }:{
  lastSync: WooSyncJob;
  onViewLog: () => void;
}) {
  return (
    <Card className='mb-6'>
      <CardBody>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-medium'>
              Última Sincronización: {lastSync.type === 'pull' ? 'Importación' : 'Actualización'}
            </h3>
            <p className='text-sm text-gray-600'>
              {formatDate(lastSync.started_at)} - {lastSync.products_updated} productos procesados
            </p>
            {!!(lastSync.errors?.length) && (
              <p className='text-sm text-red-600'>{lastSync.errors.length} errores encontrados</p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <JobStatusBadge status={lastSync.status} />
            <Button size='sm' variant='outline' icon='HeroEye' onClick={onViewLog}>
              Ver Log
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
