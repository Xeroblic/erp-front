import React, { useCallback, useState } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { ISupplier, ISupplierFilters } from './components/types';
import { useProveedores } from './components/hooks/useProveedores';
import SupplierStats from './components/SupplierStats';
import SuppliersFilters from './components/SuppliersFilters';
import SuppliersTable from './components/tables/SuppliersTable';
import CrearProveedor from './components/modals/CrearProveedor';
import EditarProveedor from './components/modals/EditarProveedor';
import DetalleProveedor from './components/modals/DetalleProveedor';
import EliminarProveedor from './components/modals/EliminarProveedor';

const Proveedores: React.FC = () => {
  const [filters, setFilters] = useState<ISupplierFilters>({
    search: '',
    category: undefined,
    city: undefined,
    rating: undefined,
    is_active: undefined,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ISupplier | null>(null);

  const { suppliers, stats, loading, categoryOptions, ratingOptions, statusOptions } = useProveedores(filters);

  const handleFilterChange = useCallback(
    (key: keyof ISupplierFilters, value: unknown) => {
      setFilters((prev) => ({ ...prev, [key]: value as ISupplierFilters[keyof ISupplierFilters] }));
    },
    [],
  );

  const handleClearFilters = () => {
    setFilters({ search: '', category: undefined, city: undefined, rating: undefined, is_active: undefined });
  };

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get('name') || ''),
      code: String(data.get('code') || ''),
      document_type: String(data.get('document_type') || ''),
      document_number: String(data.get('document_number') || ''),
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || ''),
      address: String(data.get('address') || ''),
      city: String(data.get('city') || ''),
      country: 'Colombia',
      website: String(data.get('website') || ''),
      contact_person: String(data.get('contact_person') || ''),
      contact_email: String(data.get('contact_email') || ''),
      contact_phone: String(data.get('contact_phone') || ''),
      payment_terms: Number(data.get('payment_terms') || 0),
      credit_limit: Number(data.get('credit_limit') || 0),
      category: String(data.get('category') || ''),
      is_active: data.get('is_active') === 'on',
    };

    console.log('Create supplier:', payload);
    event.currentTarget.reset();
    setCreateOpen(false);
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;

    const data = new FormData(event.currentTarget);
    const payload = {
      id: selected.id,
      name: String(data.get('name') || ''),
      code: String(data.get('code') || ''),
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || ''),
      address: String(data.get('address') || ''),
      city: String(data.get('city') || ''),
      category: String(data.get('category') || selected.category),
      payment_terms: Number(data.get('payment_terms') || selected.payment_terms),
      credit_limit: Number(data.get('credit_limit') || selected.credit_limit),
      website: String(data.get('website') || ''),
      contact_person: String(data.get('contact_person') || ''),
      contact_email: String(data.get('contact_email') || ''),
      contact_phone: String(data.get('contact_phone') || ''),
      is_active: data.get('is_active') === 'on',
    };

    console.log('Update supplier:', payload);
    setEditOpen(false);
    setSelected(null);
  };

  const handleDeleteConfirm = () => {
    if (!selected) return;

    if (selected.products_count > 0 || selected.orders_count > 0) {
      console.warn('No se puede eliminar el proveedor porque tiene asociaciones activas.');
      return;
    }

    console.log('Delete supplier:', selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const handleView = (supplier: ISupplier) => {
    setSelected(supplier);
    setDetailOpen(true);
  };

  const handleEdit = (supplier: ISupplier) => {
    setSelected(supplier);
    setEditOpen(true);
  };

  const handleDelete = (supplier: ISupplier) => {
    setSelected(supplier);
    setDeleteOpen(true);
  };

  return (
    <PageWrapper name='proveedores-admin'>
      <Subheader>
        <SubheaderLeft>
          <div className='flex items-center space-x-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
              <Icon icon='HeroTruck' className='h-6 w-6 text-orange-600 dark:text-orange-400' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Proveedores</h1>
              <p className='text-sm text-gray-600 dark:text-gray-400'>Gesti�n de proveedores y condiciones comerciales</p>
            </div>
          </div>
        </SubheaderLeft>
        <SubheaderRight>
          <Button color='amber' onClick={() => setCreateOpen(true)} icon='HeroPlus'>
            Nuevo Proveedor
          </Button>
        </SubheaderRight>
      </Subheader>

      <Container>
        <SupplierStats stats={stats} />
        <SuppliersFilters
          filters={filters}
          categoryOptions={categoryOptions}
          ratingOptions={ratingOptions}
          statusOptions={statusOptions}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />
        <SuppliersTable suppliers={suppliers} loading={loading} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
      </Container>

      <CrearProveedor isOpen={createOpen} setIsOpen={setCreateOpen} onSubmit={handleCreateSubmit} />
      <EditarProveedor isOpen={editOpen} setIsOpen={setEditOpen} supplier={selected} onSubmit={handleEditSubmit} />
      <EliminarProveedor isOpen={deleteOpen} setIsOpen={setDeleteOpen} supplier={selected} onConfirm={handleDeleteConfirm} />
      <DetalleProveedor isOpen={detailOpen} setIsOpen={setDetailOpen} supplier={selected} onEdit={handleEdit} />
    </PageWrapper>
  );
};

export default Proveedores;

