export interface TutorialStep {
	/** Título del paso */
	title: string;
	/** Descripción del paso (puede incluir HTML básico) */
	description: string;
	/** URL de imagen (opcional) */
	image?: string;
	/** URL de video de YouTube (opcional) - usar formato embed */
	videoUrl?: string;
	/** Icono opcional para el paso */
	icon?: string;
}

export interface TutorialModalProps {
	/** Array de pasos del tutorial */
	steps: TutorialStep[];
	/** Título del tutorial */
	title?: string;
	/** Estado de visibilidad del modal */
	isOpen: boolean;
	/** Función para cambiar visibilidad */
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
