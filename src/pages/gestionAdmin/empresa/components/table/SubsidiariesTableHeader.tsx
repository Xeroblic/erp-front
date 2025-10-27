import React from 'react';
import { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface SubsidiariesTableHeaderProps {
	subsidiariesCount: number;
	onRefresh: () => void;
	onCreate: () => void;
}

export default function SubsidiariesTableHeader({
	subsidiariesCount,
	onRefresh,
	onCreate,
}: SubsidiariesTableHeaderProps) {
	return (
		<CardHeader className='flex flex-row items-center justify-between'>
			<div className='flex items-center gap-2'>
				<Icon icon='HeroBuildingStorefront' className='text-xl' />
				<div>
					<h3 className='font-semibold'>Subempresas</h3>
					<p className='text-sm text-zinc-500'>
						{subsidiariesCount} subempresa{subsidiariesCount !== 1 ? 's' : ''}{' '}
						registrada
						{subsidiariesCount !== 1 ? 's' : ''}
					</p>
				</div>
			</div>
			<div className='flex gap-2'>
				<Button variant='outline' icon='HeroArrowPath' onClick={onRefresh} size='sm'>
					Actualizar
				</Button>
				<Button variant='solid' icon='HeroPlus' onClick={onCreate} size='sm'>
					Nueva Subempresa
				</Button>
			</div>
		</CardHeader>
	);
}
