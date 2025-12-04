import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import Icon from '../../../../components/icon/Icon';
import useAsideStatus from '../../../../hooks/useAsideStatus';
import LogoTemplate from '../../Logo/Logo.template';

const LogoAndAsideTogglePart = () => {
	const { asideStatus, setAsideStatus } = useAsideStatus();
	return (
		<>
			<Link
				to='/'
				aria-label='Logo'
				className={classNames(asideStatus ? 'block' : 'hidden md:group-hover/aside:block')}>
				<LogoTemplate className='ml-12 h-12' />
			</Link>
			<motion.button
				type='button'
				aria-label='Toggle Aside Menu'
				onClick={() => setAsideStatus(!asideStatus)}
				whileHover={{ scale: 1.05, y: -1 }}
				whileTap={{ scale: 0.97 }}
				className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-700 shadow-md shadow-gray-500/15 dark:bg-zinc-800 dark:text-white dark:shadow-[0_2px_8px_rgba(0,0,0,0.55)]'>
				<Icon icon={asideStatus ? 'DuoBack' : 'DuoMenu'} className='text-2xl' />
			</motion.button>
		</>
	);
};

export default LogoAndAsideTogglePart;
