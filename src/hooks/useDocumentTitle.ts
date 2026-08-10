import { useEffect, useState } from 'react';
import themeConfig from '../config/theme.config';

const useDocumentTitle = ({
	title = themeConfig.projectTitle,

	name = themeConfig.projectName,
}: {
	/**
	 * Project Name
	 *
	 * Example: Project Name | Page Name
	 */
	title?: string;
	/**
	 * Page Name
	 *
	 * Example: Project Name | Page Name
	 */
	name?: string;
}) => {
	const resolvedTitle = `${title} | ${name}`;
	const [documentTitle, setDocumentTitle] = useState<string>(resolvedTitle);

	useEffect(() => {
		setDocumentTitle(resolvedTitle);
	}, [resolvedTitle]);

	useEffect(() => {
		document.title = documentTitle;
	}, [documentTitle]);

	return [documentTitle, setDocumentTitle];
};

export default useDocumentTitle;
