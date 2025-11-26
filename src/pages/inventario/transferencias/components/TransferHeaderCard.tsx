import React from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';

interface TransferHeaderCardProps {
	onNavigateHistory: () => void;
	onNavigateInventory?: () => void;
	inventoryDisabled?: boolean;
}

const TransferHeaderCard: React.FC<TransferHeaderCardProps> = ({
	onNavigateHistory,
	onNavigateInventory,
	inventoryDisabled,
}) => (
	<Subheader>
		<SubheaderLeft>
			<div>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroTruck' size='text-3xl' />
					<Badge className='text-3xl font-bold'>Nueva Transferencia</Badge>
				</div>
				<div className='flex flex-col gap-2'>
					<p className='text-sm text-zinc-400 mt-1'>
						Transferir productos entre bodegas de forma rápida y segura
					</p>
				</div>
			</div>
		</SubheaderLeft>
		<SubheaderRight>
			<div className='flex justify-center gap-3'>
				<Button
					variant='outline'
					color='gray'
					icon='HeroClockIcon'
					onClick={onNavigateHistory}>
					Ver Historial
				</Button>
				<Button
					variant='outline'
					color='gray'
					icon='HeroDocumentTextIcon'
					onClick={onNavigateInventory}
					isDisable={!onNavigateInventory || inventoryDisabled}>
					Ver Inventario
				</Button>
			</div>
		</SubheaderRight>
	</Subheader>
);

export default TransferHeaderCard;
