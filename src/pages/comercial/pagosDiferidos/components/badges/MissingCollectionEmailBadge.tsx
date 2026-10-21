import React from 'react';
import Icon from '@/components/icon/Icon';
import { MISSING_COLLECTION_EMAIL_MESSAGE } from '../parts/MissingCollectionEmailAlert';

/** Indicador de fila para los listados de Pagos diferidos y Cartera de crédito. */
const MissingCollectionEmailBadge: React.FC = () => (
	<p
		className='mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400'
		title={MISSING_COLLECTION_EMAIL_MESSAGE}>
		<Icon icon='HeroEnvelope' size='text-sm' className='shrink-0' />
		Sin correo de cobranza
		<span className='sr-only'>: {MISSING_COLLECTION_EMAIL_MESSAGE}</span>
	</p>
);

export default MissingCollectionEmailBadge;
