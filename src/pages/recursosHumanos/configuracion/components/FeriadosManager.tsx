// src/pages/recursosHumanos/configuracion/components/FeriadosManager.tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addHoliday, removeHoliday } from '@/store/slices/recursosHumanos/rhSlice';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { IRHHoliday } from '@/interface/rh.interface';

const FeriadosManager: React.FC = () => {
	const dispatch = useAppDispatch();
	const holidays = useAppSelector((s) => s.recursosHumanos.holidays);

	const [name, setName] = useState('');
	const [date, setDate] = useState('');
	const [recurring, setRecurring] = useState(false);

	const handleAdd = () => {
		if (!name.trim() || !date) return;

		const holiday: IRHHoliday = {
			id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
			name: name.trim(),
			date,
			recurring,
		};

		dispatch(addHoliday(holiday));
		setName('');
		setDate('');
		setRecurring(false);
	};

	const handleRemove = (id: string) => {
		dispatch(removeHoliday(id));
	};

	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Feriados</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				{/* Formulario inline */}
				<div className='mb-4 grid grid-cols-1 items-end gap-3 md:grid-cols-4'>
					<div>
						<label className='mb-1 block text-sm font-medium text-zinc-400'>
							Nombre
						</label>
						<Input
                            name='dias_festivos'
							id='holiday-name'
							placeholder='Ej: Año Nuevo'
							value={name}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setName(e.target.value)
							}
						/>
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-zinc-400'>
							Fecha
						</label>
						<Input
							name='fecha'
							id='holiday-date'
							type='date'
							value={date}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setDate(e.target.value)
							}
						/>
					</div>
					<div className='flex items-center gap-2 pt-5'>
						<input
							type='checkbox'
							id='holiday-recurring'
							checked={recurring}
							onChange={(e) => setRecurring(e.target.checked)}
							className='h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-blue-500'
						/>
						<label htmlFor='holiday-recurring' className='text-sm text-zinc-400'>
							Cada año
						</label>
					</div>
					<div>
						<Button
							variant='solid'
							color='blue'
							icon='HeroPlus'
							onClick={handleAdd}
							isDisable={!name.trim() || !date}>
							Agregar
						</Button>
					</div>
				</div>

				{/* Tabla de feriados */}
				{holidays.length === 0 ? (
					<div className='rounded-lg border border-zinc-700 bg-zinc-800/50 py-8 text-center'>
						<Icon
							icon='HeroCalendarDays'
							size='text-4xl'
							className='mx-auto mb-2 text-zinc-500'
						/>
						<p className='text-sm text-zinc-500'>No hay feriados configurados</p>
					</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full text-left text-sm'>
							<thead>
								<tr className='border-b border-zinc-700 text-zinc-400'>
									<th className='px-4 py-2'>Nombre</th>
									<th className='px-4 py-2'>Fecha</th>
									<th className='px-4 py-2'>Recurrente</th>
									<th className='px-4 py-2 text-right'>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{holidays.map((h) => (
									<tr key={h.id} className='border-b border-zinc-700/50'>
										<td className='px-4 py-2 text-zinc-200'>{h.name}</td>
										<td className='px-4 py-2 text-zinc-300'>{h.date}</td>
										<td className='px-4 py-2'>
											{h.recurring ? (
												<span className='rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400'>
													Sí
												</span>
											) : (
												<span className='rounded bg-zinc-600/30 px-2 py-0.5 text-xs text-zinc-400'>
													No
												</span>
											)}
										</td>
										<td className='px-4 py-2 text-right'>
											<Button
												variant='outline'
												color='red'
												size='sm'
												icon='HeroTrash'
												onClick={() => handleRemove(h.id)}>
												Eliminar
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default FeriadosManager;
