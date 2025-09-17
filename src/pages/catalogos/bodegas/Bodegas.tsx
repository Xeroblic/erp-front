/**
 * Sistema de Gestión de Bodegas
 * Vista principal: lista y modales (crear, editar, eliminar, detalle)
 */
import React, { useState } from 'react';
import PageWrapper from '../../../components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '../../../components/layouts/Subheader/Subheader';
import Container from '../../../components/layouts/Container/Container';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/icon/Icon';
import { useBodegas } from './components/hooks/useBodegas';
import WarehousesTable from './components/tables/WarehousesTable';
import CrearBodega from './components/modals/CrearBodega';
import EditarBodega from './components/modals/EditarBodega';
import EliminarBodega from './components/modals/EliminarBodega';
import DetalleBodega from './components/modals/DetalleBodega';
import { IWarehouse, IWarehouseFilters } from './components/types';
import Spinner from '@/components/ui/Spinner';

const Bodegas: React.FC = () => {
  const [filters] = useState<IWarehouseFilters>({
    search: '',
    warehouse_type: undefined,
    city: undefined,
    is_active: undefined,
    has_climate_control: undefined,
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<IWarehouse | null>(null);

  const { warehouses, loading } = useBodegas(filters);

  const handleCreateWarehouse = () => setCreateModalOpen(true);
  const handleEditWarehouse = (warehouse: IWarehouse) => {
    setSelectedWarehouse(warehouse);
    setEditModalOpen(true);
  };
  const handleViewWarehouse = (warehouse: IWarehouse) => {
    setSelectedWarehouse(warehouse);
    setViewModalOpen(true);
  };
  const handleDeleteWarehouse = (warehouse: IWarehouse) => {
    setSelectedWarehouse(warehouse);
    setDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newWarehouse = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: (formData.get('description') as string) || '',
      warehouse_type: formData.get('warehouse_type') as string,
      capacity: parseFloat((formData.get('capacity') as string) || '0') || 0,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      country: formData.get('country') as string,
      phone: (formData.get('phone') as string) || '',
      manager: (formData.get('manager') as string) || '',
      email: (formData.get('email') as string) || '',
      operating_hours: (formData.get('operating_hours') as string) || '',
      has_climate_control: formData.get('has_climate_control') === 'on',
      has_security_system: formData.get('has_security_system') === 'on',
      has_loading_dock: formData.get('has_loading_dock') === 'on',
      is_active: formData.get('is_active') === 'on',
    };
    console.log('Creating warehouse:', newWarehouse);
    setCreateModalOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    const formData = new FormData(e.currentTarget);
    const updatedWarehouse = {
      id: selectedWarehouse.id,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: (formData.get('description') as string) || '',
      warehouse_type: formData.get('warehouse_type') as string,
      capacity: parseFloat((formData.get('capacity') as string) || '0') || 0,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      country: formData.get('country') as string,
      phone: (formData.get('phone') as string) || '',
      manager: (formData.get('manager') as string) || '',
      email: (formData.get('email') as string) || '',
      operating_hours: (formData.get('operating_hours') as string) || '',
      has_climate_control: formData.get('has_climate_control') === 'on',
      has_security_system: formData.get('has_security_system') === 'on',
      has_loading_dock: formData.get('has_loading_dock') === 'on',
      is_active: formData.get('is_active') === 'on',
    };
    console.log('Updating warehouse:', updatedWarehouse);
    setEditModalOpen(false);
    setSelectedWarehouse(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedWarehouse) return;
    console.log('Deleting warehouse:', selectedWarehouse.id);
    setDeleteModalOpen(false);
    setSelectedWarehouse(null);
  };

  return (
    <PageWrapper name='bodegas-admin'>
      <Subheader>
        <SubheaderLeft>
          <div className='flex items-center space-x-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20'>
              <Icon icon='HeroHomeModern' className='h-6 w-6 text-indigo-600 dark:text-indigo-400' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Bodegas</h1>
              <p className='text-sm text-gray-600 dark:text-gray-400'>Gestión de bodegas y control de inventario</p>
            </div>
          </div>
        </SubheaderLeft>
        <SubheaderRight>
          <Button color='blue' onClick={handleCreateWarehouse} icon='HeroPlus'>
            Nueva Bodega
          </Button>
        </SubheaderRight>
      </Subheader>

      <Container>
        {loading ? (
			<Spinner nombre='Bodegas'/>
		) : (
          <WarehousesTable
            warehouses={warehouses}
            onView={handleViewWarehouse}
            onEdit={handleEditWarehouse}
            onDelete={handleDeleteWarehouse}
          />
        )}
      </Container>

      <CrearBodega isOpen={createModalOpen} setIsOpen={setCreateModalOpen} onSubmit={handleCreateSubmit} />
      <EditarBodega isOpen={editModalOpen} setIsOpen={setEditModalOpen} warehouse={selectedWarehouse} onSubmit={handleEditSubmit} />
      <EliminarBodega isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} warehouse={selectedWarehouse} onConfirm={handleConfirmDelete} />
      <DetalleBodega isOpen={viewModalOpen} setIsOpen={setViewModalOpen} warehouse={selectedWarehouse} />
    </PageWrapper>
  );
};

export default Bodegas;

