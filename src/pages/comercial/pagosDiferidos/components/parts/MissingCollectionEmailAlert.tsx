import React from 'react';
import Alert from '@/components/ui/Alert';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';

export const MISSING_COLLECTION_EMAIL_MESSAGE =
	'Este cliente no recibirá los recordatorios automáticos de cobranza hasta que se registre un correo de cobranza en su perfil de crédito.';

interface IMissingCollectionEmailAlertProps {
	id?: string;
	subsidiaryId: number | null;
	/** Sin callback no se ofrece el acceso directo (p. ej. cuando ya se está editando el correo). */
	onAddEmail?: () => void;
	actionLabel?: string;
	className?: string;
}

/**
 * Advertencia no bloqueante: el documento o perfil se puede guardar igual, sólo se avisa de
 * que los recordatorios al cliente no van a salir.
 */
const MissingCollectionEmailAlert: React.FC<IMissingCollectionEmailAlertProps> = ({
	id,
	subsidiaryId,
	onAddEmail,
	actionLabel = 'Agregar correo de cobranza',
	className,
}) => (
	<Alert
		color='amber'
		variant='outline'
		icon='HeroEnvelope'
		title='Sin correo de cobranza'
		id={id}
		className={className}>
		<div className='space-y-3'>
			<p>{MISSING_COLLECTION_EMAIL_MESSAGE}</p>
			{onAddEmail && (
				<ProtectedButton
					permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
					subsidiaryId={subsidiaryId}
					scope='access'
					type='button'
					size='sm'
					variant='outline'
					color='amber'
					icon='HeroPencilSquare'
					onClick={onAddEmail}>
					{actionLabel}
				</ProtectedButton>
			)}
		</div>
	</Alert>
);

export default MissingCollectionEmailAlert;
