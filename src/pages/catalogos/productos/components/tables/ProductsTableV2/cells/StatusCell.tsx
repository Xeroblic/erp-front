import React from 'react';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import type { IProduct } from '@/interface/product.interface';

const StatusCell: React.FC<{ product: IProduct }> = ({ product }) => (
	<div className='flex flex-col gap-1.5'>
		<Badge variant='outline' color={product.is_active ? 'emerald' : 'zinc'}>
			{product.is_active ? 'Activo' : 'Inactivo'}
		</Badge>
		{product.serial_tracking && (
			<span className='inline-flex items-center gap-1 text-xs text-neutral-500'>
				<Icon icon='HeroClipboardDocumentCheck' className='h-3.5 w-3.5' />
				Seguimiento serie
			</span>
		)}
		{/* Garantía: si es 0 o null mostrar "Sin garantía" en rojo */}
		{product.warranty_months && product.warranty_months > 0 ? (
			<span className='inline-flex items-center gap-1 text-xs text-neutral-500'>
				<Icon icon='HeroShieldCheck' className='h-3.5 w-3.5' />
				{product.warranty_months} meses
			</span>
		) : (
			<span className='inline-flex items-center gap-1 text-xs font-medium text-red-500'>
				<Icon icon='HeroShieldCheck' className='h-3.5 w-3.5 text-red-400' />
				Sin garantía
			</span>
		)}
	</div>
);

export default StatusCell;
