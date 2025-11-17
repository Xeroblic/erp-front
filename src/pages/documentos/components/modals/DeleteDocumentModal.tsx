import React, { Dispatch, SetStateAction } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { IDocument } from '../../types/documentos.types';
import { getModuleLabel } from '../utils';

type DeleteDocumentModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  document: IDocument | null;
  onConfirm: () => void;
  loading?: boolean;
};

const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({ isOpen, setIsOpen, document, onConfirm, loading = false }) => (
  <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
    <ModalHeader>
      <div className='flex items-center space-x-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
          <Icon icon='HeroTrash' className='h-6 w-6 text-red-600' />
        </div>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Eliminar documento</h2>
          <p className='text-sm text-gray-600'>Esta acción no se puede deshacer</p>
        </div>
      </div>
    </ModalHeader>
    <ModalBody>
			{document ? (
				<div className='space-y-4 text-sm'>
					<p className='text-gray-600'>
						¿Estás seguro de que deseas eliminar el documento{' '}
						<strong>{document.name}</strong>?
					</p>
					<div className='flex items-center space-x-2 text-gray-500'>
						<span>Módulo:</span>
						<Badge variant='outline'>{getModuleLabel(document.related_module)}</Badge>
					</div>
					<div className='flex items-center space-x-2 text-gray-500'>
						<span>ID relacionado:</span>
						<Badge variant='outline'>{document.related_id ?? '—'}</Badge>
					</div>
					<div className='rounded-md border border-red-200 bg-red-50 p-3 text-red-700'>
						<div className='flex items-start'>
							<Icon icon='HeroExclamationTriangle' className='mr-2 mt-0.5 h-5 w-5 text-red-400' />
							<div>
								<h4 className='text-sm font-medium text-red-800'>Confirma la eliminación</h4>
								<p>Todos los adjuntos asociados también serán eliminados permanentemente.</p>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className='py-6 text-center text-sm text-gray-500'>
					Selecciona un documento para eliminar.
				</div>
			)}
    </ModalBody>
    <ModalFooter>
      <div className='flex justify-end space-x-3'>
        <Button variant='outline' onClick={() => setIsOpen(false)}>
          Cancelar
        </Button>
        <Button color='red' onClick={onConfirm} isDisable={!document} isLoading={loading}>
          Eliminar documento
        </Button>
      </div>
    </ModalFooter>
  </Modal>
);

export default DeleteDocumentModal;
