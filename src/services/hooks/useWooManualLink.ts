import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as wooService from '@/services/woocommerceProductsService';
import extractApiErrorMessage from '@/utils/apiError.utils';
import type {
	WooCompareParams,
	WooCandidatesParams,
	WooLinkPayload,
} from '@/types/integrations.types';

const KEYS = {
	candidates: (subsidiaryId: number, productId: number, integrationId?: string) =>
		['woo-candidates', subsidiaryId, productId, integrationId ?? 'default'] as const,
	compare: (subsidiaryId: number, productId: number, integrationId?: string) =>
		['woo-compare', subsidiaryId, productId, integrationId ?? 'default'] as const,
};

export const useWooCandidates = (
	subsidiaryId: number | null,
	productId: number,
	params?: WooCandidatesParams,
	enabled = false,
	integrationId?: string,
) => {
	return useQuery({
		queryKey: [...KEYS.candidates(subsidiaryId ?? 0, productId, integrationId), params],
		queryFn: () => wooService.searchCandidates(subsidiaryId!, productId, params, integrationId),
		enabled: enabled && subsidiaryId !== null,
	});
};

export const useWooCompare = (
	subsidiaryId: number | null,
	productId: number,
	params: WooCompareParams | null,
	integrationId?: string,
) => {
	const hasValidParams =
		params !== null &&
		(params.external_product_id != null ||
			(params.external_sku != null && params.external_sku !== ''));

	return useQuery({
		queryKey: [...KEYS.compare(subsidiaryId ?? 0, productId, integrationId), params],
		queryFn: () => wooService.compareProduct(subsidiaryId!, productId, params!, integrationId),
		enabled: subsidiaryId !== null && hasValidParams,
	});
};

export const useWooLink = (
	subsidiaryId: number | null,
	productId: number,
	integrationId?: string,
) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: WooLinkPayload) =>
			wooService.linkProduct(subsidiaryId!, productId, payload, integrationId),
		onSuccess: (data) => {
			toast.success(data.message || 'Producto vinculado correctamente');
			queryClient.invalidateQueries({
				queryKey: KEYS.candidates(subsidiaryId ?? 0, productId, integrationId),
			});
		},
		onError: (error: unknown) => {
			const conflict = extractConflictData(error);
			if (conflict) {
				toast.warning(
					'Los precios difieren entre ERP y WooCommerce. Selecciona qué precio mantener.',
				);
				return;
			}
			toast.error(extractApiErrorMessage(error));
		},
	});
};

export const useWooUnlink = (
	subsidiaryId: number | null,
	productId: number,
	integrationId?: string,
) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => wooService.unlinkProduct(subsidiaryId!, productId, integrationId),
		onSuccess: (data) => {
			toast.success(data.message || 'Producto desvinculado correctamente');
			queryClient.invalidateQueries({
				queryKey: KEYS.candidates(subsidiaryId ?? 0, productId, integrationId),
			});
		},
		onError: (error: unknown) => {
			toast.error(extractApiErrorMessage(error));
		},
	});
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined => {
	if (value && typeof value === 'object' && !Array.isArray(value)) return value as UnknownRecord;
	return undefined;
};

export const extractConflictData = (
	error: unknown,
): { erp_price: string | number | null; woo_price: string | number | null } | null => {
	const responseRecord = asRecord(asRecord(error)?.response);
	const status = responseRecord?.status;
	if (status !== 409) return null;
	const dataRecord = asRecord(responseRecord?.data);
	if (!dataRecord) return null;
	const erpPrice = dataRecord.erp_price as string | number | null | undefined;
	const wooPrice = dataRecord.woo_price as string | number | null | undefined;
	if (erpPrice !== undefined || wooPrice !== undefined) {
		return { erp_price: erpPrice ?? null, woo_price: wooPrice ?? null };
	}
	return null;
};
