import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import useTransferWarehouses from '@/pages/inventario/abastecimiento/AjustesTraslados/hooks/useTransferWarehouses';
import TransferPanel from '@/pages/inventario/abastecimiento/AjustesTraslados/components/transfer/TransferPanel';
import type { TransferPanelProps } from '@/pages/inventario/abastecimiento/AjustesTraslados/components/transfer/TransferPanel';

export type TransferTabProps = Omit<TransferPanelProps, 'warehouses'>;

/**
 * Pestaña «Traslados internos»: carga las bodegas de la sucursal y recién
 * entonces monta el asistente, que resuelve contra ellas la preselección de la
 * URL al montar.
 */
const TransferTab = ({ branchId, owner, preselection, onBusyChange }: TransferTabProps) => {
	const { state, retry } = useTransferWarehouses(branchId);

	if (state.status === 'loading')
		return (
			<p role='status' className='text-sm text-zinc-600 dark:text-zinc-300'>
				Cargando las bodegas de la sucursal…
			</p>
		);

	if (state.status === 'error')
		return (
			<Alert color='red' title='No pudimos cargar las bodegas'>
				<div className='space-y-2'>
					<p role='alert'>{state.message}</p>
					<Button
						type='button'
						variant='outline'
						color='red'
						size='sm'
						icon='HeroArrowPath'
						onClick={retry}>
						Reintentar
					</Button>
				</div>
			</Alert>
		);

	return (
		<TransferPanel
			branchId={branchId}
			owner={owner}
			warehouses={state.warehouses}
			preselection={preselection}
			onBusyChange={onBusyChange}
		/>
	);
};

export default TransferTab;
