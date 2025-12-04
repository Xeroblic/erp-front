import React, { FC } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import DARK_MODE from '../../../../constants/darkMode.constant';
import Icon from '../../../../components/icon/Icon';
import useDarkModeManager from '../../../../hooks/useDarkModeManager.ts';
import { TIcons } from '../../../../types/icons.type';
import { TDarkMode } from '../../../../types/darkMode.type';
import useAsideStatus from '../../../../hooks/useAsideStatus';
import themeConfig from '../../../../config/theme.config';

interface IStyledButtonProps {
	text: string;
	icon: TIcons;
	status: TDarkMode;
}
const StyledButton: FC<IStyledButtonProps> = ({ text, icon, status }) => {
	const { darkModeStatus, setDarkModeStatus } = useDarkModeManager();
	const { asideStatus } = useAsideStatus();

	const handeClick = () => {
		// Detectar si el aside está hoverado para permitir selección directa
		const asideHovered = !!document.querySelector('aside[data-component-name="Aside"]:hover');
		let nextMode: TDarkMode;
		if (!asideStatus && !asideHovered) {
			// Ciclar cuando está colapsado y sin hover
			if (darkModeStatus === DARK_MODE.DARK) nextMode = DARK_MODE.LIGHT;
			else if (darkModeStatus === DARK_MODE.LIGHT) nextMode = DARK_MODE.SYSTEM;
			else nextMode = DARK_MODE.DARK;
		} else {
			// Selección directa cuando está expandido o en hover
			nextMode = status;
		}

		void setDarkModeStatus(nextMode);
	};

	return (
		<button
			type='button'
			aria-label={`${text} Mode`}
			className={classNames(
				'p-1.5',
				'rounded-full',
				'text-zinc-500 dark:hover:text-zinc-100',
				'flex flex-auto items-center justify-center',
				'truncate',
				{
					'bg-white shadow-lg dark:bg-zinc-800 dark:text-white':
						darkModeStatus === status,
					'hover:text-zinc-950': darkModeStatus !== status,
				},
				// Cuando está colapsado, ocultar los que no son el modo actual hasta hover
				!asideStatus && darkModeStatus !== status && 'hidden md:group-hover/aside:flex',
				themeConfig.transition,
			)}
			onClick={handeClick}>
			<Icon
				icon={icon}
				className={classNames(
					'text-xl',
					{
						'ltr:mr-1.5 rtl:ml-1.5': asideStatus,
					},
					// Añadir separación al hacer hover cuando está colapsado
					!asideStatus &&
						'md:group-hover/aside:ltr:mr-1.5 md:group-hover/aside:rtl:ml-1.5',
				)}
			/>
			<span
				className={classNames(
					'overflow-hidden truncate whitespace-nowrap',
					asideStatus ? 'inline' : 'hidden md:group-hover/aside:inline',
				)}>
				{text}
			</span>
		</button>
	);
};
const DarkModeSwitcherPart = () => {
	const { t } = useTranslation();
	return (
		<div className='flex w-full overflow-hidden rounded-full bg-zinc-100 p-2 text-sm dark:bg-zinc-950'>
			<StyledButton icon='DuoMoon' status={DARK_MODE.DARK} text={t('theme.dark')} />
			<StyledButton icon='DuoSun' status={DARK_MODE.LIGHT} text={t('theme.light')} />
			<StyledButton icon='DuoLaptop' status={DARK_MODE.SYSTEM} text={t('theme.system')} />
		</div>
	);
};

export default DarkModeSwitcherPart;
