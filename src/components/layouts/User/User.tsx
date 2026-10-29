import React, { FC, HTMLAttributes, ReactNode, useId, useMemo, useState } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import useRoundedSize from '../../../hooks/useRoundedSize';
import useAsideStatus from '../../../hooks/useAsideStatus';
import themeConfig from '../../../config/theme.config';
import { getFirstLetter } from '../../../utils/getFirstLetter';
import useReactiveThemeConfig from '@/hooks/useReactiveThemeConfig';
import useColorIntensity from '@/hooks/useColorIntensity';

interface IUserProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
	src?: string;
	name: string;
	namePrefix?: ReactNode;
	nameSuffix?: ReactNode;
	position: string;
	suffix?: ReactNode;
	isLoading?: boolean;
}
const User: FC<IUserProps> = (props) => {
	const {
		children,
		className,
		name,
		position,
		src,
		namePrefix,
		nameSuffix,
		suffix,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		isLoading = false,
		...rest
	} = props;
	const { themeColor: reactiveThemeColor, themeColorShade: reactiveThemeColorShade } =
		useReactiveThemeConfig();
	const { tintColorIntensity } = useColorIntensity(reactiveThemeColorShade);
	const pingOuterShade = tintColorIntensity ?? reactiveThemeColorShade;

	const { asideStatus } = useAsideStatus();

	const id = useId();
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const { roundedCustom } = useRoundedSize('rounded-xl');

	const avatarMotionProps = useMemo(
		() => ({
			animate: {
				scale: isOpen ? 1.05 : 1,
				rotate: isOpen ? 2 : 0,
			},
			transition: { type: 'spring', stiffness: 320, damping: 22 },
		}),
		[isOpen],
	);

	const dropdownMotionVariants = useMemo(
		() => ({
			open: { height: 'auto', opacity: 1, marginTop: 8 },
			collapsed: { height: 0, opacity: 0, marginTop: 0 },
		}),
		[],
	);

	return (
		<div data-component-name='User' className={classNames('relative', className)} {...rest}>
			<motion.div
				className={classNames(
					'mb-2 min-w-[4.5rem] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-950',
					{
						'ltr:translate-x-[-0.625rem] rtl:translate-x-[0.625rem]': !asideStatus,
					},
					themeConfig.transition,
				)}
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
				<motion.div
					className={classNames(
						'flex cursor-pointer gap-3 p-3',
						'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100',
						'transition-all duration-300 ease-in-out',
					)}
					onClick={() => setIsOpen((prevState) => !prevState)}
					role='presentation'
					whileHover={{ scale: 1.01, y: -2 }}
					whileTap={{ scale: 0.98 }}
					transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
					{src ? (
						<motion.img
							src={src}
							alt='Avatar'
							className={classNames('h-12 w-12 object-cover', [
								`${roundedCustom(-2)}`,
							])}
							{...avatarMotionProps}
						/>
					) : (
						<motion.div
							className={classNames(
								'flex aspect-square h-12 w-12 items-center justify-center bg-opacity-20',
								[`bg-${reactiveThemeColor}-${reactiveThemeColorShade}`],
								[`text-${reactiveThemeColor}-${reactiveThemeColorShade}`],
								[`${roundedCustom(-2)}`],
							)}
							{...avatarMotionProps}>
							{name && getFirstLetter(name)}
						</motion.div>
					)}
					<div className='flex basis-full flex-wrap items-center truncate'>
						<div className='flex basis-full items-center gap-2 truncate'>
							{namePrefix && <span>{namePrefix}</span>}
							<span className='truncate font-semibold'>{name}</span>
							{nameSuffix && <span>{nameSuffix}</span>}
						</div>
						<div className='basis-full truncate text-xs'>{position}</div>
					</div>
					{suffix && <div className='flex items-center'>{suffix}</div>}
				</motion.div>
				<AnimatePresence>
					{isOpen && (
						<motion.ul
							key={id}
							initial='collapsed'
							animate='open'
							exit='collapsed'
							variants={dropdownMotionVariants}
							transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
							style={{ overflow: 'hidden' }}
							className='px-3'>
							{children}
						</motion.ul>
					)}
				</AnimatePresence>
			</motion.div>
			<span
				className={classNames('absolute end-0 top-0 -me-1 -mt-1 flex h-3 w-3', {
					'ltr:translate-x-[0.625rem] rtl:translate-x-[-0.625rem]': !asideStatus,
				})}>
				<motion.span
					className={classNames('absolute inline-flex h-full w-full rounded-full', [
						`bg-${reactiveThemeColor}-${pingOuterShade}`,
					])}
					initial={{ opacity: 0.7, scale: 1 }}
					animate={{ opacity: [0.7, 0.2, 0], scale: [1, 1.8, 2.2] }}
					transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
				/>
				<motion.span
					className={classNames('relative inline-flex h-3 w-3 rounded-full', [
						`bg-${reactiveThemeColor}-${reactiveThemeColorShade}`,
					])}
					animate={{ scale: isOpen ? 1.1 : 1 }}
					transition={{ type: 'spring', stiffness: 260, damping: 20 }}
				/>
			</span>
		</div>
	);
};
User.displayName = 'User';

export default User;
