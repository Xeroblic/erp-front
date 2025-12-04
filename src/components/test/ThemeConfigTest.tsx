import React from 'react';
import Badge from '../ui/Badge';
import themeConfig from '../../config/theme.config';

/**
 * Componente de prueba para verificar que themeConfig responde a los cambios
 * de personalización del usuario
 */
const ThemeConfigTest: React.FC = () => {
	// Función para cambiar los colores dinámicamente (solo para pruebas)
	const changeThemeColor = (color: string, intensity: string) => {
		localStorage.setItem('zentria_themeColor', color);
		localStorage.setItem('zentria_themeColorShade', intensity);

		// Forzar re-render
		window.location.reload();
	};

	return (
		<div className='space-y-4 p-4'>
			<h3 className='text-lg font-bold'>Test de ThemeConfig Dinámico</h3>

			<div className='space-y-2'>
				<p>
					Color actual del tema: <strong>{themeConfig.themeColor}</strong>
				</p>
				<p>
					Intensidad actual: <strong>{themeConfig.themeColorShade}</strong>
				</p>
				<p>
					Tamaño de fuente: <strong>{themeConfig.fontSize}</strong>
				</p>
			</div>

			<div className='space-x-2'>
				<Badge>Badge con color automático</Badge>
				<Badge color='blue'>Badge azul fijo</Badge>
				<Badge color={themeConfig.themeColor} colorIntensity={themeConfig.themeColorShade}>
					Badge dinámico
				</Badge>
			</div>

			<div className='space-x-2'>
				<button
					onClick={() => changeThemeColor('emerald', '600')}
					className='rounded bg-emerald-500 px-3 py-1 text-white'>
					Cambiar a Emerald
				</button>
				<button
					onClick={() => changeThemeColor('purple', '500')}
					className='rounded bg-purple-500 px-3 py-1 text-white'>
					Cambiar a Purple
				</button>
				<button
					onClick={() => changeThemeColor('amber', '500')}
					className='rounded bg-amber-500 px-3 py-1 text-white'>
					Volver a Amber
				</button>
			</div>
		</div>
	);
};

export default ThemeConfigTest;
