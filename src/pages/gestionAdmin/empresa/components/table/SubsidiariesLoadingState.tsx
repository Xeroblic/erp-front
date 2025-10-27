import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';

export default function SubsidiariesLoadingState() {
	return (
		<Card>
			<CardBody>
				<div className='flex items-center justify-center py-12'>
					<div className='flex items-center gap-3'>
						<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent'></div>
						<span className='text-zinc-600'>Cargando subempresas...</span>
					</div>
				</div>
			</CardBody>
		</Card>
	);
}
