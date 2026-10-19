import React from 'react';
import Alert from '@/components/ui/Alert';
import { getMissingInvoicingFields } from '../../types';
import type { ISupplierFormValues } from '../../types';

/**
 * Aviso de completitud (sección 5 del contrato): giro y ambas direcciones
 * hacen falta para **confirmar una factura**, no para guardar el proveedor.
 * Se advierte sin bloquear el guardado — por eso vive fuera del schema de
 * Yup, que sólo exige RUT y razón social/contacto.
 */

interface ISupplierCompletenessNoticeProps {
	values: ISupplierFormValues;
}

const SupplierCompletenessNotice: React.FC<ISupplierCompletenessNoticeProps> = ({ values }) => {
	const missing = getMissingInvoicingFields(values);
	if (missing.length === 0) return null;

	return (
		<Alert color='blue' variant='outline' icon='HeroInformationCircle'>
			Para confirmar una factura falta: {missing.join(', ')}. El proveedor se guarda igual.
		</Alert>
	);
};

export default SupplierCompletenessNotice;
