import React, { FC, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button, { type IButtonProps } from '@/components/ui/Button';
import useCan from '@/hooks/useCan';
import type { IPageLink } from '@/config/procurementLinks';

export interface IPageLinkButtonProps
	extends Pick<IButtonProps, 'color' | 'icon' | 'size' | 'variant'> {
	link: IPageLink;
	children: ReactNode;
}

/** Sólo aparece con **todo** el `authority` de la ruta destino, la regla de `AuthorityCheck`. */
const PageLinkButton: FC<IPageLinkButtonProps> = ({
	link,
	children,
	color,
	icon,
	size,
	variant,
}) => {
	const { all } = useCan();
	const navigate = useNavigate();

	if (!all([...link.authority])) return null;

	return (
		<Button
			type='button'
			color={color}
			icon={icon}
			size={size}
			variant={variant}
			onClick={() => navigate(link.to)}>
			{children}
		</Button>
	);
};

export default PageLinkButton;
