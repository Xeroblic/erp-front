import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import type { IProduct } from '@/interface/product.interface';

interface ActionsCellProps {
	product: IProduct;
	isAdmin: boolean;
	subsidiaryId?: number | null;
	isUpdating: boolean;
	onToggleStatus: (product: IProduct) => void;
	onView?: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
}

const ActionsCell: React.FC<ActionsCellProps> = ({
	product,
	isAdmin,
	subsidiaryId,
	isUpdating,
	onToggleStatus,
	onView,
	onDelete,
}) => {
	const canQuickToggle = isAdmin && Boolean(subsidiaryId);

	return (
		<div className='flex items-center justify-end gap-2'>
			<PermissionGuard role={['admin', 'company-admin', 'subsidiary-admin', 'branch-admin']}>
				<Tooltip text={product.is_active ? 'Desactivar' : 'Activar'}>
					<Button
						variant='outline'
						size='sm'
						color={product.is_active ? 'amber' : 'emerald'}
						onClick={(event) => {
							event.stopPropagation();
							onToggleStatus(product);
						}}
						isLoading={isUpdating}
						isDisable={!canQuickToggle}>
						<Icon
							color={product.is_active ? 'amber' : 'emerald'}
							icon={product.is_active ? 'HeroPauseCircle' : 'HeroPlayCircle'}
							className='text-2xl'
						/>
					</Button>
				</Tooltip>
			</PermissionGuard>
			{onView && (
				<Tooltip text='Ver detalle'>
					<Button
						variant='outline'
						size='sm'
						color='violet'
						onClick={(event) => {
							event.stopPropagation();
							onView(product);
						}}
						className='inline-flex'>
						<Icon icon='HeroEye' color='violet' className='text-2xl' />
					</Button>
				</Tooltip>
			)}
			<Tooltip text='Eliminar'>
				<Button
					variant='outline'
					color='red'
					size='sm'
					onClick={(event) => {
						event.stopPropagation();
						onDelete(product);
					}}>
					<Icon icon='HeroTrash' color='red' className='text-2xl' />
				</Button>
			</Tooltip>
		</div>
	);
};

export default ActionsCell;
