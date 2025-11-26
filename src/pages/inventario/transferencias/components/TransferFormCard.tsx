import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import type { TransferFormState } from '../types';
import type { IWarehouse } from '@/interface/warehouse.interface';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

interface TransferFormCardProps {
	form: TransferFormState;
	onChange: (payload: Partial<TransferFormState>) => void;
	warehouses: IWarehouse[];
	responsibles: UserWithDetails[];
}

const TransferFormCard: React.FC<TransferFormCardProps> = ({
	form,
	onChange,
	warehouses,
	responsibles,
}) => {
	const handleChange = (key: keyof TransferFormState) => (event: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
		onChange({ [key]: event.target.value });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-3'>
					<span>
						<svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
							/>
						</svg>
					</span>
					Información de Transferencia
				</CardTitle>
			</CardHeader>
			<CardBody>
				<div className='space-y-4'>
					<div>
						<label className='mb-2 block text-sm font-medium'>Bodega de Origen *</label>
						<Select
							name='from_warehouse_id'
							value={form.from_warehouse_id}
							onChange={handleChange('from_warehouse_id')}
							required>
							<option value=''>Seleccionar bodega origen</option>
							{warehouses.map((warehouse) => (
								<option key={warehouse.id} value={warehouse.id.toString()}>
									{warehouse.name} ({warehouse.code})
								</option>
							))}
						</Select>
					</div>
					<div>
						<label className='mb-2 block text-sm font-medium'>Bodega de Destino *</label>
						<Select
							name='to_warehouse_id'
							value={form.to_warehouse_id}
							onChange={handleChange('to_warehouse_id')}
							required>
							<option value=''>Seleccionar bodega destino</option>
							{warehouses
								.filter((warehouse) => warehouse.id.toString() !== form.from_warehouse_id)
								.map((warehouse) => (
									<option key={warehouse.id} value={warehouse.id.toString()}>
										{warehouse.name} ({warehouse.code})
									</option>
								))}
						</Select>
					</div>
					<div>
						<label className='mb-2 block text-sm font-medium'>Responsable *</label>
						<Select
							name='responsible_id'
							value={form.responsible_id}
							onChange={handleChange('responsible_id')}
							required>
							<option value=''>Seleccionar responsable</option>
							{responsibles.map((user) => (
								<option key={user.id} value={user.id.toString()}>
									{user.first_name} {user.last_name} - {user.email}
								</option>
							))}
						</Select>
					</div>
					<div>
						<label className='mb-2 block text-sm font-medium'>Notas (opcional)</label>
						<Textarea
							rows={3}
							placeholder='Notas adicionales sobre la transferencia'
							value={form.notes}
							onChange={handleChange('notes')}
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default TransferFormCard;
