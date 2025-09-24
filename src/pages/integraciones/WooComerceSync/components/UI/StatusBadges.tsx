import Badge from '@/components/ui/Badge';
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineXCircle } from 'react-icons/hi2';
import { TSyncStatus, TWooJobStatus } from '../../types/wooSync.types';

export const SyncStatusBadge = ({ status }: { status: TSyncStatus }) => {
  const map = {
    synced: { color: 'emerald' as const, text: 'Sincronizado', Icon: HiOutlineCheckCircle },
    out_of_sync: { color: 'amber' as const, text: 'Desincronizado', Icon: HiOutlineExclamationTriangle },
    error: { color: 'red' as const, text: 'Error', Icon: HiOutlineXCircle },
  }[status];
  return (
    <Badge color={map.color} variant='outline'>
      <map.Icon className='mr-1 inline h-4 w-4' /> {map.text}
    </Badge>
  );
};

export const JobStatusBadge = ({ status }: { status: TWooJobStatus }) => {
  const map = {
    pending: { color: 'gray' as const, text: 'Pendiente' },
    running: { color: 'blue' as const, text: 'Ejecutando' },
    completed: { color: 'emerald' as const, text: 'Completado' },
    failed: { color: 'red' as const, text: 'Fallido' },
  }[status];
  return <Badge color={map.color}>{map.text}</Badge>;
};
