import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { ILockerInternal, IServiceOrder } from '@/interface/lockers.interface';
import { getAvailableActions } from '../types';
import { toast } from '@/utils/toast.utils';

interface IOrdersTechnicianTabProps {
    lockers: ILockerInternal[];
    serviceOrders: IServiceOrder[];
    openAction: (locker: ILockerInternal, type: 'withdraw' | 'dropoff' | 'reset' | 'ready', orderId?: number) => void;
}

const OrdersTechnicianTab: React.FC<IOrdersTechnicianTabProps> = ({
    lockers,
    serviceOrders,
    openAction,
}) => {
    // 1. Equipos para Retirar (Lockers ocupados esperando al técnico)
    const lockersToWithdraw = lockers.filter((locker) =>
        getAvailableActions(locker.status).includes('withdraw')
    );

    // 2. Equipos para Depositar (Órdenes reparadas que deben meterse al casillero)
    // Filtramos órdenes en estados que sugieren envío al locker, pero que NO estén físicamente adentro de uno.
    const ordersToDropoff = serviceOrders.filter((order) => {
        const status = order.logistics_status?.toLowerCase() || '';
        const isValidStatus = ['checked_in', 'in_progress', 'entregado_tecnico'].includes(status);
        
        if (!isValidStatus) return false;

        // Si la orden tiene un locker_id, verificamos si ESE casillero está ocupado.
        // Si el casillero está 'available', significa que el técnico tiene el equipo en la mano.
        if (order.locker_id) {
            const assignedLocker = lockers.find((l) => l.id === order.locker_id);
            if (assignedLocker && assignedLocker.status !== 'available' && assignedLocker.status !== 'Disponible') {
                return false; // El equipo sigue adentro del casillero, no se puede depositar
            }
        }

        return true;
    });

    const handleOpenDropoff = (order: IServiceOrder) => {
        // Para depositar, asignamos automáticamente el primer casillero "available" en el modal.
        const availableLocker = lockers.find((l) => l.status === 'available');
        if (!availableLocker) {
            toast.error('No hay casilleros disponibles para realizar el depósito.');
            return;
        }
        openAction(availableLocker, 'dropoff', order.id);
    };

    return (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Columna: Retirar */}
            <div className='space-y-4'>
                <div className='flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-700'>
                    <div className='bg-blue-100 text-blue-600 p-2 rounded-xl dark:bg-blue-900/30 dark:text-blue-400'>
                        <Icon icon='HeroArrowDownTray' className='h-6 w-6' />
                    </div>
                    <div>
                        <h2 className='text-lg font-bold text-zinc-800 dark:text-zinc-100'>Equipos para Retirar</h2>
                        <p className='text-xs text-zinc-500'>Equipos que el cliente dejó en el casillero</p>
                    </div>
                </div>

                {lockersToWithdraw.length === 0 ? (
                    <div className='text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 dark:bg-zinc-800/50 dark:border-zinc-700'>
                        <Icon icon='HeroCheckCircle' className='h-12 w-12 text-zinc-300 mx-auto mb-3' />
                        <p className='text-zinc-500 font-medium'>No hay equipos pendientes de retiro.</p>
                    </div>
                ) : (
                    lockersToWithdraw.map((locker) => {
                        const order = locker.active_service_order || serviceOrders.find((o) => o.locker_id === locker.id);
                        return (
                            <Card key={locker.id} className='border-l-4 border-l-blue-500 hover:shadow-md transition-shadow'>
                                <CardBody className='p-5'>
                                    <div className='flex justify-between items-start mb-4'>
                                        <div>
                                            <Badge color='blue' variant='solid' className='mb-2 text-xs font-bold'>
                                                Casillero Nº {locker.locker_number || locker.number || locker.id}
                                            </Badge>
                                            <h3 className='font-bold text-lg text-zinc-800 dark:text-zinc-100 uppercase'>
                                                {order?.customer_name || locker.customer_name || 'Cliente sin registrar'}
                                            </h3>
                                        </div>
                                        <div className='text-right'>
                                            <p className='text-xs text-zinc-400 font-mono'>
                                                {locker.check_in_at ? new Date(locker.check_in_at).toLocaleDateString('es-CL') : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className='bg-zinc-50 rounded-lg p-3 mb-5 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700'>
                                        <p className='text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center'>
                                            <Icon icon='HeroDevicePhoneMobile' className='h-4 w-4 inline mr-2 text-zinc-400' />
                                            <span className='truncate'>
                                                {order?.device_brand && order?.device_model
                                                    ? `${order.device_brand} ${order.device_model}`
                                                    : locker.device_description || 'Equipo sin registrar'}
                                            </span>
                                        </p>
                                    </div>

                                    <Button
                                        color='blue'
                                        variant='solid'
                                        className='w-full h-12 text-sm font-bold uppercase tracking-wide'
                                        icon='HeroArrowDownTray'
                                        onClick={() => openAction(locker, 'withdraw', order?.id)}
                                    >
                                        Iniciar Retiro
                                    </Button>
                                </CardBody>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Columna: Depositar */}
            <div className='space-y-4'>
                <div className='flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-700'>
                    <div className='bg-emerald-100 text-emerald-600 p-2 rounded-xl dark:bg-emerald-900/30 dark:text-emerald-400'>
                        <Icon icon='HeroArrowUpTray' className='h-6 w-6' />
                    </div>
                    <div>
                        <h2 className='text-lg font-bold text-zinc-800 dark:text-zinc-100'>Equipos para Depositar</h2>
                        <p className='text-xs text-zinc-500'>Equipos listos para que el cliente retire</p>
                    </div>
                </div>

                {ordersToDropoff.length === 0 ? (
                    <div className='text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 dark:bg-zinc-800/50 dark:border-zinc-700'>
                        <Icon icon='HeroCheckCircle' className='h-12 w-12 text-zinc-300 mx-auto mb-3' />
                        <p className='text-zinc-500 font-medium'>No hay órdenes listas para depositar.</p>
                    </div>
                ) : (
                    ordersToDropoff.map((order) => (
                        <Card key={order.id} className='border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow'>
                            <CardBody className='p-5'>
                                <div className='flex justify-between items-start mb-4'>
                                    <div>
                                        <Badge color='emerald' variant='solid' className='mb-2 text-xs font-bold'>
                                            Orden #{order.id}
                                        </Badge>
                                        <h3 className='font-bold text-lg text-zinc-800 dark:text-zinc-100 uppercase'>
                                            {order.customer_name || 'Sin Cliente'}
                                        </h3>
                                    </div>
                                    <div className='text-right'>
                                        <Badge variant='outline' color='zinc' className='text-[10px] uppercase font-bold'>
                                            {order.logistics_status_label || order.logistics_status || 'Sin Estado'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className='bg-zinc-50 rounded-lg p-3 mb-5 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700'>
                                    <p className='text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center'>
                                        <Icon icon='HeroWrench' className='h-4 w-4 inline mr-2 text-zinc-400' />
                                        <span className='truncate'>
                                            {order.device_brand && order.device_model
                                                ? `${order.device_brand} ${order.device_model}`
                                                : order.device_description || 'Sin información de equipo'}
                                        </span>
                                    </p>
                                </div>

                                <Button
                                    color='emerald'
                                    variant='solid'
                                    className='w-full h-12 text-sm font-bold uppercase tracking-wide'
                                    icon='HeroArrowUpTray'
                                    onClick={() => handleOpenDropoff(order)}
                                >
                                    Iniciar Depósito
                                </Button>
                            </CardBody>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default OrdersTechnicianTab;
