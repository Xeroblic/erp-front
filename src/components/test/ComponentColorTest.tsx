import React from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import useReactiveThemeConfig from '../../hooks/useReactiveThemeConfig';

/**
 * Componente de prueba para verificar que los componentes respondan a cambios de color
 */
const ComponentColorTest: React.FC = () => {
	const { themeColor, themeColorShade } = useReactiveThemeConfig();

	return (
		<div className='space-y-6 bg-white p-6 dark:bg-gray-800'>
			<div className='space-y-2'>
				<h2 className='text-xl font-bold text-gray-900 dark:text-white'>
					Test de Componentes Reactivos
				</h2>
				<p className='text-sm text-gray-600 dark:text-gray-300'>
					Color actual: <strong>{themeColor}</strong> - {themeColorShade}
				</p>
			</div>

			<div className='space-y-4'>
				<div className='space-y-2'>
					<h3 className='font-semibold text-gray-700 dark:text-gray-300'>Badges:</h3>
					<div className='space-x-2'>
						<Badge>Badge Default</Badge>
						<Badge variant='solid'>Badge Solid</Badge>
						<Badge variant='outline'>Badge Outline</Badge>
					</div>
				</div>

				<div className='space-y-2'>
					<h3 className='font-semibold text-gray-700 dark:text-gray-300'>Buttons:</h3>
					<div className='space-x-2'>
						<Button>Button Default</Button>
						<Button variant='solid'>Button Solid</Button>
						<Button variant='outline'>Button Outline</Button>
					</div>
				</div>
			</div>

			<div className='rounded-lg bg-gray-100 p-4 dark:bg-gray-700'>
				<p className='text-sm text-gray-600 dark:text-gray-300'>
					<strong>Instrucciones:</strong> Cambia el color del tema en la configuración y
					observa cómo estos componentes se actualizan automáticamente.
				</p>
			</div>
		</div>
	);
};

export default ComponentColorTest;
