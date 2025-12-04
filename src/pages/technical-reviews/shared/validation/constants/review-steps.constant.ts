/**
 * Technical Reviews - Review Steps Constants
 * Constantes compartidas para los pasos de revisión
 */

/**
 * Pasos de revisión
 */
export type ReviewStep = 'basic' | 'review' | 'grading';

/**
 * Configuración de steps con metadata
 */
export interface ReviewStepConfig {
	id: ReviewStep;
	label: string;
	icon: string;
	description: string;
	order: number;
}

/**
 * Steps configurados
 */
export const REVIEW_STEPS: ReviewStepConfig[] = [
	{
		id: 'basic',
		label: 'Información Básica',
		icon: 'HeroInformationCircle',
		description: 'Serial, producto y tipo de equipo',
		order: 1,
	},
	{
		id: 'review',
		label: 'Revisión Técnica',
		icon: 'HeroClipboardDocumentCheck',
		description: 'Detalles técnicos completos',
		order: 2,
	},
	{
		id: 'grading',
		label: 'Calificación',
		icon: 'HeroStar',
		description: 'Grado final y aprobación',
		order: 3,
	},
];

/**
 * Mapeo de review_status a step
 */
export const REVIEW_STATUS_TO_STEP: Record<string, ReviewStep> = {
	pending: 'basic',
	in_review: 'review',
	reviewed: 'grading',
	approved: 'grading',
};

/**
 * Helper para obtener step desde review_status
 */
export const getStepFromReviewStatus = (status: string | null | undefined): ReviewStep => {
	if (!status) return 'basic';

	// Manejar objeto {value, label}
	const statusValue =
		typeof status === 'object' && status !== null && 'value' in status
			? (status as any).value
			: status;

	return REVIEW_STATUS_TO_STEP[statusValue] || 'basic';
};

/**
 * Helper para obtener step config
 */
export const getStepConfig = (step: ReviewStep): ReviewStepConfig | undefined => {
	return REVIEW_STEPS.find((s) => s.id === step);
};

/**
 * Helper para obtener index del step
 */
export const getStepIndex = (step: ReviewStep): number => {
	return REVIEW_STEPS.findIndex((s) => s.id === step);
};

/**
 * Helper para validar si un step puede ser accedido
 */
export const canAccessStep = (
	targetStep: ReviewStep,
	currentReviewStatus: string | null | undefined,
	isApproved: boolean,
): boolean => {
	// Si está aprobado, no puede editar
	if (isApproved) return false;

	const currentStep = getStepFromReviewStatus(currentReviewStatus);
	const currentIndex = getStepIndex(currentStep);
	const targetIndex = getStepIndex(targetStep);

	// Solo puede acceder a steps anteriores o al actual
	return targetIndex <= currentIndex;
};
