import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import { IDocumentStats } from '../types/documentos.types';
import { formatFileSize } from './utils';

type DocumentStatsProps = {
  stats: IDocumentStats | null;
};

const DocumentStats: React.FC<DocumentStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardBody className='flex items-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
            <Icon icon='HeroDocumentText' className='h-6 w-6 text-blue-600' />
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium '>Total documentos</p>
            <p className='text-2xl font-semibold text-red-500'>{stats.total_documents}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className='flex items-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100'>
            <Icon icon='HeroCheckCircle' className='h-6 w-6 text-emerald-600' />
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium '>Documentos activos</p>
            <p className='text-2xl font-semibold text-orange-500'>{stats.active_documents}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className='flex items-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100'>
            <Icon icon='HeroServerStack' className='h-6 w-6 text-violet-600' />
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium '>Tamaño total</p>
            <p className='text-2xl font-semibold text-violet-500'>{formatFileSize(stats.total_size)}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className='flex items-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100'>
            <Icon icon='HeroCloudArrowUp' className='h-6 w-6 text-amber-600' />
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium '>Subidas recientes</p>
            <p className='text-2xl font-semibold text-amber-500 '>{stats.recent_uploads}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DocumentStats;
