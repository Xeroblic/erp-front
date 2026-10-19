import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { TIcons } from '@/types/icons.type';

/**
 * Título estándar del `SubheaderLeft`: ícono, título destacado y descripción
 * opcional. Replica la cabecera de Trazabilidad de Inventario para que todas
 * las pantallas del módulo compartan el mismo encabezado.
 *
 * Vive en su propio archivo y no en `Subheader.tsx`: `Badge` lee el tema desde
 * Redux, y el layout base no debe arrastrar esa dependencia a cada página.
 */

interface ISubheaderTitleProps {
	title: ReactNode;
	description?: ReactNode;
	icon?: TIcons;
	className?: string;
}

const SubheaderTitle: FC<ISubheaderTitleProps> = ({ title, description, icon, className }) => (
	<div
		data-component-name='Subheader/SubheaderTitle'
		className={classNames('flex min-w-0 flex-row items-center gap-2', className)}>
		{icon && <Icon icon={icon} className='h-6 w-6 shrink-0' aria-hidden />}
		<div className='flex min-w-0 flex-col items-start justify-start'>
			<h1 className='min-w-0'>
				<Badge className='text-xl font-bold'>{title}</Badge>
			</h1>
			{description && (
				<p className='text-sm text-gray-500 dark:text-gray-400'>{description}</p>
			)}
		</div>
	</div>
);

SubheaderTitle.displayName = 'SubheaderTitle';
export default SubheaderTitle;
