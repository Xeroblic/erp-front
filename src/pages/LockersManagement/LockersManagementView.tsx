import React, { useState } from 'react';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Tabs, { Tab } from '@/components/ui/Tabs';
import { ILockerInternal, ILockerLocation, IServiceOrder } from '@/interface/lockers.interface';
import LockersDashboardTab from './components/LockersDashboardTab';
import OrdersTechnicianTab from './components/OrdersTechnicianTab';
import LockerActionModal from './components/modal/LockerActionModal';
import DetailLockerModal from './components/modal/DetailLockerModal';
import SuccessPinModal from './components/modal/SuccessPinModal';
import QRScannerModal from './components/modal/QRScannerModal';
import { ILockerActionSubmit, resolveActionCommand, TLockerAction } from './types';

// ─────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────
interface ILockersManagementViewProps {
	locations: ILockerLocation[];
	selectedLocationId: number | null;
	selectedSubsidiaryId: number | null;
	lockers: ILockerInternal[];
	serviceOrders: IServiceOrder[];
	isLoading: boolean;
	error: string | null;
	selectedLocker: ILockerInternal | null;
	actionType: TLockerAction | null;
	isActionLoading: boolean;
	successPin: string | null;
	successMessage: string | null;
	selectedOrderId: number | null;
	// Acciones
	setSuccessPin: (pin: string | null) => void;
	changeLocation: (locationId: number) => void;
	fetchLockers: () => void;
	fetchServiceOrders: () => void;
	openAction: (locker: ILockerInternal, type: TLockerAction, orderId?: number) => void;
	closeAction: () => void;
	handleWithdraw: (serviceOrderId: number) => void;
	handleDropOff: (lockerId: number, serviceOrderId: number) => void;
	handleReset: (lockerId: number) => void;
	handleScanQR: (token: string) => Promise<boolean>;
}

// ─────────────────────────────────────────────────
// Componente View
// ─────────────────────────────────────────────────
const LockersManagementView: React.FC<ILockersManagementViewProps> = ({
	locations,
	selectedLocationId,
	selectedSubsidiaryId,
	lockers,
	serviceOrders,
	isLoading,
	error,
	selectedLocker,
	actionType,
	isActionLoading,
	successPin,
	successMessage,
	selectedOrderId,
	setSuccessPin,
	changeLocation,
	fetchLockers,
	openAction,
	closeAction,
	handleWithdraw,
	handleDropOff,
	handleReset,
	handleScanQR,
}) => {
	// --- Estado local para los modales y UI extra ---
	const [detailLocker, setDetailLocker] = useState<ILockerInternal | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [activeTab, setActiveTab] = useState<string>('casilleros');

	const handleActionSubmit = (data: ILockerActionSubmit) => {
		const command = resolveActionCommand(actionType, data, selectedLocker);

		if (command?.kind === 'withdraw') handleWithdraw(command.orderId);
		if (command?.kind === 'dropoff') handleDropOff(command.lockerId, command.orderId);
		if (command?.kind === 'reset') handleReset(command.lockerId);
	};

	return (
		<PageWrapper name='Gestión de Casilleros' title='Gestión de Casilleros'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex flex-col items-start'>
						<div className='flex flex-row items-center gap-3'>
							<Icon icon='DuoLockClosed' className='text-4xl' />
							<Badge className='text-2xl font-bold'>Gestión de Casilleros</Badge>
						</div>
						<p className='mt-1 text-sm text-gray-500'>
							Panel de control interno — Flujo Lock Care
						</p>
					</div>
				</SubheaderLeft>
			</Subheader>

			<Container className='w-full'>
				<Tabs activeTab={activeTab} onTabChange={setActiveTab} variant='pills'>
					<Tab id='casilleros' text='Casilleros' icon='HeroCube'>
						<div className='mt-4'>
							<LockersDashboardTab
								locations={locations}
								selectedLocationId={selectedLocationId}
								lockers={lockers}
								serviceOrders={serviceOrders}
								isLoading={isLoading}
								error={error}
								changeLocation={changeLocation}
								fetchLockers={fetchLockers}
								openAction={openAction}
								subsidiaryId={selectedSubsidiaryId}
								setDetailLocker={setDetailLocker}
								setIsScanning={setIsScanning}
							/>
						</div>
					</Tab>
					<Tab id='ordenes' text='Órdenes de Servicio' icon='HeroWrenchScrewdriver'>
						<div className='mt-4'>
							<OrdersTechnicianTab
								lockers={lockers}
								serviceOrders={serviceOrders}
								openAction={openAction}
								subsidiaryId={selectedSubsidiaryId}
							/>
						</div>
					</Tab>
				</Tabs>
			</Container>

			{/* Modales Extraídos */}
			<DetailLockerModal
				isOpen={!!detailLocker}
				detailLocker={detailLocker}
				onClose={() => setDetailLocker(null)}
				serviceOrders={serviceOrders}
			/>

			<LockerActionModal
				isOpen={!!actionType && !!selectedLocker}
				actionType={actionType}
				selectedLocker={selectedLocker}
				serviceOrders={serviceOrders}
				lockers={lockers}
				isActionLoading={isActionLoading}
				initialOrderId={selectedOrderId}
				subsidiaryId={selectedSubsidiaryId}
				onClose={closeAction}
				onSubmit={handleActionSubmit}
			/>

			<SuccessPinModal
				isOpen={!!successPin}
				successPin={successPin}
				successMessage={successMessage}
				onClose={() => setSuccessPin(null)}
			/>

			<QRScannerModal isOpen={isScanning} setIsOpen={setIsScanning} onScan={handleScanQR} />
		</PageWrapper>
	);
};

export default LockersManagementView;
