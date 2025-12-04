import React, { FC } from 'react';
import { motion, type SVGMotionProps } from 'framer-motion';
import useThemeColor from '../../../hooks/useThemeColor';

type ILogoTemplateProps = Omit<SVGMotionProps<SVGSVGElement>, 'ref'>;

const LogoTemplate: FC<ILogoTemplateProps> = (props) => {
	const { ...rest } = props;
	const { themeColorShade } = useThemeColor();

	return (
		<motion.svg
			xmlns='http://www.w3.org/2000/svg'
			viewBox='0 0 200 120'
			role='img'
			aria-hidden
			initial={{ opacity: 0, scale: 0.96, y: 4 }}
			animate={{ opacity: 1, scale: 1, y: [2, -2, 2] }}
			transition={{
				opacity: { duration: 0.6, ease: 'easeOut' },
				scale: { duration: 0.8, ease: 'easeOut' },
				y: { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
			}}
			{...rest}>
			<defs>
				<linearGradient id='brandG1' x1='0%' y1='0%' x2='100%' y2='100%'>
					<stop offset='0%' stopColor='#1e40af' />
					<stop offset='50%' stopColor={`var(--color-primary-${themeColorShade})`} />
					<stop offset='100%' stopColor='#7c3aed' />
				</linearGradient>
				<linearGradient id='brandG2' x1='0%' y1='0%' x2='100%' y2='100%'>
					<stop offset='0%' stopColor='#3b82f6' />
					<stop offset='100%' stopColor='#8b5cf6' />
				</linearGradient>
				<linearGradient id='brandG3' x1='0%' y1='0%' x2='100%' y2='100%'>
					<stop offset='0%' stopColor='#60a5fa' />
					<stop offset='100%' stopColor='#a78bfa' />
				</linearGradient>
			</defs>

			{/* Línea principal de infinito dinámico */}
			<motion.path
				d='M 30 60 C 30 30, 60 20, 90 40 C 120 60, 140 60, 170 40 C 200 20, 200 30, 170 60 C 140 90, 120 90, 90 70 C 60 50, 30 50, 30 60 Z'
				fill='none'
				stroke='url(#brandG1)'
				strokeWidth='8'
				strokeLinecap='round'
				strokeLinejoin='round'
				opacity='0.9'
				strokeDasharray='260 60'
				strokeDashoffset='0'
				animate={{ strokeDashoffset: [-20, -120, -20] }}
				transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
			/>

			{/* Segunda línea ondulada */}
			<motion.path
				d='M 35 55 C 35 35, 55 30, 80 45 C 105 60, 125 65, 150 50 C 175 35, 175 40, 165 65 C 155 90, 135 95, 110 80 C 85 65, 65 60, 40 75 C 15 90, 25 85, 35 55 Z'
				fill='none'
				stroke='url(#brandG2)'
				strokeWidth='6'
				strokeLinecap='round'
				strokeLinejoin='round'
				opacity='0.7'
				strokeDasharray='200 80'
				animate={{ strokeDashoffset: [0, -100, 0] }}
				transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
			/>

			{/* Tercera línea más sutil */}
			<motion.path
				d='M 40 58 C 40 42, 55 38, 75 48 C 95 58, 115 62, 135 52 C 155 42, 155 46, 150 68 C 145 90, 125 94, 105 84 C 85 74, 65 70, 45 80 C 25 90, 35 86, 40 58 Z'
				fill='none'
				stroke='url(#brandG3)'
				strokeWidth='4'
				strokeLinecap='round'
				strokeLinejoin='round'
				opacity='0.5'
				strokeDasharray='160 70'
				animate={{ strokeDashoffset: [0, -80, 0] }}
				transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
			/>

			{/* Elementos adicionales tipo fibras */}
			<motion.path
				d='M 60 25 C 80 15, 100 20, 110 35'
				fill='none'
				stroke='url(#brandG2)'
				strokeWidth='3'
				strokeLinecap='round'
				opacity='0.6'
				animate={{ opacity: [0.4, 0.8, 0.4] }}
				transition={{
					duration: 4,
					repeat: Infinity,
					repeatType: 'mirror',
					ease: 'easeInOut',
					delay: 0.1,
				}}
			/>

			<motion.path
				d='M 130 25 C 150 15, 170 20, 180 35'
				fill='none'
				stroke='url(#brandG2)'
				strokeWidth='3'
				strokeLinecap='round'
				opacity='0.6'
				animate={{ opacity: [0.4, 0.8, 0.4] }}
				transition={{
					duration: 4,
					repeat: Infinity,
					repeatType: 'mirror',
					ease: 'easeInOut',
					delay: 0.3,
				}}
			/>

			<motion.path
				d='M 60 95 C 80 105, 100 100, 110 85'
				fill='none'
				stroke='url(#brandG2)'
				strokeWidth='3'
				strokeLinecap='round'
				opacity='0.6'
				animate={{ opacity: [0.4, 0.8, 0.4] }}
				transition={{
					duration: 4,
					repeat: Infinity,
					repeatType: 'mirror',
					ease: 'easeInOut',
					delay: 0.2,
				}}
			/>

			<motion.path
				d='M 130 95 C 150 105, 170 100, 180 85'
				fill='none'
				stroke='url(#brandG2)'
				strokeWidth='3'
				strokeLinecap='round'
				opacity='0.6'
				animate={{ opacity: [0.4, 0.8, 0.4] }}
				transition={{
					duration: 4,
					repeat: Infinity,
					repeatType: 'mirror',
					ease: 'easeInOut',
					delay: 0.5,
				}}
			/>
		</motion.svg>
	);
};

export default LogoTemplate;
