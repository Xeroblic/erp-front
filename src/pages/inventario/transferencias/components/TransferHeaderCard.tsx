import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
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
			<div className='flex items-center gap-2'>
				<Icon icon='HeroTruck' size='text-3xl' />
				<div className='flex flex-col '>
					<Badge className='text-3xl font-bold'>
						Nueva Transferencia
					</Badge>
					
				</div>
			</div>
		</SubheaderLeft>
		<CardBody>
			<div className='text-center'>
				<p className='mb-4 text-zinc-500'>
					Transferir productos entre bodegas de forma rápida y segura
				</p>
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
			</div>
		</CardBody>
	</Subheader>
);

export default TransferHeaderCard;
