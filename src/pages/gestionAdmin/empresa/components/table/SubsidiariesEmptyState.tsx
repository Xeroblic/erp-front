import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface SubsidiariesEmptyStateProps {
	onCreate: () => void;
}

export default function SubsidiariesEmptyState({ onCreate }: SubsidiariesEmptyStateProps) {
	return (
		<div className='flex flex-col items-center justify-center py-12 text-center'>
			<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
				<Icon icon='HeroBuildingStorefront' className='text-2xl text-zinc-400' />
			</div>
			<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
				No hay subempresas registradas
			</h3>
			<p className='mb-4 max-w-sm text-sm text-zinc-500'>
				Comienza agregando tu primera subempresa para organizar mejor tu estructura
				empresarial.
			</p>
			<Button variant='solid' icon='HeroPlus' onClick={onCreate} size='sm'>
				Crear Primera Subempresa
			</Button>
		</div>
	);
}
