import React, { useEffect, useRef } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import gsap from 'gsap';
import { getCustomerInfo } from '../quote-data-mapper';

export const ConfirmSaleModal = ({ open, onClose, onConfirm, quotationId, quotation }: any) => {
	const boxRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open && boxRef.current) {
			gsap.fromTo(
				boxRef.current,
				{ y: 20, opacity: 0 },
				{ y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' },
			);
		}
	}, [open]);

	if (!quotation) return null;

	const customerInfo = getCustomerInfo((quotation as any)?.customer, {
		billingSnapshot: (quotation as any)?.billing_snapshot,
		shippingSnapshot: (quotation as any)?.shipping_snapshot,
	});

	const missingFields = [];

	if (customerInfo.name === 'Cliente General') {
		missingFields.push('Cliente no asignado');
	} else {
		const isMissing = (val: string | null | undefined) => {
			if (!val) return true;
			const clean = val.trim().toUpperCase();
			return clean === '' || clean === '—' || clean === '-' || clean === 'N/A';
		};

		if (isMissing(customerInfo.rut)) missingFields.push('RUT');
		if (isMissing(customerInfo.phone)) missingFields.push('Teléfono');
		if (isMissing(customerInfo.email)) missingFields.push('Correo Electrónico');
		if (isMissing(customerInfo.address)) missingFields.push('Dirección');
		if (isMissing(customerInfo.comuna)) missingFields.push('Comuna');
	}

	const hasMissingData = missingFields.length > 0;

	return (
		<Modal isOpen={open} setIsOpen={onClose} isCentered isAnimation>
			<ModalHeader>
				<h2
					className={`flex items-center gap-2 text-lg font-bold ${hasMissingData ? 'text-amber-600' : 'text-emerald-600'}`}>
					<Icon
						icon={hasMissingData ? 'DuoWarning1Circle' : 'DuoCheckBadge'}
						size='text-2xl'
					/>
					{hasMissingData ? 'Atención Requerida' : 'Confirmar Venta'}
				</h2>
			</ModalHeader>
			<ModalBody className='p-6'>
				<div
					ref={boxRef}
					className={`flex gap-4 rounded-xl border p-5 ${hasMissingData ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-500/10' : 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10'}`}>
					<Icon
						icon={hasMissingData ? 'DuoDanger' : 'DuoInfoBlank'}
						size='text-4xl'
						className={`${hasMissingData ? 'text-amber-500' : 'text-emerald-500'} shrink-0`}
					/>
					<div className='flex flex-col gap-2'>
						<p className='font-semibold text-gray-800 dark:text-gray-200'>
							¿Generar orden de venta?
						</p>

						{hasMissingData ? (
							<div className='mt-2 flex flex-col gap-2'>
								<p className='text-sm text-amber-700 dark:text-amber-400'>
									Faltan los siguientes datos del cliente para la venta:
								</p>
								<div className='flex flex-wrap gap-2'>
									{missingFields.map((field, idx) => (
										<div
											key={idx}
											className='rounded bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300'>
											{field}
										</div>
									))}
								</div>
								<p className='mt-2 text-xs italic text-amber-600'>
									Puedes confirmar, pero deberás completar estos datos al momento
									de facturar.
								</p>
							</div>
						) : (
							<div className='rounded bg-emerald-500/10 p-2 text-sm font-medium text-emerald-600'>
								El cliente {customerInfo.name} tiene todos los datos necesarios.
							</div>
						)}
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end gap-3'>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
					<Button
						variant='solid'
						color={hasMissingData ? 'amber' : 'emerald'}
						onClick={() => onConfirm(quotationId)}>
						Confirmar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};
