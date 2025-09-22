import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import { IBrandStats } from './types';
import BrandRating from './BrandRating';
import { formatCurrency } from './utils';

type BrandStatsProps = {
  stats: IBrandStats;
};

const BrandStats: React.FC<BrandStatsProps> = ({ stats }) => (
  <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
    <Card>
      <CardBody className='flex items-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20'>
          <Icon icon='HeroTag' className='h-6 w-6 text-violet-600' />
        </div>
        <div className='ml-4'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Marcas</p>
          <p className='text-2xl font-bold text-gray-900 dark:text-white'>{stats.total_brands}</p>
        </div>
      </CardBody>
    </Card>

    <Card>
      <CardBody className='flex items-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20'>
          <Icon icon='HeroCheckCircle' className='h-6 w-6 text-emerald-600' />
        </div>
        <div className='ml-4'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Marcas Activas</p>
          <p className='text-2xl font-bold text-gray-900 dark:text-white'>{stats.active_brands}</p>
        </div>
      </CardBody>
    </Card>

    <Card>
      <CardBody className='flex items-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20'>
          <Icon icon='HeroStar' className='h-6 w-6 text-amber-600' />
        </div>
        <div className='ml-4'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Calidad Promedio</p>
          <div className='flex items-center space-x-2'>
            <p className='text-2xl font-bold text-gray-900 dark:text-white'>{stats.avg_quality_rating}/5.0</p>
            <BrandRating value={stats.avg_quality_rating} />
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
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Ventas Totales</p>
          <p className='text-lg font-bold text-gray-900 dark:text-white'>{formatCurrency(stats.total_sales)}</p>
        </div>
      </CardBody>
    </Card>
  </div>
);

export default BrandStats;