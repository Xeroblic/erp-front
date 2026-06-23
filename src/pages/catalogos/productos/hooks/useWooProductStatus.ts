import { useMemo } from 'react';
import { getWooProductLinks, type WooProductLink } from '@/utils/wooProductMeta.util';

export interface UseWooProductStatusReturn {
	productLinks: WooProductLink[];
	publishedHereLink: WooProductLink | null;
	isPublishedHere: boolean;
	isPublishedAnywhere: boolean;
	isPublishedElsewhere: boolean;
	getLinkForIntegration: (integrationId: string | null | undefined) => WooProductLink | null;
}

export const useWooProductStatus = (
	marketplaceExternalIds: unknown,
	selectedIntegrationId: string | null | undefined,
): UseWooProductStatusReturn => {
	const productLinks = useMemo(
		() => getWooProductLinks(marketplaceExternalIds),
		[marketplaceExternalIds],
	);

	const publishedHereLink = useMemo(() => {
		if (!selectedIntegrationId) return null;
		return productLinks.find((l) => l.integrationId === selectedIntegrationId) ?? null;
	}, [productLinks, selectedIntegrationId]);

	const isPublishedHere = publishedHereLink != null;
	const isPublishedAnywhere = productLinks.length > 0;

	const isPublishedElsewhere = useMemo(() => {
		if (productLinks.length === 0) return false;
		if (isPublishedHere) return false;
		return true;
	}, [productLinks, isPublishedHere]);

	const getLinkForIntegration = (integrationId: string | null | undefined): WooProductLink | null => {
		if (!integrationId) return null;
		return productLinks.find((l) => l.integrationId === integrationId) ?? null;
	};

	return {
		productLinks,
		publishedHereLink,
		isPublishedHere,
		isPublishedAnywhere,
		isPublishedElsewhere,
		getLinkForIntegration,
	};
};
