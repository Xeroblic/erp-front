import React from 'react';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/format.utils';
import { WooSyncJob } from '../../types/wooSync.types';
import { JobStatusBadge } from '../UI/StatusBadges';

type Props = {
  rows: WooSyncJob[];
  onViewLog: (job: WooSyncJob) => void;
};

const SyncHistoryTable: React.FC<Props> = ({ rows, onViewLog }) => {
  return (
    <div className='overflow-x-auto'>
      <Table>
        <THead>
          <Tr>
            <Th>ID</Th>
            <Th>Tipo</Th>
            <Th>Estado</Th>
            <Th>Fecha</Th>
            <Th>Procesados</Th>
            <Th>Actualizados</Th>
            <Th>Errores</Th>
            <Th>Acciones</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((job) => (
            <Tr key={job.id}>
              <Td className='font-mono'>{job.id}</Td>
              <Td>
                <Badge variant='outline' color={job.type === 'pull' ? 'blue' : 'emerald'}>
                  {job.type === 'pull' ? '📥 Pull' : '📤 Push'}
                </Badge>
              </Td>
              <Td>
                <JobStatusBadge status={job.status} />
              </Td>
              <Td>{formatDate(job.started_at)}</Td>
              <Td>{job.products_processed ?? 0}</Td>
              <Td>{job.products_updated ?? 0}</Td>
              <Td className={job.products_failed ? 'font-semibold text-red-600' : ''}>
                {job.products_failed ?? 0}
              </Td>
              <Td>
                <Button
                  size='sm'
                  variant='outline'
                  icon='HeroEye'
                  onClick={() => onViewLog(job)}>
                  Ver Log
                </Button>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
};

export default SyncHistoryTable;
