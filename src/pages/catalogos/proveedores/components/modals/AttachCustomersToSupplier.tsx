import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import useCompanyManager from '@/hooks/useCompanyManager';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onAttach: (ids: number[]) => Promise<void> | void;
};

const AttachCustomersToSupplier: React.FC<Props> = ({ isOpen, onClose, onAttach }) => {
	const dispatch = useAppDispatch();
	const { items, loading } = useAppSelector((s) => s.customerSuppliers);
	const [selected, setSelected] = useState<TSelectOption[]>([]);
	const { currentCompany } = useCompanyManager();
	const { lista: subsidiaries } = useAppSelector((s) => s.subEmpresa);
	const initialSubsidiaryId = currentCompany?.subsidiary_id ?? currentCompany?.id ?? 0;
	const [effectiveSubsidiaryId, setEffectiveSubsidiaryId] = useState<number>(initialSubsidiaryId);
	const requestedSubsRef = useRef(false);

	useEffect(() => {
		if (!isOpen) return;
		if (initialSubsidiaryId && initialSubsidiaryId !== effectiveSubsidiaryId) {
			setEffectiveSubsidiaryId(initialSubsidiaryId);
			return;
		}
		if (!initialSubsidiaryId) {
			if (!requestedSubsRef.current) {
				requestedSubsRef.current = true;
				dispatch(fetchMisSubsidiarias());
			}
			const firstId = subsidiaries?.[0]?.id;
			if (firstId && firstId !== effectiveSubsidiaryId) setEffectiveSubsidiaryId(firstId);
		}
	}, [dispatch, isOpen, initialSubsidiaryId, subsidiaries, effectiveSubsidiaryId]);

	useEffect(() => {
		if (!isOpen || !effectiveSubsidiaryId) return;
		dispatch(fetchCustomerSuppliers({ subsidiaryId: effectiveSubsidiaryId }));
	}, [dispatch, isOpen, effectiveSubsidiaryId]);

	const options: TSelectOption[] = useMemo(
		() =>
			items.map((c) => ({
				value: String(c.id),
				label: c.name ?? `#${c.id}`,
			})),
		[items],
	);

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
					Asociar clientes al proveedor
				</h3>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<div>
						<div className='mb-2 text-sm text-gray-700 dark:text-gray-300'>
							Selecciona uno o más clientes:
						</div>
						<SelectReact
							name='customers'
							isMulti
							isLoading={loading}
							isSearchable
							options={options}
							value={selected}
							onChange={(val) => setSelected((val as TSelectOption[]) || [])}
							placeholder='Buscar clientes-proveedor...'
							isClearable
						/>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-2'>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
					<Button
						color='blue'
						isDisable={!selected.length}
						onClick={async () => {
							const ids = selected
								.map((s) => Number(s.value))
								.filter((n) => !Number.isNaN(n));
							await onAttach(ids);
							setSelected([]);
							onClose();
						}}>
						Asociar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default AttachCustomersToSupplier;
