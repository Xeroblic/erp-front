import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Table, { THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';

interface CustomersTableProps {
	customers: ICustomerSupplier[];
	onView: (c: ICustomerSupplier) => void;
	onEdit: (c: ICustomerSupplier) => void;
	onDelete: (c: ICustomerSupplier) => void;
}

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, onView, onDelete }) => (
	<Card>
		<CardHeader>
			<div className='flex items-center justify-between'>
				<CardTitle>Lista de Clientes-Proveedor</CardTitle>
				<span className='text-sm text-gray-500'>{customers.length} clientes</span>
			</div>
		</CardHeader>
		<CardBody className='p-0'>
			<div className='overflow-x-auto'>
				<Table>
					<THead>
						<Tr>
							<Th>Cliente</Th>
							<Th>Creado</Th>
							<Th>Acciones</Th>
						</Tr>
					</THead>
					<TBody>
						{customers.map((c) => (
							<Tr key={c.id} className='hover:bg-gray-50'>
								<Td>
									<div className='text-sm font-medium text-gray-900 dark:text-white'>
										{c.name}
									</div>
									<div className='text-xs text-gray-500'>ID: {c.id}</div>
								</Td>
								<Td>
									<div className='text-xs text-gray-500'>
										{c.created_at
											? new Date(String(c.created_at)).toLocaleDateString(
													'es-CO',
												)
											: '-'}
									</div>
								</Td>
								<Td>
									<div className='flex space-x-2'>
										<Button
											size='sm'
											variant='outline'
											onClick={() => onView(c)}
											className='text-blue-600 hover:text-blue-900'>
											<Icon icon='HeroEye' className='h-4 w-4' />
										</Button>
										{/* <Button
											size='sm'
											variant='outline'
											onClick={() => onEdit(c)}
											className='text-indigo-600 hover:text-indigo-900'>
											<Icon icon='HeroPencilSquare' className='h-4 w-4' />
										</Button> */}
										<Button
											size='sm'
											variant='outline'
											onClick={() => onDelete(c)}
											className='text-red-600 hover:text-red-900'>
											<Icon icon='HeroTrash' className='h-4 w-4' />
										</Button>
									</div>
								</Td>
							</Tr>
						))}
					</TBody>
				</Table>
			</div>
		</CardBody>
	</Card>
);

export default CustomersTable;
