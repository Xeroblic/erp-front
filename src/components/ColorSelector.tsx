import React from 'react';
import colors from 'tailwindcss/colors';
import { useAppSelector } from '../store/hook';
import useThemeColor from '../hooks/useThemeColor';
import { TColors, arrColors } from '../types/colors.type';
import { TColorIntensity } from '../types/colorIntensities.type';

interface ColorSelectorProps {
	onColorChange?: (color: TColors, intensity: TColorIntensity) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ onColorChange }) => {
	const { themeColor, themeColorShade } = useThemeColor();

	const colorList: TColors[] = arrColors;
	const intensities: TColorIntensity[] = ['300', '400', '500', '600', '700'];

	const currentColor = themeColor;
	const currentIntensity = themeColorShade;
	const handleColorSelect = (color: TColors, intensity: TColorIntensity) => {
		if (onColorChange) {
			onColorChange(color, intensity);
		}
	};

	return (
		<div className='space-y-3'>
			{/* Colores principales */}
			<div className='grid grid-cols-6 gap-2'>
				{colorList.map((color) => {
					// Obtener el color real de Tailwind
					const colorPalette = (colors as any)[color];
					const colorValue = colorPalette?.[500] || '#6b7280';

					return (
						<button
							key={color}
							onClick={() => handleColorSelect(color, currentIntensity)}
							className={`h-8 w-8 rounded-full border-2 transition-all ${
								currentColor === color
									? 'scale-110 border-gray-800 dark:border-gray-200'
									: 'border-gray-300 hover:scale-105'
							}`}
							style={{ backgroundColor: colorValue }}
							title={color}
						/>
					);
				})}
			</div>

			{/* Intensidades para el color seleccionado */}
			<div className='flex justify-center gap-1'>
				{intensities.map((intensity) => {
					// Obtener el color e intensidad específicos
					const colorPalette = (colors as any)[currentColor];
					const colorValue = colorPalette?.[intensity] || '#6b7280';

					return (
						<button
							key={intensity}
							onClick={() => handleColorSelect(currentColor, intensity)}
							className={`h-6 w-6 rounded border transition-all ${
								currentIntensity === intensity
									? 'scale-110 border-gray-800 dark:border-gray-200'
									: 'border-gray-300 hover:scale-105'
							}`}
							style={{ backgroundColor: colorValue }}
							title={`${currentColor}-${intensity}`}
						/>
					);
				})}
			</div>

			{/* Preview actual */}
			<div className='text-center text-sm text-gray-600 dark:text-gray-300'>
				Actual: {currentColor}-{currentIntensity}
			</div>
		</div>
	);
};

export default ColorSelector;
