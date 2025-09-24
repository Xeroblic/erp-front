import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/format.utils';
import { WooSyncJob } from '../../types/wooSync.types';
import { JobStatusBadge } from '../UI/StatusBadges';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  job: WooSyncJob | null;
};

const SyncLogModal: React.FC<Props> = ({ isOpen, onClose, job }) => {
  return (
    <Modal isOpen={isOpen} setIsOpen={(v) => (!v ? onClose() : undefined)} size='3xl'>
      <ModalHeader>
        <h3 className='text-lg font-semibold'>
          {job ? `Log de Sincronización - Job #${job.id}` : 'Log de Sincronización'}
        </h3>
      </ModalHeader>
      <ModalBody>
        {job && (
          <div className='space-y-4'>
            {/* Información del job */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Tipo</label>
                <p className='mt-1'>{job.type === 'pull' ? 'Importación (Pull)' : 'Actualización (Push)'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Estado</label>
                <div className='mt-1'>
                  <JobStatusBadge status={job.status} />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Iniciado</label>
                <p className='mt-1'>{formatDate(job.started_at)}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Completado</label>
                <p className='mt-1'>
                  {job.completed_at ? formatDate(job.completed_at) : 'En progreso...'}
                </p>
              </div>
            </div>

            {/* Estadísticas */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='rounded-lg bg-blue-50 p-3 text-center'>
                <div className='text-2xl font-bold text-blue-600'>{job.products_processed ?? 0}</div>
                <div className='text-sm text-blue-800'>Procesados</div>
              </div>
              <div className='rounded-lg bg-green-50 p-3 text-center'>
                <div className='text-2xl font-bold text-green-600'>{job.products_updated ?? 0}</div>
                <div className='text-sm text-green-800'>Actualizados</div>
              </div>
              <div className='rounded-lg bg-red-50 p-3 text-center'>
                <div className='text-2xl font-bold text-red-600'>{job.products_failed ?? 0}</div>
                <div className='text-sm text-red-800'>Con Errores</div>
              </div>
            </div>

            {/* Errores */}
            {!!job.errors?.length && (
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>Errores</label>
                <div className='rounded-lg bg-red-50 p-3'>
                  {job.errors.map((err, i) => (
                    <p key={i} className='text-sm text-red-800'>
                      • {err}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Log detallado */}
            {!!job.log?.length && (
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>Log Detallado</label>
                <div className='max-h-60 overflow-y-auto rounded-lg bg-gray-50 p-3 font-mono text-sm'>
                  {job.log.map((entry, i) => (
                    <p key={i} className='text-gray-800'>
                      {entry}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant='outline' onClick={onClose}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SyncLogModal;
