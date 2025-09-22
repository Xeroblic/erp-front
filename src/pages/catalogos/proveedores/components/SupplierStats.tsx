import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ISupplierStats } from './types';
import SupplierRating from './SupplierRating';
import { formatCurrency } from './utils';

type SupplierStatsProps = {
  stats: ISupplierStats;
};

const SupplierStats: React.FC<SupplierStatsProps> = ({ stats }) => (
  <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
    <Card>
      <CardBody className='flex items-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
          <Icon icon='HeroTruck' className='h-6 w-6 text-orange-600' />
        </div>
        <div className='ml-4'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Proveedores</p>
          <p className='text-2xl font-bold text-gray-900 dark:text-white'>{stats.total_suppliers}</p>
        </div>
      </CardBody>
    </Card>

    <Card>
      <CardBody className='flex items-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20'>
          <Icon icon='HeroCheckCircle' className='h-6 w-6 text-emerald-600' />
        </div>
        <div className='ml-4'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Activos</p>
          <div className='flex items-center space-x-2'>
            <p className='text-2xl font-bold text-gray-900 dark:text-white'>{stats.active_suppliers}</p>
            {stats.total_suppliers > 0 && (
              <Badge color='emerald'>
                {Math.round((stats.active_suppliers / stats.total_suppliers) * 100)}%
              </Badge>
            )}
          </div>
        </div>
      </CardBody>
    </Card>

    <Card>
      <CardBody className='flex items-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20'>
          <Icon icon='HeroStar' className='h-6 w-6 text-yellow-600' />
        </div>
        <div className='ml-4'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Rating Promedio</p>
          <div className='flex items-center space-x-2'>
            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
              {stats.avg_rating.toFixed(1)}
            </p>
            <SupplierRating value={Math.round(stats.avg_rating)} />
          </div>
        </div>
      </CardBody>
    </Card>

    <Card>
      <CardBody className='flex items-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
          <Icon icon='HeroCurrencyDollar' className='h-6 w-6 text-green-600' />
        </div>
        <div className='ml-4'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Compras Totales</p>
          <p className='text-lg font-bold text-gray-900 dark:text-white'>
            {formatCurrency(stats.total_purchases)}
          </p>
        </div>
      </CardBody>
    </Card>
  </div>
);

export default SupplierStats;