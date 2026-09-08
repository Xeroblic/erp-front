import React from 'react';
import Alert from '@/components/ui/Alert';
import { isIncompleteForInvoicing } from '../../types';
import type { IProveedorFormValues } from '../../types';

/**
 * Aviso de completitud (sección 5 del contrato): giro y ambas direcciones
 * hacen falta para **confirmar una factura**, no para guardar el proveedor.
 * Se advierte sin bloquear el guardado — por eso vive fuera del schema de
 * Yup, que sólo exige RUT y razón social/contacto.
 */

interface ISupplierCompletenessNoticeProps {
	values: IProveedorFormValues;
}

const SupplierCompletenessNotice: React.FC<ISupplierCompletenessNoticeProps> = ({ values }) => {
	if (!isIncompleteForInvoicing(values)) return null;

	return (
		<Alert color='blue' variant='outline' icon='HeroInformationCircle'>
			Falta giro y/o alguna dirección. El proveedor se guarda igual — sólo hacen falta para
			confirmar una factura.
		</Alert>
	);
};

export default SupplierCompletenessNotice;
