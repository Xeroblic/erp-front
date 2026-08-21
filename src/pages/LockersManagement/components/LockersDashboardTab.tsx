import React, { useMemo } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { ILockerInternal, ILockerLocation, IServiceOrder } from '@/interface/lockers.interface';
import { getStatusConfig } from '../types';
import ListLockers from './table/ListLockers';

interface ILockersDashboardTabProps {
	locations: ILockerLocation[];
	selectedLocationId: number | null;
	lockers: ILockerInternal[];
	serviceOrders: IServiceOrder[];
	isLoading: boolean;
	error: string | null;
	changeLocation: (locationId: number) => void;
	fetchLockers: () => void;
	openAction: (locker: ILockerInternal, type: 'withdraw' | 'dropoff' | 'reset' | 'ready') => void;
	setDetailLocker: (locker: ILockerInternal) => void;
	setIsScanning: (isScanning: boolean) => void;
}

const LockersDashboardTab: React.FC<ILockersDashboardTabProps> = ({
	locations,
	selectedLocationId,
	lockers,
	serviceOrders,
	isLoading,
	error,
	changeLocation,
	fetchLockers,
	openAction,
	setDetailLocker,
	setIsScanning,
}) => {
	const statusCounts = useMemo(() => {
		const counts: Record<string, number> = {
			Disponible: 0,
			Ocupado: 0,
			'Esperando Retiro': 0,
			'En Cuarentena': 0,
		};
		lockers.forEach((l) => {
			const config = getStatusConfig(l.status);
			if (counts[config.label] !== undefined) {
				counts[config.label]++;
			}
		});
		return counts;
	}, [lockers]);

	const locationOptions: TSelectOption[] = locations.map((loc) => ({
		value: String(loc.id),
		label: loc.name || `Ubicación ${loc.id}`,
	}));

	const summaryCards = [
		{ label: 'Disponible', color: 'emerald', icon: 'HeroCheck' },
		{ label: 'Ocupado', color: 'amber', icon: 'HeroLockClosed' },
		{ label: 'Esperando Retiro', color: 'blue', icon: 'HeroBell' },
		{ label: 'En Cuarentena', color: 'violet', icon: 'HeroClock' },
	];

	return (
		<div className='flex flex-col gap-4'>
			{/* Selector de ubicación */}
			<Card>
				<CardBody className='p-4'>
					<div className='flex flex-wrap items-end gap-4'>
						<div className='min-w-[250px] flex-1'>
							<Label htmlFor='location-select'>Ubicación / Sede</Label>
							<SelectReact
								id='location-select'
								name='location'
								options={locationOptions}
								placeholder='Selecciona una ubicación...'
								value={
									locationOptions.find(
										(o) => o.value === String(selectedLocationId),
									) ?? null
								}
								onChange={(opt) => {
									const selected = opt as TSelectOption | null;
									if (selected) changeLocation(Number(selected.value));
								}}
							/>
						</div>
						<div className='flex gap-2'>
							<Button
								color='blue'
								variant='solid'
								icon='HeroQrCode'
								onClick={() => setIsScanning(true)}>
								Escanear QR
							</Button>
							<Button
								color='emerald'
								variant='outline'
								icon='HeroArrowPath'
								isLoading={isLoading}
								onClick={fetchLockers}>
								Actualizar
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Resumen de estados */}
			<div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
				{summaryCards.map(({ label, color, icon }) => (
					<Card key={label}>
						<CardBody className='p-4'>
							<div className='flex items-center gap-3'>
								<div
									className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>
									<Icon icon={icon} className={`h-5 w-5 text-${color}-600`} />
								</div>
								<div>
									<p className='text-xs font-medium text-zinc-500'>{label}</p>
									<p className='text-2xl font-bold text-zinc-800 dark:text-zinc-200'>
										{statusCounts[label] ?? 0}
									</p>
								</div>
							</div>
						</CardBody>
					</Card>
				))}
			</div>

			{/* Tabla de casilleros */}
			<Card>
				<CardHeader>
					<Badge className='text-lg font-semibold'>Casilleros ({lockers.length})</Badge>
				</CardHeader>
				<CardBody className='p-0'>
					<ListLockers
						lockers={lockers}
						serviceOrders={serviceOrders}
						isLoading={isLoading}
						error={error}
						openAction={openAction}
						setDetailLocker={setDetailLocker}
					/>
				</CardBody>
			</Card>
		</div>
	);
};

export default LockersDashboardTab;
