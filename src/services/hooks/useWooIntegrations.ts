import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import useContextScopedSelection from '@/hooks/useContextScopedSelection';
import { fetchIntegrations } from '@/store/slices/integrations/integrationsSlice';
import type { Integration } from '@/types/integrations.types';

interface UseWooIntegrationsReturn {
	/** Integraciones WooCommerce activas (destinos válidos para publicar). */
	integrations: Integration[];
	/** Todas las integraciones WooCommerce (activas + inactivas). */
	allWooIntegrations: Integration[];
	selectedIntegrationId: string | null;
	selectedIntegration: Integration | null;
	setSelectedIntegrationId: (id: string | null) => void;
	loading: boolean;
	/** Hay más de una tienda WooCommerce (activa o inactiva) → mostrar toggle. */
	hasMultiple: boolean;
	/** Devuelve el nombre legible de una integración por su id. */
	getIntegrationName: (id: string | null | undefined) => string;
	/** ¿La integración seleccionada está inactiva? */
	isSelectedInactive: boolean;
}

export const useWooIntegrations = (subsidiaryId: number | null): UseWooIntegrationsReturn => {
	const dispatch = useAppDispatch();
	const { integrations, loading, listSubsidiaryId } = useAppSelector(
		(state) => state.integrations,
	);
	const selection = useContextScopedSelection<string>(
		subsidiaryId === null ? null : { type: 'subsidiary', id: subsidiaryId },
	);

	useEffect(() => {
		if (!subsidiaryId) return;
		void dispatch(fetchIntegrations({ subsidiaryId, params: { provider: 'woocommerce' } }));
	}, [dispatch, subsidiaryId]);

	const allWooIntegrations = useMemo(
		() =>
			(listSubsidiaryId === subsidiaryId ? integrations : []).filter(
				(i) => i.provider === 'woocommerce' && i.mode !== 'webhook',
			),
		[integrations, listSubsidiaryId, subsidiaryId],
	);

	const activeIntegrations = useMemo(
		() => allWooIntegrations.filter((i) => i.is_active),
		[allWooIntegrations],
	);

	useEffect(() => {
		if (activeIntegrations.length === 0) {
			if (selection.selectedId !== null) selection.clear();
			return;
		}
		const stillActive =
			selection.selectedId &&
			activeIntegrations.some((i) => i.id === selection.selectedId);
		if (!stillActive) {
			selection.select(activeIntegrations[0].id);
		}
	}, [activeIntegrations, selection]);

	const selectedIntegration = useMemo(
		() => allWooIntegrations.find((i) => i.id === selection.selectedId) ?? null,
		[allWooIntegrations, selection.selectedId],
	);

	const handleSetSelectedId = useCallback((id: string | null) => {
		if (id === null) selection.clear();
		else selection.select(id);
	}, [selection]);

	const getIntegrationName = useCallback(
		(id: string | null | undefined): string => {
			if (!id) return 'WooCommerce';
			const found = allWooIntegrations.find((i) => i.id === id);
			return found?.name ?? id;
		},
		[allWooIntegrations],
	);

	return {
		integrations: activeIntegrations,
		allWooIntegrations,
		selectedIntegrationId: selection.selectedId,
		selectedIntegration,
		setSelectedIntegrationId: handleSetSelectedId,
		loading,
		hasMultiple: allWooIntegrations.length > 1,
		getIntegrationName,
		isSelectedInactive: selectedIntegration != null && !selectedIntegration.is_active,
	};
};
