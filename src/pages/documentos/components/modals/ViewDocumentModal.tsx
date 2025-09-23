import React, { Dispatch, SetStateAction } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { IDocument } from '../../types/documentos.types';
import {
  formatDateTime,
  formatFileSize,
  getDocumentTypeColor,
  getDocumentTypeLabel,
  getFileTypeLabel,
  getModuleLabel,
} from '../utils';

type ViewDocumentModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  document: IDocument | null;
  onEdit?: (document: IDocument) => void;
};

const ViewDocumentModal: React.FC<ViewDocumentModalProps> = ({ isOpen, setIsOpen, document, onEdit }) => (
  <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl'>
    <ModalHeader>
      <div className='flex items-center space-x-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
          <Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
        </div>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Detalles del documento</h2>
          <p className='text-sm text-gray-600'>Información completa y metadatos</p>
        </div>
      </div>
    </ModalHeader>
    <ModalBody>
      {document ? (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='space-y-3'>
              <h3 className='text-lg font-semibold text-gray-900'>{document.name}</h3>
              <div className='space-y-2 text-sm text-gray-600'>
                <div className='flex justify-between'>
                  <span className='font-medium text-gray-700'>Tipo de documento</span>
                  <Badge color={getDocumentTypeColor(document.document_type) as any}>
                    {getDocumentTypeLabel(document.document_type)}
                  </Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium text-gray-700'>Tipo de archivo</span>
                  <Badge variant='outline' color='gray'>{getFileTypeLabel(document.file_type)}</Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium text-gray-700'>Tamaño</span>
                  <span>{formatFileSize(document.file_size || 0)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium text-gray-700'>Ruta</span>
                  <span className='truncate text-blue-600'>{document.file_path}</span>
                </div>
              </div>
            </div>
            <div className='space-y-2 rounded-lg border p-4 text-sm text-gray-600'>
              <div className='flex justify-between'>
                <span className='font-medium text-gray-700'>Módulo relacionado</span>
                <span>{getModuleLabel(document.related_module)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='font-medium text-gray-700'>ID relacionado</span>
                <span>{document.related_id}</span>
              </div>
              <div className='flex justify-between'>
                <span className='font-medium text-gray-700'>Subido por</span>
                <span>{document.uploaded_by_name}</span>
              </div>
              <div className='flex justify-between'>
                <span className='font-medium text-gray-700'>Creado</span>
                <span>{formatDateTime(document.created_at)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='font-medium text-gray-700'>Actualizado</span>
                <span>{formatDateTime(document.updated_at)}</span>
              </div>
              <Badge variant='outline' color={document.is_active ? 'emerald' : 'red'}>
                {document.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {document.description && (
            <div className='rounded-lg bg-gray-50 p-4 text-sm text-gray-600'>
              <h4 className='mb-2 font-semibold text-gray-900'>Descripción</h4>
              <p>{document.description}</p>
            </div>
          )}
        </div>
      ) : (
        <div className='py-6 text-center text-sm text-gray-500'>Selecciona un documento para ver sus detalles.</div>
      )}
    </ModalBody>
    <ModalFooter>
      <div className='flex justify-end space-x-3'>
        <Button
          variant='outline'
          onClick={() => {
            setIsOpen(false);
          }}
        >
          Cerrar
        </Button>
        {document && onEdit && (
          <Button
            color='amber'
            onClick={() => {
              setIsOpen(false);
              onEdit(document);
            }}
          >
            Editar documento
          </Button>
        )}
      </div>
    </ModalFooter>
  </Modal>
);

export default ViewDocumentModal;
