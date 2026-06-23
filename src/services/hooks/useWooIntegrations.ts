import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
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
	const { integrations: allIntegrations, loading } = useAppSelector((state) => state.integrations);

	const [selectedId, setSelectedId] = useState<string | null>(null);

	useEffect(() => {
		if (!subsidiaryId) return;
		void dispatch(fetchIntegrations({ subsidiaryId, params: { provider: 'woocommerce' } }));
	}, [dispatch, subsidiaryId]);

	const allWooIntegrations = useMemo(
		() => allIntegrations.filter((i) => i.provider === 'woocommerce'),
		[allIntegrations],
	);

	const activeIntegrations = useMemo(
		() => allWooIntegrations.filter((i) => i.is_active),
		[allWooIntegrations],
	);

	// Modelo: 1 integración WooCommerce ACTIVA por subsidiaria. El contexto de la
	// tab siempre es una integración activa (las inactivas no son operables). Si no
	// hay ninguna activa, no hay tienda con la que operar (`null`).
	useEffect(() => {
		if (activeIntegrations.length === 0) {
			if (selectedId !== null) setSelectedId(null);
			return;
		}
		const stillActive = selectedId && activeIntegrations.some((i) => i.id === selectedId);
		if (!stillActive) {
			setSelectedId(activeIntegrations[0].id);
		}
	}, [activeIntegrations, selectedId]);

	const selectedIntegration = useMemo(
		() => allWooIntegrations.find((i) => i.id === selectedId) ?? null,
		[allWooIntegrations, selectedId],
	);

	const handleSetSelectedId = useCallback((id: string | null) => {
		setSelectedId(id);
	}, []);

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
		selectedIntegrationId: selectedId,
		selectedIntegration,
		setSelectedIntegrationId: handleSetSelectedId,
		loading,
		hasMultiple: allWooIntegrations.length > 1,
		getIntegrationName,
		isSelectedInactive: selectedIntegration != null && !selectedIntegration.is_active,
	};
};
