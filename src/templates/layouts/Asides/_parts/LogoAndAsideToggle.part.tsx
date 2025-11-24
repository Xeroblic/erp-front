import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import Icon from '../../../../components/icon/Icon';
import useAsideStatus from '../../../../hooks/useAsideStatus';
import LogoTemplate from '../../Logo/Logo.template.tsx';

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
			<button
				type='button'
				aria-label='Toggle Aside Menu'
				onClick={() => setAsideStatus(!asideStatus)}
				className='flex h-12 w-12 items-center justify-center'>
				<Icon
					icon={asideStatus ? 'DuoBack' : 'DuoMenu'}
					className='text-2xl'
				/>
				
			</button>
		</>
	);
};

export default LogoAndAsideTogglePart;
