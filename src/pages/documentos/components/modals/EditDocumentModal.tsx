import React, { Dispatch, SetStateAction, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Label from '@/components/form/Label';
import Icon from '@/components/icon/Icon';
import { DOCUMENT_TYPES, FILE_TYPES, RELATED_MODULES, IDocument } from '../../types/documentos.types';

type EditDocumentModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  document: IDocument | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ isOpen, setIsOpen, document, onSubmit }) => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmitClick = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
      <ModalHeader>
        <div className='flex items-center space-x-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
            <Icon icon='HeroPencil' className='h-6 w-6 text-amber-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Editar documento</h2>
            <p className='text-sm text-gray-600'>Actualiza la información del archivo seleccionado</p>
          </div>
        </div>
      </ModalHeader>
      {document ? (
        <form ref={formRef} id='editDocumentForm' onSubmit={onSubmit} className='space-y-4'>
          <ModalBody>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='md:col-span-2'>
                <Label htmlFor='edit-name' className='required'>Nombre del documento</Label>
                <Input id='edit-name' name='name' defaultValue={document.name} required />
              </div>
            </div>

            <div>
              <Label htmlFor='edit-file-path' className='required'>Ruta del archivo</Label>
              <Input
                id='edit-file-path'
                name='file_path'
                defaultValue={document.file_path}
                placeholder='Ej: /documents/contratos/contrato_2024.pdf'
                required
              />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-document-type' className='required'>Tipo de documento</Label>
                <Select id='edit-document-type' name='document_type' defaultValue={document.document_type} required>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-file-type' className='required'>Tipo de archivo</Label>
                <Select id='edit-file-type' name='file_type' defaultValue={document.file_type} required>
                  {FILE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='edit-related-module' className='required'>Módulo relacionado</Label>
                <Select id='edit-related-module' name='related_module' defaultValue={document.related_module} required>
                  {RELATED_MODULES.map((module) => (
                    <option key={module.value} value={module.value}>
                      {module.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor='edit-related-id' className='required'>ID relacionado</Label>
                <Input id='edit-related-id' name='related_id' type='number' min='1' defaultValue={document.related_id} required />
              </div>
            </div>

            <div>
              <Label htmlFor='edit-description'>Descripción (opcional)</Label>
              <Textarea
                id='edit-description'
                name='description'
                defaultValue={document.description}
                placeholder='Propósito o detalles adicionales'
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-is-active'>Estado</Label>
              <Checkbox id='edit-is-active' name='is_active' defaultChecked={document.is_active} label='Documento activo' />
            </div>
          </ModalBody>
          <ModalFooter>
            <div className='flex justify-end space-x-3'>
              <Button
                variant='outline'
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button color='amber' onClick={handleSubmitClick}>
                Guardar cambios
              </Button>
            </div>
          </ModalFooter>
        </form>
      ) : (
        <ModalBody>
          <div className='py-6 text-center text-sm text-gray-500'>Selecciona un documento para editar.</div>
        </ModalBody>
      )}
    </Modal>
  );
};

export default EditDocumentModal;
