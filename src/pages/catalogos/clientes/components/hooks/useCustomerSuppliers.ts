import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    attachSuppliersToCustomerSupplier,
    detachSuppliersFromCustomerSupplier,
    fetchSuppliersOfCustomerSupplier,
    fetchCustomerSuppliers,
} from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import { fetchSuppliers } from '@/store/slices/suppliers/suppliersSlice';
import useCompanyManager from '@/hooks/useCompanyManager';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';

export const useCustomerSuppliers = (customerSupplierId?: number, enabled: boolean = true) => {
    const dispatch = useAppDispatch();
    const { suppliers, suppliersLoading, attaching, detaching } = useAppSelector(
        (s) => s.customerSuppliers,
    );
    const { currentCompany } = useCompanyManager();
    const { lista: subsidiaries } = useAppSelector((s) => s.subEmpresa);
    const initialSubsidiaryId = currentCompany?.subsidiary_id ?? currentCompany?.id ?? 0;
    const [effectiveSubsidiaryId, setEffectiveSubsidiaryId] =
        useState<number>(initialSubsidiaryId);
    const requestedSubsRef = useRef(false);

    useEffect(() => {
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
    }, [initialSubsidiaryId, subsidiaries, effectiveSubsidiaryId, dispatch]);

    useEffect(() => {
        if (!customerSupplierId || !enabled || !effectiveSubsidiaryId) return;
        dispatch(
            fetchSuppliersOfCustomerSupplier({
                subsidiaryId: effectiveSubsidiaryId,
                customerSupplierId,
            }),
        );
    }, [dispatch, customerSupplierId, enabled, effectiveSubsidiaryId]);

    const attach = useCallback(
        async (ids: number[]) => {
            if (!customerSupplierId || !ids?.length || !effectiveSubsidiaryId) return;

            try {
                const result = await dispatch(
                    attachSuppliersToCustomerSupplier({
                        subsidiaryId: effectiveSubsidiaryId,
                        customerSupplierId,
                        payload: { supplier_ids: ids },
                    }),
                ).unwrap();

                // 🔄 Recargar TODA la data en paralelo para actualizar TODO
                await Promise.all([
                    dispatch(
                        fetchSuppliersOfCustomerSupplier({
                            subsidiaryId: effectiveSubsidiaryId,
                            customerSupplierId,
                        }),
                    ).unwrap(),
                    dispatch(
                        fetchSuppliers({
                            subsidiaryId: effectiveSubsidiaryId,
                            with_customers: false,
                        }),
                    ).unwrap(),
                    dispatch(
                        fetchCustomerSuppliers({
                            subsidiaryId: effectiveSubsidiaryId,
                            with_suppliers: true,
                        }),
                    ).unwrap(),
                ]);
            } catch (error) {
                console.error('Error al asociar proveedores:', error);
            }
        },
        [dispatch, customerSupplierId, effectiveSubsidiaryId],
    );

    const detach = useCallback(
        async (ids: number[]) => {
            if (!customerSupplierId || !ids?.length || !effectiveSubsidiaryId) return;

            try {
                const result = await dispatch(
                    detachSuppliersFromCustomerSupplier({
                        subsidiaryId: effectiveSubsidiaryId,
                        customerSupplierId,
                        payload: { supplier_ids: ids },
                    }),
                ).unwrap();

                // 🔄 Recargar TODA la data en paralelo para actualizar TODO
                await Promise.all([
                    dispatch(
                        fetchSuppliersOfCustomerSupplier({
                            subsidiaryId: effectiveSubsidiaryId,
                            customerSupplierId,
                        }),
                    ).unwrap(),
                    dispatch(
                        fetchSuppliers({
                            subsidiaryId: effectiveSubsidiaryId,
                            with_customers: false,
                        }),
                    ).unwrap(),
                    dispatch(
                        fetchCustomerSuppliers({
                            subsidiaryId: effectiveSubsidiaryId,
                            with_suppliers: true,
                        }),
                    ).unwrap(),
                ]);
            } catch (error) {
                console.error('Error al desasociar proveedores:', error);
            }
        },
        [dispatch, customerSupplierId, effectiveSubsidiaryId],
    );

    return {
        suppliers,
        loading: suppliersLoading,
        attaching,
        detaching,
        attach,
        detach,
    };
};
