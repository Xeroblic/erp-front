import React, { Dispatch, SetStateAction } from "react";
import Icon from "@/components/icon/Icon";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { IBrand } from "../types";
import { ensureAbsoluteUrl } from "@/components/helper/brand.helper";
import { formatCurrency } from "../utils";

type DetalleMarcaProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  brand: IBrand | null;
  onEdit?: (brand: IBrand) => void;
};

const DetalleMarca: React.FC<DetalleMarcaProps> = ({ isOpen, setIsOpen, brand, onEdit }) => (
  <Modal isOpen={isOpen} setIsOpen={setIsOpen} size="2xl">
    <ModalHeader>
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <Icon icon="HeroEye" className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Detalle de la marca</h2>
          <p className="text-sm text-gray-600">Informacion registrada y metricas principales</p>
        </div>
      </div>
    </ModalHeader>
    <ModalBody>
      {brand ? (
        <div className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            {ensureAbsoluteUrl(brand.image?.url ?? brand.logo_url ?? undefined) ? (
              <img
                src={ensureAbsoluteUrl(brand.image?.url ?? brand.logo_url ?? undefined) ?? ''}
                alt={brand.image?.alt ?? brand.name}
                className="h-20 w-20 rounded-lg border bg-white object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200">
                <Icon icon="HeroTag" className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{brand.name}</h3>
              {brand.code && <p className="font-mono text-sm text-gray-500">{brand.code}</p>}
              <div className="mt-2 flex items-center space-x-2">
                <Badge color={brand.is_active ? "emerald" : "red"}>
                  {brand.is_active ? "Activa" : "Inactiva"}
                </Badge>
                {brand.origin_country && <Badge variant="outline">{brand.origin_country}</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <h4 className="font-semibold text-gray-700">Informacion general</h4>
              <div className="flex justify-between">
                <span className="text-gray-600">Fabricante</span>
                <span className="font-medium text-gray-900">{brand.manufacturer ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pais de origen</span>
                <span className="font-medium text-gray-900">{brand.origin_country ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creacion</span>
                <span className="font-medium text-gray-900">
                  {brand.created_at ? new Date(brand.created_at).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ultima actualizacion</span>
                <span className="font-medium text-gray-900">
                  {brand.updated_at ? new Date(brand.updated_at).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <h4 className="font-semibold text-gray-700">Actividad</h4>
              <div className="flex justify-between">
                <span className="text-gray-600">Productos asociados</span>
                <span className="font-semibold text-gray-900">{brand.products_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ventas vinculadas</span>
                <span className="font-semibold text-green-600">{formatCurrency(brand.total_sales)}</span>
              </div>
              {brand.website_url && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sitio web</span>
                  <a
                    href={brand.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Visitar
                  </a>
                </div>
              )}
            </div>
          </div>

          {brand.description && (
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold text-gray-700">Descripcion</h4>
              <p className="mt-2 text-sm text-gray-600">{brand.description}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-gray-500">Selecciona una marca para ver los detalles.</div>
      )}
    </ModalBody>
    <ModalFooter>
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cerrar
        </Button>
        {brand && onEdit && (
          <Button
            color="blue"
            onClick={() => {
              setIsOpen(false);
              onEdit(brand);
            }}
          >
            Editar marca
          </Button>
        )}
      </div>
    </ModalFooter>
  </Modal>
);

export default DetalleMarca;
