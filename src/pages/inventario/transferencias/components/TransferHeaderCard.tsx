import React from 'react';
import Button from '@/components/ui/Button';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';

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
			<SubheaderTitle
				icon='HeroTruck'
				title='Nueva Transferencia'
				description='Transferir productos entre bodegas de forma rápida y segura'
			/>
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
