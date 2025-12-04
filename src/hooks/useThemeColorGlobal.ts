import { useEffect } from 'react';
import { useAppSelector } from '../store/hook';
import { selectPersonalizacionUsuario } from '../store/slices/personalizacion/personalizacionSlice';
import { TColors } from '../types/colors.type';
import { TColorIntensity } from '../types/colorIntensities.type';

const useThemeColorGlobal = () => {
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);

	useEffect(() => {
		const themeColor = (personalizacionUsuario?.tcolor as TColors) || 'amber';

		document.documentElement.style.setProperty(
			'--color-primary-50',
			`var(--color-${themeColor}-50)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-100',
			`var(--color-${themeColor}-100)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-200',
			`var(--color-${themeColor}-200)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-300',
			`var(--color-${themeColor}-300)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-400',
			`var(--color-${themeColor}-400)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-500',
			`var(--color-${themeColor}-500)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-600',
			`var(--color-${themeColor}-600)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-700',
			`var(--color-${themeColor}-700)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-800',
			`var(--color-${themeColor}-800)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-900',
			`var(--color-${themeColor}-900)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-950',
			`var(--color-${themeColor}-950)`,
		);

		// Variables RGB equivalentes
		document.documentElement.style.setProperty(
			'--color-primary-50-rgb',
			`var(--color-${themeColor}-50-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-100-rgb',
			`var(--color-${themeColor}-100-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-200-rgb',
			`var(--color-${themeColor}-200-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-300-rgb',
			`var(--color-${themeColor}-300-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-400-rgb',
			`var(--color-${themeColor}-400-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-500-rgb',
			`var(--color-${themeColor}-500-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-600-rgb',
			`var(--color-${themeColor}-600-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-700-rgb',
			`var(--color-${themeColor}-700-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-800-rgb',
			`var(--color-${themeColor}-800-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-900-rgb',
			`var(--color-${themeColor}-900-rgb)`,
		);
		document.documentElement.style.setProperty(
			'--color-primary-950-rgb',
			`var(--color-${themeColor}-950-rgb)`,
		);
	}, [personalizacionUsuario?.tcolor, personalizacionUsuario?.tcolor_int]);

	// Retornar los valores actuales para uso opcional
	return {
		themeColor: (personalizacionUsuario?.tcolor as TColors) || 'amber',
		themeColorShade: (personalizacionUsuario?.tcolor_int as TColorIntensity) || '500',
	};
};

export default useThemeColorGlobal;
