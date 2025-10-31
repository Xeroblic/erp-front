import React from 'react';
import { useAppSelector } from '@/store';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import type { ICategoryStats } from '@/interface/category.interface';

type CategoryStatsProps = {
  stats: ICategoryStats;
};

const CategoryStats: React.FC<CategoryStatsProps> = ({ stats }) => {
  const noProducts = useAppSelector(
    (s) => (s.categories?.items ?? []).filter((c: any) => (c?.products_count ?? 0) === 0).length,
  );

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardBody className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20">
            <Icon icon="HeroSquares2X2" className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total categorias</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_categories}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <Icon icon="HeroPauseCircle" className="h-6 w-6 text-amber-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactivas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{noProducts}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
            <Icon icon="HeroCube" className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productos asociados</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.products_total}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CategoryStats;
