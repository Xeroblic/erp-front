/**
 * ReviewPhotosContext
 * Provee el contexto (subsidiaria + item) que necesita la pestaña de Galería
 * sin tener que atravesar los props de cada formulario de equipo.
 *
 * Lo provee `Step2FullReview` y lo consume `GallerySection`.
 */
import React, { createContext, useContext, useMemo } from 'react';

export interface ReviewPhotosContextValue {
	subsidiaryId: number | null;
	itemId: number | null;
}

const ReviewPhotosContext = createContext<ReviewPhotosContextValue | null>(null);

interface ReviewPhotosProviderProps {
	subsidiaryId: number | null;
	itemId: number | null;
	children: React.ReactNode;
}

export const ReviewPhotosProvider: React.FC<ReviewPhotosProviderProps> = ({
	subsidiaryId,
	itemId,
	children,
}) => {
	const value = useMemo<ReviewPhotosContextValue>(
		() => ({ subsidiaryId, itemId }),
		[subsidiaryId, itemId],
	);
	return <ReviewPhotosContext.Provider value={value}>{children}</ReviewPhotosContext.Provider>;
};

/** Devuelve el contexto de fotos; valores en null si no hay provider. */
export const useReviewPhotosContext = (): ReviewPhotosContextValue => {
	return useContext(ReviewPhotosContext) ?? { subsidiaryId: null, itemId: null };
};

export default ReviewPhotosContext;
