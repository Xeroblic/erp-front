import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ICustomerSale } from '@/interface/customerSales.interface';
import classNames from 'classnames';

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
	const scopeRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const ctx = gsap.context(() => {
			gsap.from('.header-animate', {
				x: -30,
				opacity: 0,
				duration: 0.8,
				stagger: 0.1,
				ease: 'expo.out'
			});

			gsap.from('.button-animate', {
				x: 30,
				opacity: 0,
				duration: 0.8,
				stagger: 0.1,
				ease: 'expo.out',
				delay: 0.2
			});
		}, scopeRef);
		return () => ctx.revert();
	}, []);

	return (
		<div ref={scopeRef}>
			<Subheader>
				<SubheaderLeft>
					<div className='flex flex-col space-y-1'>
						<div className='header-animate'>
							<Badge className='text-3xl font-bold tracking-tight'>
								{client.billing_company || contactName}
							</Badge>
						</div>

						<div className='flex flex-wrap items-center gap-3 text-sm header-animate'>
							<Badge className='px-2' variant='outline' color='sky'>ID Cliente: {client.id}</Badge>
							<Badge className={classNames('px-2')} variant='outline' color='blue'>
								{client.type === 'company' ? 'Empresa' : 'Persona Natural'}
							</Badge>
						</div>
					</div>
				</SubheaderLeft>

				<SubheaderRight className='flex flex-wrap gap-3'>
					<div className='button-animate'>
						<Button variant='outline' onClick={onBack}>
							Volver
						</Button>
					</div>

					{isEditable ? (
						<>
							<div className='button-animate'>
								<Button variant='outline' onClick={onCancelEdit} disabled={isSubmitting}>
									Cancelar
								</Button>
							</div>
							<div className='button-animate'>
								<Button
									variant='solid'
									type='button'
									onClick={onSave}
									isLoading={isSubmitting}>
									Guardar cambios
								</Button>
							</div>
						</>
					) : (
						<div className='button-animate'>
							<Button variant='solid' onClick={onEditToggle}>
								Editar
							</Button>
						</div>
					)}
				</SubheaderRight>
			</Subheader>
		</div>
	);
};

export default ClientDetailHeader;
