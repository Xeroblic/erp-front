import { DeliveryMan5WithDog } from '@/assets/images';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { motion } from 'framer-motion';

interface PagConstruccionProps {
	/** Título principal de la sección */
	titulo?: string;
	/** Descripción o mensaje secundario */
	descripcion?: string;
	/** Ruta de la imagen a mostrar */
	imageSrc?: string;
	/** Clase adicional para el contenedor */
	className?: string;
}

const PagConstruccion = ({
	titulo = 'Sección en Construcción',
	descripcion = 'Estamos trabajando para traerte esta funcionalidad lo antes posible.',
	imageSrc = DeliveryMan5WithDog,
	className = '',
}: PagConstruccionProps) => {
	// Variantes para animaciones escalonadas
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
				delayChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 30 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				type: 'spring',
				stiffness: 100,
				damping: 12,
			},
		},
	};

	// Animación de flotación para la imagen
	const floatingAnimation = {
		y: [-8, 8, -8],
		transition: {
			duration: 3,
			repeat: Infinity,
			ease: 'easeInOut',
		},
	};

	// Animación de pulso suave
	const pulseAnimation = {
		scale: [1, 1.02, 1],
		transition: {
			duration: 2,
			repeat: Infinity,
			ease: 'easeInOut',
		},
	};

	// Animación de rotación para engranajes
	const rotateAnimation = {
		rotate: 360,
		transition: {
			duration: 8,
			repeat: Infinity,
			ease: 'linear',
		},
	};

	return (
		<motion.div
			className={`relative flex flex-col items-center justify-center gap-6 overflow-hidden py-16 ${className}`}
			variants={containerVariants}
			initial='hidden'
			animate='visible'>
			{/* Elementos decorativos de fondo */}
			<motion.div className='absolute left-8 top-4 opacity-10' animate={rotateAnimation}>
				<Icon icon='DuoSettings' className='h-16 w-16 text-amber-500' />
			</motion.div>
			<motion.div
				className='absolute bottom-8 right-12 opacity-10'
				animate={{
					...rotateAnimation,
					transition: {
						...rotateAnimation.transition,
						direction: 'reverse',
					},
				}}
				style={{ animationDirection: 'reverse' }}>
				<Icon icon='DuoSettings' className='h-12 w-12 text-amber-500' />
			</motion.div>
			<motion.div
				className='absolute left-4 top-1/2 opacity-10'
				animate={{
					y: [0, -10, 0],
					transition: {
						duration: 2,
						repeat: Infinity,
						ease: 'easeInOut',
					},
				}}>
				<Icon icon='DuoWarning' className='h-10 w-10 text-orange-500' />
			</motion.div>
			<motion.div
				className='absolute right-8 top-1/3 opacity-10'
				animate={{
					y: [0, 10, 0],
					transition: {
						duration: 2.5,
						repeat: Infinity,
						ease: 'easeInOut',
						delay: 0.5,
					},
				}}>
				<Icon icon='DuoTools' className='h-8 w-8 text-blue-500' />
			</motion.div>

			{/* Imagen con efecto de flotación */}
			<motion.div variants={itemVariants} animate={floatingAnimation} className='relative'>
				<motion.div
					className='absolute -inset-4 rounded-full bg-gradient-to-r from-amber-200/20 via-orange-200/20 to-yellow-200/20 blur-2xl dark:from-amber-500/10 dark:via-orange-500/10 dark:to-yellow-500/10'
					animate={{
						scale: [1, 1.1, 1],
						opacity: [0.5, 0.8, 0.5],
					}}
					transition={{
						duration: 3,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
				/>
				<img
					src={imageSrc}
					alt='En construcción'
					className='relative z-10 h-52 drop-shadow-2xl'
				/>
			</motion.div>

			{/* Badge con animación de pulso e iconos */}
			<motion.div
				variants={itemVariants}
				animate={pulseAnimation}
				className='flex items-center gap-3'>
				<motion.div
					animate={{
						rotate: [0, -15, 15, -15, 0],
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: 'easeInOut',
					}}>
					<Icon icon='DuoWarning' className='h-8 w-8 text-amber-500' />
				</motion.div>
				<Badge
					typewriter
					variant='default'
					className='bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-6 py-3 text-center text-2xl font-bold text-white shadow-xl shadow-amber-500/30 backdrop-blur-sm'>
					{titulo}
				</Badge>
				<motion.div
					animate={{
						rotate: [0, 15, -15, 15, 0],
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: 'easeInOut',
						delay: 0.5,
					}}>
					<Icon icon='DuoWarning' className='h-8 w-8 text-amber-500' />
				</motion.div>
			</motion.div>

			{/* Texto descriptivo */}
			<motion.p
				variants={itemVariants}
				className='mt-2 max-w-md text-center text-lg text-gray-500 dark:text-gray-400'>
				{descripcion}
			</motion.p>

			{/* Barra de progreso animada */}
			<motion.div
				variants={itemVariants}
				className='mt-4 h-2 w-64 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
				<motion.div
					className='h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500'
					initial={{ x: '-100%' }}
					animate={{ x: '100%' }}
					transition={{
						duration: 1.5,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
					style={{ width: '50%' }}
				/>
			</motion.div>

			{/* Texto secundario */}
			<motion.div
				variants={itemVariants}
				className='mt-2 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500'>
				<motion.span
					animate={{ opacity: [1, 0.5, 1] }}
					transition={{ duration: 1.5, repeat: Infinity }}>
					●
				</motion.span>
				<span>Desarrollo en progreso</span>
			</motion.div>
		</motion.div>
	);
};

export default PagConstruccion;
