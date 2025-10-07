import React from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { ICategory } from '../../types';

type EliminarCategoriaProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  category: ICategory | null;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
};

const EliminarCategoria: React.FC<EliminarCategoriaProps> = ({ isOpen, setIsOpen, category, onConfirm, isLoading }) => (
  <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
    <ModalHeader>
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <Icon icon="HeroTrash" className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Eliminar categoria</h2>
          <p className="text-sm text-gray-600">Esta accion no se puede deshacer</p>
        </div>
      </div>
    </ModalHeader>
    <ModalBody>
      {category ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-start">
              <Icon icon="HeroExclamationTriangle" className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
              <div className="space-y-2 text-sm text-red-700">
                <p>Estas seguro de eliminar la categoria <strong>{category.name}</strong>?</p>
                <p>Padre: <span className="font-semibold text-red-800">{category.parent_name ?? 'Sin padre'}</span></p>
                <p>Productos asociados: {category.products_count ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Estado actual:</span>
            <Badge color={category.is_active ? 'emerald' : 'red'}>{category.is_active ? 'Activa' : 'Inactiva'}</Badge>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-gray-500">Selecciona una categoria para eliminar.</div>
      )}
    </ModalBody>
    <ModalFooter>
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancelar
        </Button>
        <Button color="red" onClick={onConfirm} isDisable={!category || isLoading}>
          {isLoading ? 'Eliminando...' : 'Eliminar categoria'}
        </Button>
      </div>
    </ModalFooter>
  </Modal>
);

export default EliminarCategoria;
