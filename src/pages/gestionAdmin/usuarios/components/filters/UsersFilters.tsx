import React from 'react';
import { Formik, Form } from 'formik';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';

interface UsersFiltersProps {
	onFiltersChange: (filters: any) => void;
	onClearFilters: () => void;
}

interface FilterValues {
	search: string;
	rut: string;
	email: string;
	is_active: string;
	branch_id: string;
	company_id: string;
	position: string;
}

const statusOptions = [
	{ value: '', label: 'Todos los estados' },
	{ value: 'true', label: 'Activos' },
	{ value: 'false', label: 'Inactivos' },
];

const branchOptions = [
	{ value: '', label: 'Todas las sucursales' },
	{ value: '1', label: 'Sucursal Principal' },
	{ value: '2', label: 'Sucursal Norte' },
	{ value: '3', label: 'Sucursal Sur' },
];

const positionOptions = [
	{ value: '', label: 'Todos los cargos' },
	{ value: 'administrador', label: 'Administrador' },
	{ value: 'supervisor', label: 'Supervisor' },
	{ value: 'vendedor', label: 'Vendedor' },
	{ value: 'contador', label: 'Contador' },
	{ value: 'empleado', label: 'Empleado' },
];

const initialValues: FilterValues = {
	search: '',
	rut: '',
	email: '',
	is_active: '',
	branch_id: '',
	company_id: '',
	position: '',
};

export default function UsersFilters({ onFiltersChange, onClearFilters }: UsersFiltersProps) {
	const handleSubmit = (values: FilterValues) => {
		// Filtrar valores vacíos
		const filters = Object.entries(values).reduce((acc, [key, value]) => {
			if (value && value.trim() !== '') {
				acc[key] = value.trim();
			}
			return acc;
		}, {} as any);

		onFiltersChange(filters);
	};

	const handleClear = (resetForm: () => void) => {
		resetForm();
		onClearFilters();
	};

	return (
		<Card className='mb-6'>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroFunnel' className='h-4 w-4' />
					<h4 className='font-medium'>Filtros de Búsqueda</h4>
				</div>
			</CardHeader>
			<CardBody>
				<Formik initialValues={initialValues} onSubmit={handleSubmit}>
					{({ values, handleChange, handleBlur, setFieldValue, resetForm }) => (
						<Form>
                            <div className='space-y-4'>
                                {/* Primera fila: Búsqueda general */}
                                <div>
                                    <Label htmlFor='search'>Búsqueda General</Label>
                                    <Input
                                        id='search'
                                        name='search'
                                        value={values.search}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder='Buscar por nombre, email, RUT...'
                                    />
                                    <p className='mt-1 text-xs text-gray-500'>
                                        Busca en nombre, apellido, email y RUT simultáneamente
                                    </p>
                                </div>

                                {/* Segunda fila: Filtros específicos */}
                                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                                    {/* RUT */}
                                    <div>
                                        <Label htmlFor='rut'>RUT</Label>
                                        <Input
                                            id='rut'
                                            name='rut'
                                            value={values.rut}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder='12.345.678-9'
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <Label htmlFor='email'>Email</Label>
                                        <Input
                                            id='email'
                                            name='email'
                                            value={values.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder='usuario@empresa.com'
                                        />
                                    </div>

                                    {/* Estado */}
                                    <div>
                                        <Label htmlFor='is_active'>Estado</Label>
                                        <SelectReact
                                            name='is_active'
                                            options={statusOptions}
                                            value={
                                                statusOptions.find(
                                                    (option) => option.value === values.is_active,
                                                ) || statusOptions[0]
                                            }
                                            onChange={(option: any) =>
                                                setFieldValue('is_active', option?.value || '')
                                            }
                                            placeholder='Seleccionar estado...'
                                        />
                                    </div>
                                </div>

                                {/* Tercera fila: Filtros organizacionales */}
                                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                                    {/* Sucursal */}
                                    <div>
                                        <Label htmlFor='branch_id'>Sucursal Principal</Label>
                                        <SelectReact
                                            name='branch_id'
                                            options={branchOptions}
                                            value={
                                                branchOptions.find(
                                                    (option) => option.value === values.branch_id,
                                                ) || branchOptions[0]
                                            }
                                            onChange={(option: any) =>
                                                setFieldValue('branch_id', option?.value || '')
                                            }
                                            placeholder='Seleccionar sucursal...'
                                        />
                                    </div>

                                    {/* Cargo */}
                                    <div>
                                        <Label htmlFor='position'>Cargo</Label>
                                        <SelectReact
                                            name='position'
                                            options={positionOptions}
                                            value={
                                                positionOptions.find(
                                                    (option) => option.value === values.position,
                                                ) || positionOptions[0]
                                            }
                                            onChange={(option: any) =>
                                                setFieldValue('position', option?.value || '')
                                            }
                                            placeholder='Seleccionar cargo...'
                                        />
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className='flex justify-end gap-2 pt-4'>
                                    <Button
                                        variant='outline'
                                        onClick={() => handleClear(resetForm)}>
                                        <Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
                                        Limpiar Filtros
                                    </Button>
                                    <Button onClick={() => (values)}>
                                        <Icon icon='HeroMagnifyingGlass' className='mr-2 h-4 w-4' />
                                        Aplicar Filtros
                                    </Button>
                                </div>
                            </div>
						</Form>
					)}
				</Formik>
			</CardBody>
		</Card>
	);
}
