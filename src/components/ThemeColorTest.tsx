import React from 'react';
import useThemeColor from '../hooks/useThemeColor';

const ThemeColorTest: React.FC = () => {
	const { themeColor, themeColorShade } = useThemeColor();

	const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

	return (
		<div className='max-w-md rounded-lg bg-white p-4 shadow-md dark:bg-gray-900'>
			<h3 className='mb-4 text-lg font-semibold'>Test de Colores del Tema</h3>
			<p className='mb-4 text-sm'>
				Actual: {themeColor} - {themeColorShade}
			</p>

			<div className='mb-4 grid grid-cols-4 gap-2'>
				{shades.slice(0, 8).map((shade) => (
					<div key={shade} className='text-center'>
						<div
							style={{
								width: '40px',
								height: '40px',
								borderRadius: '4px',
								marginBottom: '4px',
								backgroundColor: `var(--color-primary-${shade})`,
								border: '1px solid #ccc',
							}}
						/>
						<span className='text-xs'>{shade}</span>
					</div>
				))}
			</div>

			<div className='mt-4'>
				<h4 className='mb-2 font-medium'>Color seleccionado:</h4>
				<div
					style={{
						width: '60px',
						height: '60px',
						borderRadius: '8px',
						backgroundColor: `var(--color-primary-${themeColorShade})`,
						border: '2px solid #ccc',
					}}
				/>
				<p className='mt-2 text-sm'>CSS var: --color-primary-{themeColorShade}</p>
			</div>

			<div className='mt-4'>
				<h4 className='mb-2 font-medium'>Test con texto:</h4>
				<p
					style={{
						color: `var(--color-primary-${themeColorShade})`,
						fontWeight: 'bold',
					}}>
					Este texto usa el color del tema
				</p>
			</div>
		</div>
	);
};

export default ThemeColorTest;
