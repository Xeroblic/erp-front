import React from 'react';
import Button from '../ui/Button';
import ButtonGroup from '../ui/ButtonGroup';
import useDarkModeManager from '../../hooks/useDarkModeManager';
import useFontSize from '../../hooks/useFontSize';
import useThemeColor from '../../hooks/useThemeColor';
import DARK_MODE from '../../constants/darkMode.constant';

/**
 * Componente de prueba para verificar que el sistema de personalización funcione
 */
const PersonalizacionTest: React.FC = () => {
	const {
		darkModeStatus,
		isDarkTheme,
		setDarkModeStatus,
		isLight,
		isDark,
		isSystem,
		systemPrefersDark,
	} = useDarkModeManager();

	const { fontSize, setFontSize } = useFontSize();
	const { themeColor, setThemeColor, themeColorShade, setThemeColorShade } = useThemeColor();

	return (
		<div className='fixed left-4 top-4 z-50 max-w-md rounded-lg border border-zinc-300 bg-white p-4 shadow-lg dark:border-zinc-600 dark:bg-zinc-800'>
			<h3 className='mb-3 text-lg font-bold text-gray-900 dark:text-white'>
				🧪 Test Personalización
			</h3>

			<div className='space-y-4'>
				{/* Dark Mode Test */}
				<div>
					<h4 className='mb-2 font-semibold text-gray-700 dark:text-gray-300'>
						Dark Mode:
					</h4>
					<ButtonGroup>
						<Button
							size='sm'
							onClick={() => setDarkModeStatus(DARK_MODE.LIGHT)}
							variant={isLight ? 'solid' : 'outline'}>
							☀️
						</Button>
						<Button
							size='sm'
							onClick={() => setDarkModeStatus(DARK_MODE.DARK)}
							variant={isDark ? 'solid' : 'outline'}>
							🌙
						</Button>
						<Button
							size='sm'
							onClick={() => setDarkModeStatus(DARK_MODE.SYSTEM)}
							variant={isSystem ? 'solid' : 'outline'}>
							💻
						</Button>
					</ButtonGroup>
					<div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
						Estado: {darkModeStatus} | Activo: {isDarkTheme ? 'Oscuro' : 'Claro'}
						{isSystem && ` | Sistema: ${systemPrefersDark ? 'Oscuro' : 'Claro'}`}
					</div>
				</div>

				{/* Font Size Test */}
				<div>
					<h4 className='mb-2 font-semibold text-gray-700 dark:text-gray-300'>
						Font Size:
					</h4>
					<ButtonGroup>
						<Button
							size='sm'
							onClick={() => setFontSize(fontSize - 1)}
							isDisable={fontSize <= 12}>
							-
						</Button>
						<Button size='sm' isDisable>
							{fontSize}px
						</Button>
						<Button
							size='sm'
							onClick={() => setFontSize(fontSize + 1)}
							isDisable={fontSize >= 18}>
							+
						</Button>
					</ButtonGroup>
				</div>

				{/* Theme Color Test */}
				<div>
					<h4 className='mb-2 font-semibold text-gray-700 dark:text-gray-300'>Color:</h4>
					<div className='flex flex-wrap gap-2'>
						{['red', 'amber', 'emerald', 'blue', 'violet'].map((color) => (
							<button
								key={color}
								className={`h-6 w-6 rounded border-2 ${
									themeColor === color
										? 'border-gray-800 dark:border-gray-200'
										: 'border-gray-300'
								}`}
								style={{ backgroundColor: `var(--color-${color}-500, #6b7280)` }}
								onClick={() => setThemeColor(color as any)}
							/>
						))}
					</div>
					<div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
						Actual: {themeColor}-{themeColorShade}
					</div>
				</div>

				{/* HTML Classes Debug */}
				<div>
					<h4 className='mb-2 font-semibold text-gray-700 dark:text-gray-300'>
						HTML Classes:
					</h4>
					<div className='rounded bg-gray-100 p-2 text-xs dark:bg-gray-700'>
						{document.documentElement.className || 'ninguna'}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PersonalizacionTest;
