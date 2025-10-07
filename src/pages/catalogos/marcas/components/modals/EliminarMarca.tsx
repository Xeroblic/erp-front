import React, { Dispatch, SetStateAction } from "react";
import Icon from "@/components/icon/Icon";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { IBrand } from "../types";

type EliminarMarcaProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  brand: IBrand | null;
  onConfirm: () => void;
  isLoading?: boolean;
};

const EliminarMarca: React.FC<EliminarMarcaProps> = ({ isOpen, setIsOpen, brand, onConfirm, isLoading }) => (
  <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
    <ModalHeader>
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <Icon icon="HeroTrash" className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Eliminar marca</h2>
          <p className="text-sm text-gray-600">Esta accion no se puede deshacer</p>
        </div>
      </div>
    </ModalHeader>
    <ModalBody>
      {brand ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-start">
              <Icon icon="HeroExclamationTriangle" className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
              <div className="space-y-2 text-sm text-red-700">
                <p>Estas seguro de eliminar la marca <strong>{brand.name}</strong>?</p>
                {brand.code && (
                  <p>
                    Codigo: <span className="font-mono font-semibold text-red-800">{brand.code}</span>
                  </p>
                )}
                <p>Fabricante: {brand.manufacturer ?? '-'}</p>
                {brand.products_count > 0 && (
                  <p className="font-semibold text-red-800">
                    La marca tiene {brand.products_count} productos asociados. Debes reasignarlos antes de eliminarla.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Estado actual:</span>
            <Badge color={brand.is_active ? 'emerald' : 'red'}>{brand.is_active ? 'Activa' : 'Inactiva'}</Badge>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-gray-500">Selecciona una marca para eliminar.</div>
      )}
    </ModalBody>
    <ModalFooter>
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancelar
        </Button>
        <Button color="red" onClick={onConfirm} isDisable={!brand || brand.products_count > 0 || isLoading}>
          {isLoading ? 'Eliminando...' : brand && brand.products_count > 0 ? 'No se puede eliminar' : 'Eliminar marca'}
        </Button>
      </div>
    </ModalFooter>
  </Modal>
);

export default EliminarMarca;
