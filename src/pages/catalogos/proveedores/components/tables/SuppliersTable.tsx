import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table, { THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import { ISupplier } from '../types';
import SupplierRating from '../SupplierRating';
import { formatCurrency } from '../utils';

type SuppliersTableProps = {
  suppliers: ISupplier[];
  loading: boolean;
  onView: (supplier: ISupplier) => void;
  onEdit: (supplier: ISupplier) => void;
  onDelete: (supplier: ISupplier) => void;
};

const getCategoryBadgeColor = (category: string) => {
  switch (category) {
    case 'TECNOLOGIA':
      return 'sky';
    case 'OFICINA':
      return 'emerald';
    case 'SERVICIOS':
      return 'violet';
    case 'INSUMOS':
      return 'amber';
    default:
      return 'gray';
  }
};

const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
  loading,
  onView,
  onEdit,
  onDelete,
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Lista de Proveedores</CardTitle>
        <span className="text-sm text-gray-500">{suppliers.length} proveedores</span>
      </div>
    </CardHeader>
    <CardBody className="p-0">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon icon="HeroArrowPath" className="h-8 w-8 animate-spin text-orange-600" />
          <span className="ml-2 text-gray-600">Cargando proveedores...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <Tr>
                <Th>Proveedor</Th>
                <Th>Contacto</Th>
                <Th>Categoría</Th>
                <Th>Rating</Th>
                <Th>Compras</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Tr>
            </THead>
            <TBody>
              {suppliers.map((supplier) => (
                <Tr key={supplier.id} className="hover:bg-gray-50">
                  <Td>
                    <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    <div className="text-sm text-gray-500">
                      {supplier.code} - {supplier.document_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {supplier.city}, {supplier.country}
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm text-gray-900">{supplier.contact_person}</div>
                    <div className="text-sm text-gray-500">{supplier.contact_email}</div>
                    <div className="text-sm text-gray-500">{supplier.contact_phone}</div>
                  </Td>
                  <Td>
                    <Badge color={getCategoryBadgeColor(supplier.category)}>
                      {supplier.category}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center space-x-2">
                      <SupplierRating value={supplier.rating} />
                      <span className="text-sm text-gray-500">({supplier.rating}/5)</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="font-medium">{formatCurrency(supplier.total_purchases)}</div>
                    <div className="text-gray-500">{supplier.orders_count} ordenes</div>
                    <div className="text-gray-500">{supplier.products_count} productos</div>
                  </Td>
                  <Td>
                    <Badge color={supplier.is_active ? 'emerald' : 'red'}>
                      {supplier.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onView(supplier)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Icon icon="HeroEye" className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(supplier)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Icon icon="HeroPencilSquare" className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(supplier)}
                        isDisable={supplier.orders_count > 0}
                        className={
                          supplier.orders_count > 0
                            ? 'cursor-not-allowed text-gray-400'
                            : 'text-red-600 hover:text-red-900'
                        }
                      >
                        <Icon icon="HeroTrash" className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </CardBody>
  </Card>
);

export default SuppliersTable;
