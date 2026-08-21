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

// ─────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────
interface ILockersManagementViewProps {
	locations: ILockerLocation[];
	selectedLocationId: number | null;
	lockers: ILockerInternal[];
	serviceOrders: IServiceOrder[];
	isLoading: boolean;
	error: string | null;
	selectedLocker: ILockerInternal | null;
	actionType: 'withdraw' | 'dropoff' | 'reset' | 'ready' | null;
	isActionLoading: boolean;
	successPin: string | null;
	successMessage: string | null;
	selectedOrderId: number | null;
	// Acciones
	setSelectedLocker: (locker: ILockerInternal | null) => void;
	setSuccessPin: (pin: string | null) => void;
	changeLocation: (locationId: number) => void;
	fetchLockers: () => void;
	fetchServiceOrders: () => void;
	openAction: (
		locker: ILockerInternal,
		type: 'withdraw' | 'dropoff' | 'reset' | 'ready',
		orderId?: number,
	) => void;
	closeAction: () => void;
	handleWithdraw: (serviceOrderId: number) => void;
	handleDropOff: (serviceOrderId: number) => void;
	handleReset: () => void;
	handleSetReadyForPickup: (serviceOrderId: number, pinManual: string) => void;
	handleScanQR: (token: string) => Promise<boolean>;
}

// ─────────────────────────────────────────────────
// Componente View
// ─────────────────────────────────────────────────
const LockersManagementView: React.FC<ILockersManagementViewProps> = ({
	locations,
	selectedLocationId,
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
	handleSetReadyForPickup,
	handleScanQR,
	setSelectedLocker,
}) => {
	// --- Estado local para los modales y UI extra ---
	const [detailLocker, setDetailLocker] = useState<ILockerInternal | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [activeTab, setActiveTab] = useState<string>('casilleros');

	const handleActionSubmit = (data: {
		orderId: number | null;
		pinManual: string;
		actionLocker: ILockerInternal | null;
	}) => {
		if (data.actionLocker && data.actionLocker.id !== selectedLocker?.id) {
			setSelectedLocker(data.actionLocker);
		}

		if (actionType === 'withdraw' && data.orderId) {
			handleWithdraw(data.orderId);
		} else if (actionType === 'dropoff' && data.orderId) {
			handleDropOff(data.orderId);
		} else if (actionType === 'reset') {
			handleReset();
		} else if (actionType === 'ready' && data.orderId && data.pinManual) {
			handleSetReadyForPickup(data.orderId, data.pinManual);
		}
		closeAction();
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
