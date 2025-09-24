import Badge from '@/components/ui/Badge';
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineXCircle } from 'react-icons/hi2';
import { WooConfig } from '../../types/wooSync.types';

export default function Header({ wooConfig }: { wooConfig: WooConfig }) {
  const statusMap = {
    connected: { color: 'emerald' as const, text: 'Conectado', Icon: HiOutlineCheckCircle },
    disconnected: { color: 'gray' as const, text: 'Desconectado', Icon: HiOutlineXCircle },
    error: { color: 'red' as const, text: 'Error', Icon: HiOutlineExclamationTriangle },
  }[wooConfig.status];

  return (
    <div className='flex items-center justify-between py-4'>
      <div>
        <h1 className='text-3xl font-semibold'>Sincronización WooCommerce</h1>
        <p className='text-zinc-500'>Gestión de sincronización de stock con WooCommerce</p>
      </div>
      <div className='flex items-center space-x-4'>
        <Badge color={statusMap.color}>
          <statusMap.Icon className='mr-1 inline h-4 w-4' /> {statusMap.text}
        </Badge>
        <span className='text-sm text-gray-600'>{wooConfig.site_url}</span>
      </div>
    </div>
  );
}
