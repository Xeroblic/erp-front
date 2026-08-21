import { ReactNode } from 'react';

export interface HiddenAsideProps {
	/**
	 * Content to display inside the aside panel
	 */
	children: ReactNode;
	/**
	 * Button icon (default: 'HeroChevronLeft')
	 */
	buttonIcon?: string;
	/**
	 * Aside width when expanded (default: 'w-80')
	 */
	asideWidth?: string;
	/**
	 * Background color theme (default: 'blue')
	 */
	color?: 'blue' | 'red' | 'green' | 'purple' | 'amber' | 'zinc';
	/**
	 * Custom class for the aside content
	 */
	className?: string;
}
