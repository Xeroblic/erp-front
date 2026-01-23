/** Tamaños disponibles para las imágenes del tutorial */
export type TutorialImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Configuración de imagen para el tutorial */
export interface TutorialImage {
	/** URL de la imagen */
	src: string;
	/** Tamaño de la imagen (default: 'md') */
	size?: TutorialImageSize;
	/** Texto alternativo (opcional) */
	alt?: string;
}

export interface TutorialStep {
	/** Título del paso */
	title: string;
	/** Descripción del paso (puede incluir HTML básico) */
	description: string;
	/** URL de imagen (opcional) - para compatibilidad con formato anterior */
	image?: string;
	/** Array de imágenes con tamaño configurable (nuevo formato) */
	images?: TutorialImage[];
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
