import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addHoliday, removeHoliday } from '@/store/slices/recursosHumanos/rhSlice';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Calendar from '@/components/Calendar';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalFooterChild } from '@/components/ui/Modal';
import type { IRHHoliday } from '@/interface/rh.interface';
import axios from 'axios';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const FeriadosManager: React.FC = () => {
	const dispatch = useAppDispatch();
	const holidays = useAppSelector((s) => s.recursosHumanos.holidays);

	const [name, setName] = useState('');
	const [date, setDate] = useState('');
	const [recurring, setRecurring] = useState(false);
	const [apiHolidays, setApiHolidays] = useState<{ date: string; title: string; type?: string; inalienable?: boolean; extra?: string }[]>([]);
	const [loadingApi, setLoadingApi] = useState(false);
	
	const [selectedEvent, setSelectedEvent] = useState<any>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		const fetchHolidays = async () => {
			setLoadingApi(true);
			try {
				const response = await axios.get('https://api.boostr.cl/holidays.json');
				if (response.data?.status === 'success') {
					const formatted = response.data.data.map((h: any) => ({
						date: h.date,
						title: h.title,
						type: h.type,
						inalienable: h.inalienable,
						extra: h.extra,
					}));
					setApiHolidays(formatted);
				}
			} catch (error) {
				console.error('Error fetching holidays', error);
				toast.error('Error al cargar feriados de la API');
			} finally {
				setLoadingApi(false);
			}
		};
		fetchHolidays();
	}, []);

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

	const allEvents = useMemo(() => {
		const todayStr = dayjs().format('YYYY-MM-DD');

		const customEvents = holidays.map((h) => {
			const isToday = h.date === todayStr;
			return {
				title: h.name,
				date: h.date, // Formato YYYY-MM-DD
				allDay: true,
				color: isToday ? '#ef4444' : '#eab308', // Rojo si es hoy, Amarillo si es manual
				extendedProps: {
					isManual: true,
					recurring: h.recurring,
				}
			};
		});

		const apiEvents = apiHolidays.map((h) => {
			const isToday = h.date === todayStr;
			return {
				title: h.title,
				date: h.date,
				allDay: true,
				color: isToday ? '#ef4444' : '#3b82f6', // Rojo si es hoy, Azul si es oficial
				extendedProps: {
					type: h.type,
					inalienable: h.inalienable,
					extra: h.extra,
					isManual: false,
				}
			};
		});
		return [...apiEvents, ...customEvents];
	}, [holidays, apiHolidays]);

	const handleEventClick = (info: any) => {
		setSelectedEvent({
			title: info.event.title,
			date: info.event.startStr,
			...info.event.extendedProps
		});
		setIsModalOpen(true);
	};

	return (
		<>
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

				<div className='mt-8'>
					{loadingApi ? (
						<div className='flex justify-center p-8 text-zinc-500'>
							<Icon icon='HeroArrowPath' className='animate-spin text-2xl' />
							<span className='ml-2'>Cargando feriados...</span>
						</div>
					) : (
						<div className='flex flex-col gap-6'>
							<div className="w-full h-auto bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
								<div className="min-w-[768px]">
									<Calendar
										events={allEvents}
										eventClick={handleEventClick}
									/>
								</div>
							</div>
							
							{holidays.length > 0 && (
								<div className='overflow-x-auto mt-4'>
									<h3 className='mb-3 text-lg font-semibold text-zinc-300'>Feriados Agregados Manualmente</h3>
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
						</div>
					)}
				</div>
			</CardBody>
		</Card>

			{/* Modal de Detalles del Feriado */}
			<Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} size='md'>
				<ModalHeader setIsOpen={setIsModalOpen}>
					<div className="flex items-center gap-2">
						<Icon icon='HeroCalendar' color='blue' />
						Detalles del Feriado
					</div>
				</ModalHeader>
				<ModalBody>
					{selectedEvent && (
						<div className='flex flex-col gap-4 text-zinc-600 dark:text-zinc-300'>
							<div className='rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700/50'>
								<h3 className='text-xl font-bold text-zinc-900 dark:text-white mb-1'>{selectedEvent.title}</h3>
								<p className='text-sm text-zinc-500 dark:text-zinc-400 font-mono'>{dayjs(selectedEvent.date).format('DD/MM/YYYY')}</p>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<div className='rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-3 border border-zinc-200 dark:border-transparent'>
									<div className='text-xs text-zinc-500 dark:text-zinc-500 mb-1'>Origen</div>
									<div className='font-semibold'>
										{selectedEvent.isManual ? (
											<span className='text-yellow-600 dark:text-yellow-400 flex items-center gap-1'><Icon icon='HeroUser' size='text-sm' /> Manual</span>
										) : (
											<span className='text-blue-600 dark:text-blue-400 flex items-center gap-1'><Icon icon='HeroGlobeAlt' size='text-sm' /> Oficial (API)</span>
										)}
									</div>
								</div>
								
								{selectedEvent.type && (
									<div className='rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-3 border border-zinc-200 dark:border-transparent'>
										<div className='text-xs text-zinc-500 dark:text-zinc-500 mb-1'>Tipo</div>
										<div className='font-semibold text-zinc-800 dark:text-zinc-200'>{selectedEvent.type}</div>
									</div>
								)}

								{selectedEvent.extra && (
									<div className='rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-3 col-span-2 border border-zinc-200 dark:border-transparent'>
										<div className='text-xs text-zinc-500 dark:text-zinc-500 mb-1'>Información Extra</div>
										<div className='font-semibold text-zinc-800 dark:text-zinc-200'>{selectedEvent.extra}</div>
									</div>
								)}
							</div>

							<div className='mt-2 flex gap-2'>
								{selectedEvent.inalienable && (
									<span className='rounded-full bg-red-100 dark:bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'>
										Irrenunciable
									</span>
								)}
								{selectedEvent.recurring && (
									<span className='rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'>
										Recurrente
									</span>
								)}
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='w-full flex justify-end'>
						<Button variant='solid' color='blue' onClick={() => setIsModalOpen(false)}>
							Cerrar
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default FeriadosManager;
