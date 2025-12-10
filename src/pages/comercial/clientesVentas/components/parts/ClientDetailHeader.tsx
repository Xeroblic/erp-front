import React from 'react';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ICustomerSale } from '@/interface/customerSales.interface';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';

interface ClientDetailHeaderProps {
	client: ICustomerSale;
	contactName: string;
	onBack: () => void;
	onEditToggle: () => void;
	onCancelEdit: () => void;
	onSave: () => void;
	isEditable: boolean;
	isSubmitting: boolean;
}

const ClientDetailHeader: React.FC<ClientDetailHeaderProps> = ({
	client,
	contactName,
	onBack,
	onEditToggle,
	onCancelEdit,
	onSave,
	isEditable,
	isSubmitting,
}) => {
	return (
		<Subheader>
			<SubheaderLeft>
				<div className='flex flex-col space-y-1'>
					<Badge  className='text-3xl font-bold tracking-tight'>
						{client.billing_company || contactName}
					</Badge>

					<div className='flex flex-wrap items-center gap-3 text-sm'>
						<Badge className='px-2' variant='outline' color='sky'>ID Cliente: {client.id}</Badge>

						{/* <Badge color={client.is_active ? 'green' : 'red'} variant='solid'>
							{client.is_active ? 'Activo' : 'Inactivo'}
						</Badge> */}

						<Badge className={classNames('px-2')} variant='outline' color='blue'>
							{client.type === 'company' ? 'Empresa' : 'Persona Natural'}
						</Badge>
					</div>
				</div>
			</SubheaderLeft>

			<SubheaderRight className='flex flex-wrap gap-3'>
				<Button variant='outline' onClick={onBack}>
					Volver
				</Button>

				{isEditable ? (
					<>
						<Button variant='outline' onClick={onCancelEdit} disabled={isSubmitting}>
							Cancelar
						</Button>
						<Button
							variant='solid'
							type='button'
							onClick={onSave}
							isLoading={isSubmitting}>
							Guardar cambios
						</Button>
					</>
				) : (
					<Button variant='solid' onClick={onEditToggle}>
						Editar
					</Button>
				)}
			</SubheaderRight>
		</Subheader>
	);
};

export default ClientDetailHeader;
