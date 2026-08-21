import { privatePages, authPages, PageConfig } from '@/config/pages.config';
import { matchPath } from 'react-router-dom';
import { TIcons } from '@/types/icons.type';

/**
 * Recursively searches for a page config that matches the current path.
 * Returns both the title and the icon name.
 */
export const getPageTitleFromPath = (
	pathname: string,
): { title: string; icon?: TIcons | string } => {
	const allPages = { ...authPages, ...privatePages };

	const findMatch = (
		config: Record<string, any>,
	): { title: string; icon?: TIcons | string } | null => {
		for (const key in config) {
			const page = config[key];

			// Check if it's a page config with a 'to' property
			if (page && typeof page.to === 'string') {
				// Use matchPath to handle parameters like /:id
				if (matchPath({ path: page.to, end: true }, pathname)) {
					return {
						title: page.text || 'Zentria ERP',
						icon: page.icon,
					};
				}
			}

			// Recursive check for subPages
			if (page.subPages) {
				const subMatch = findMatch(page.subPages);
				if (subMatch) return subMatch;
			}
		}
		return null;
	};

	return findMatch(allPages) || { title: 'Zentria ERP', icon: undefined };
};
