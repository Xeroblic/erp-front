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

const typeLabel = {
	pull: 'Importación (pull)',
	push: 'Actualización (push)',
};

export default function SyncLogModal({ isOpen, onClose, job }: Props) {
	return (
		<Modal isOpen={isOpen} setIsOpen={(value) => (!value ? onClose() : undefined)} size='3xl'>
			<ModalHeader>
				<h3 className='text-lg font-semibold'>
					{job ? `Log de sincronización - Job #${job.id}` : 'Log de sincronización'}
				</h3>
			</ModalHeader>
			<ModalBody>
				{job && (
					<div className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<p className='text-sm font-medium text-gray-700'>Tipo</p>
								<p className='mt-1 text-gray-800'>{typeLabel[job.type]}</p>
							</div>
							<div>
								<p className='text-sm font-medium text-gray-700'>Estado</p>
								<div className='mt-1'>
									<JobStatusBadge status={job.status} />
								</div>
							</div>
							<div>
								<p className='text-sm font-medium text-gray-700'>Iniciado</p>
								<p className='mt-1 text-gray-800'>{formatDate(job.started_at)}</p>
							</div>
							<div>
								<p className='text-sm font-medium text-gray-700'>Completado</p>
								<p className='mt-1 text-gray-800'>
									{job.completed_at ? formatDate(job.completed_at) : 'En progreso'}
								</p>
							</div>
						</div>

						<div className='grid grid-cols-3 gap-4'>
							<div className='rounded-lg bg-blue-50 p-3 text-center'>
								<p className='text-2xl font-bold text-blue-600'>{job.products_processed ?? 0}</p>
								<p className='text-sm text-blue-800'>Procesados</p>
							</div>
							<div className='rounded-lg bg-emerald-50 p-3 text-center'>
								<p className='text-2xl font-bold text-emerald-600'>{job.products_updated ?? 0}</p>
								<p className='text-sm text-emerald-800'>Actualizados</p>
							</div>
							<div className='rounded-lg bg-red-50 p-3 text-center'>
								<p className='text-2xl font-bold text-red-600'>{job.products_failed ?? 0}</p>
								<p className='text-sm text-red-800'>Con errores</p>
							</div>
						</div>

						{!!job.errors?.length && (
							<div>
								<p className='mb-2 text-sm font-medium text-gray-700'>Detalle de errores</p>
								<div className='space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-800'>
									{job.errors.map((error, index) => (
										<p key={index}>- {error}</p>
									))}
								</div>
							</div>
						)}

						{!!job.log?.length && (
							<div>
								<p className='mb-2 text-sm font-medium text-gray-700'>Log detallado</p>
								<div className='max-h-60 overflow-y-auto rounded-lg bg-gray-50 p-3 font-mono text-sm text-gray-800'>
									{job.log.map((entry, index) => (
										<p key={index}>{entry}</p>
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
}
