import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	attachCustomersToSupplier,
	detachCustomersFromSupplier,
	fetchSupplierCustomers,
	fetchSuppliers,
} from '@/store/slices/suppliers/suppliersSlice';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import useCompanyManager from '@/hooks/useCompanyManager';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';

type UseSupplierCustomersOptions =
	| boolean
	| {
			enabled?: boolean;
			subsidiaryId?: number | null;
	  };

export const useSupplierCustomers = (
	supplierId?: number,
	options: UseSupplierCustomersOptions = true,
) => {
	const dispatch = useAppDispatch();
	const { customers, customersLoading, attaching, detaching } = useAppSelector(
		(s) => s.suppliers,
	);
	const { currentCompany } = useCompanyManager();
	const { lista: subsidiaries } = useAppSelector((s) => s.subEmpresa);

	const normalizedOptions =
		typeof options === 'boolean'
			? { enabled: options }
			: {
					enabled: options?.enabled ?? true,
					subsidiaryId: options?.subsidiaryId ?? null,
				};

	const providedSubsidiaryId =
		normalizedOptions.subsidiaryId !== null && normalizedOptions.subsidiaryId !== undefined
			? normalizedOptions.subsidiaryId
			: null;

	const isEnabled = normalizedOptions.enabled ?? true;

	const companySubsidiaryId = currentCompany?.subsidiary_id ?? currentCompany?.id ?? null;

	const [effectiveSubsidiaryId, setEffectiveSubsidiaryId] = useState<number | null>(
		providedSubsidiaryId ?? companySubsidiaryId ?? null,
	);
	const requestedSubsRef = useRef(false);

	useEffect(() => {
		if (providedSubsidiaryId !== null && providedSubsidiaryId !== undefined) {
			if (providedSubsidiaryId !== effectiveSubsidiaryId) {
				setEffectiveSubsidiaryId(providedSubsidiaryId);
			}
			return;
		}

		if (companySubsidiaryId && companySubsidiaryId !== effectiveSubsidiaryId) {
			setEffectiveSubsidiaryId(companySubsidiaryId);
			return;
		}

		if (!companySubsidiaryId) {
			if (!requestedSubsRef.current) {
				requestedSubsRef.current = true;
				dispatch(fetchMisSubsidiarias());
			}
			const firstId = subsidiaries?.[0]?.id ?? null;
			if (firstId && firstId !== effectiveSubsidiaryId) {
				setEffectiveSubsidiaryId(firstId);
			}
		}
	}, [providedSubsidiaryId, companySubsidiaryId, subsidiaries, effectiveSubsidiaryId, dispatch]);

	useEffect(() => {
		if (!supplierId || !isEnabled || !effectiveSubsidiaryId) return;
		dispatch(fetchSupplierCustomers({ subsidiaryId: effectiveSubsidiaryId, supplierId }));
	}, [dispatch, supplierId, isEnabled, effectiveSubsidiaryId]);

	const attach = useCallback(
		async (ids: number[]) => {
			if (!supplierId || !ids?.length || !effectiveSubsidiaryId) return;

			try {
				const result = await dispatch(
					attachCustomersToSupplier({
						subsidiaryId: effectiveSubsidiaryId,
						supplierId,
						payload: { customer_supplier_ids: ids },
					}),
				).unwrap();

				await Promise.all([
					dispatch(
						fetchSupplierCustomers({
							subsidiaryId: effectiveSubsidiaryId,
							supplierId,
						}),
					).unwrap(),
					dispatch(
						fetchCustomerSuppliers({
							subsidiaryId: effectiveSubsidiaryId,
							with_suppliers: false,
						}),
					).unwrap(),
					dispatch(
						fetchSuppliers({
							subsidiaryId: effectiveSubsidiaryId,
							with_customers: true,
						}),
					).unwrap(),
				]);
			} catch (error) {
				console.error('Error al asociar clientes:', error);
			}
		},
		[dispatch, supplierId, effectiveSubsidiaryId],
	);

	const detach = useCallback(
		async (ids: number[]) => {
			if (!supplierId || !ids?.length || !effectiveSubsidiaryId) return;

			try {
				const result = await dispatch(
					detachCustomersFromSupplier({
						subsidiaryId: effectiveSubsidiaryId,
						supplierId,
						payload: { customer_supplier_ids: ids },
					}),
				).unwrap();

				// 🔄 Recargar TODA la data en paralelo para actualizar TODO
				await Promise.all([
					dispatch(
						fetchSupplierCustomers({
							subsidiaryId: effectiveSubsidiaryId,
							supplierId,
						}),
					).unwrap(),
					dispatch(
						fetchCustomerSuppliers({
							subsidiaryId: effectiveSubsidiaryId,
							with_suppliers: false,
						}),
					).unwrap(),
					dispatch(
						fetchSuppliers({
							subsidiaryId: effectiveSubsidiaryId,
							with_customers: true,
						}),
					).unwrap(),
				]);
			} catch (error) {
				console.error('Error al desasociar clientes:', error);
			}
		},
		[dispatch, supplierId, effectiveSubsidiaryId],
	);

	return {
		customers,
		loading: customersLoading,
		attaching,
		detaching,
		attach,
		detach,
	};
};
