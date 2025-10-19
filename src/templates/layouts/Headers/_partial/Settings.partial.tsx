import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DARK_MODE from '../../../../constants/darkMode.constant';
import useFontSize from '../../../../hooks/useFontSize';
import useDarkModeManager from '../../../../hooks/useDarkModeManager.ts';
import useThemeColor from '../../../../hooks/useThemeColor';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	actualizarPersonalizacionThunk,
	selectPersonalizacionUsuario,
} from '@/store/slices/personalizacion/personalizacionSlice';
import { toast } from 'react-toastify';
import { TColors } from '@/types/colors.type';
import { TColorIntensity } from '@/types/colorIntensities.type';

import { apiToDark, tDarkToApi, isTcolor, isTIntensity } from './utils/personalizacionMaps.ts';
import { TDarkMode } from '@/types/darkMode.type.ts';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown.tsx';
import Button from '@/components/ui/Button.tsx';
import ButtonGroup from '@/components/ui/ButtonGroup.tsx';
import ColorSelector from '@/components/ColorSelector.tsx';
import Icon from '@/components/icon/Icon.tsx';
const MIN_FONT = 12;
const MAX_FONT = 18;

const clamp = (v: number, min = MIN_FONT, max = MAX_FONT) => Math.min(max, Math.max(min, v));

const SettingsPartial = () => {
	const dispatch = useAppDispatch();

	const { fontSize, setFontSize } = useFontSize();
	const { darkModeStatus, setDarkModeStatus, isLight, isDark, isSystem } = useDarkModeManager();
	const { themeColor, setThemeColor, themeColorShade, setThemeColorShade } = useThemeColor();

	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);

	const [isUpdatingFont, setIsUpdatingFont] = useState(false);
	const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
	const [isUpdatingColor, setIsUpdatingColor] = useState(false);

	const fontPresets = useMemo(
		() => [
			{ label: 'Compacto', value: 13 },
			{ label: 'Normal', value: 14 },
			{ label: 'Grande', value: 16 },
		],
		[],
	);

	const updateFontSize = useCallback(
		async (newSize: number) => {
			const next = clamp(newSize);
			if (next === fontSize) return;
			try {
				setIsUpdatingFont(true as boolean);
				setFontSize(next as number);
				await dispatch(actualizarPersonalizacionThunk({ font_size: next })).unwrap();
			} catch (error: any) {
				toast.error(error || 'No se pudo actualizar el tamaño de fuente');
				setFontSize(fontSize as number);
			} finally {
				setIsUpdatingFont(false as boolean);
			}
		},
		[dispatch, fontSize, setFontSize],
	);

	// Efecto radial: cubre con el color anterior y se encoge
	const runRadialWipe = useCallback(
		(corner: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right', duration = 600) => {
			try {
				const prevBg =
					getComputedStyle(document.body).backgroundColor ||
					getComputedStyle(document.documentElement).backgroundColor;
				const overlay = document.createElement('div');
				overlay.className = 'theme-wipe-overlay';
				overlay.style.setProperty('--theme-wipe-bg', prevBg);
				overlay.style.setProperty('--wipe-duration', `${duration}ms`);
				let x = '100%';
				let y = '0%';
				if (corner === 'top-left') { x = '0%'; y = '0%'; }
				if (corner === 'bottom-right') { x = '100%'; y = '100%'; }
				if (corner === 'bottom-left') { x = '0%'; y = '100%'; }
				overlay.style.setProperty('--wipe-x', x);
				overlay.style.setProperty('--wipe-y', y);
				document.body.appendChild(overlay);
				requestAnimationFrame(() => overlay.classList.add('animate'));
				overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
			} catch {}
		},
		[],
	);

	const handleColorChange = useCallback(
		async (color: TColors, intensity: TColorIntensity) => {
			if (color === themeColor && intensity === themeColorShade) return;
			const prevColor = themeColor;
			const prevShade = themeColorShade;

			try {
				// transición (espera al siguiente frame para asegurar repaint)
				requestAnimationFrame(() => {
					document.documentElement.classList.add('theme-transition');
				});
				setIsUpdatingColor(true);
				setThemeColor(color);
				setThemeColorShade(intensity);
				await dispatch(
					actualizarPersonalizacionThunk({ tcolor: color, tcolor_int: intensity }),
				).unwrap();
			} catch (error: any) {
				toast.error(error || 'No se pudo actualizar los colores');
				setThemeColor(prevColor);
				setThemeColorShade(prevShade);
			} finally {
				setIsUpdatingColor(false);
				setTimeout(
					() => document.documentElement.classList.remove('theme-transition'),
					220,
				);
			}
		},
		[dispatch, themeColor, themeColorShade, setThemeColor, setThemeColorShade],
	);

	const updateTheme = useCallback(
		async (mode: TDarkMode) => {
			if (mode === darkModeStatus || isUpdatingTheme) return;
			try {
				// Suavizado general de colores mientras corre el wipe
				requestAnimationFrame(() => {
					document.documentElement.classList.add('theme-transition');
				});
				// Wipe radial: LIGHT -> top-right, DARK -> bottom-left, SYSTEM -> según preferencia SO
				const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
				const corner = mode === DARK_MODE.DARK
					? 'bottom-left'
					: mode === DARK_MODE.LIGHT
						? 'top-right'
						: (sysDark ? 'bottom-left' : 'top-right');
				runRadialWipe(corner, 800);
				setIsUpdatingTheme(true);
				setDarkModeStatus(mode);
				await dispatch(
					actualizarPersonalizacionThunk({ tema: tDarkToApi(mode) }),
				).unwrap();
			} catch {
				toast.error('No se pudo actualizar el tema');
			} finally {
				setIsUpdatingTheme(false);
				setTimeout(
					() => document.documentElement.classList.remove('theme-transition'),
					850,
				);
			}
		},
		[dispatch, setDarkModeStatus, darkModeStatus, isUpdatingTheme, runRadialWipe],
	);

	const handleReset = useCallback(async () => {
		const targetFont = clamp(personalizacionUsuario?.font_size ?? 14);

		const rawModeNum = personalizacionUsuario?.tema ?? personalizacionUsuario?.dark_mode;
		const targetMode = rawModeNum != null ? apiToDark(rawModeNum) : darkModeStatus;

		const targetColor = isTcolor(personalizacionUsuario?.tcolor)
			? (personalizacionUsuario!.tcolor as TColors)
			: themeColor;

		const targetShade = isTIntensity(personalizacionUsuario?.tcolor_int)
			? (String(personalizacionUsuario!.tcolor_int) as TColorIntensity)
			: themeColorShade;

		try {
			setIsUpdatingFont(true);
			setIsUpdatingTheme(true);
			setIsUpdatingColor(true);

			setFontSize(targetFont);
			setDarkModeStatus(targetMode);
			setThemeColor(targetColor);
			setThemeColorShade(targetShade);

			await dispatch(
				actualizarPersonalizacionThunk({
					font_size: targetFont,
					tema: tDarkToApi(targetMode),
					tcolor: targetColor,
					tcolor_int: targetShade,
				}),
			).unwrap();

			toast.success('Preferencias restablecidas');
		} catch {
			toast.error('No se pudo restablecer las preferencias');
		} finally {
			setIsUpdatingFont(false);
			setIsUpdatingTheme(false);
			setIsUpdatingColor(false);
		}
	}, [
		dispatch,
		personalizacionUsuario,
		setFontSize,
		setDarkModeStatus,
		setThemeColor,
		setThemeColorShade,
		themeColor,
		themeColorShade,
		darkModeStatus,
	]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (!e.altKey) return;
			if (e.key === '-' || e.key === '_') {
				e.preventDefault();
				updateFontSize(fontSize - 1);
			}
			if (e.key === '=' || e.key === '+') {
				e.preventDefault();
				updateFontSize(fontSize + 1);
			}
			if (e.key.toLowerCase() === 'd') {
				e.preventDefault();
				updateTheme(DARK_MODE.DARK);
			}
			if (e.key.toLowerCase() === 'l') {
				e.preventDefault();
				updateTheme(DARK_MODE.LIGHT);
			}
			if (e.key.toLowerCase() === 's') {
				e.preventDefault();
				updateTheme(DARK_MODE.SYSTEM);
			}
			if (e.key.toLowerCase() === 'r') {
				e.preventDefault();
				handleReset();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [fontSize, updateFontSize, updateTheme, handleReset]);

	const isAnyUpdating = isUpdatingFont || isUpdatingTheme || isUpdatingColor;

	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button
					icon='HeroCog8Tooth'
					aria-label='Abrir configuración'
					title='Configuración'
					isLoading={isAnyUpdating}
				/>
			</DropdownToggle>

			<DropdownMenu
				placement='bottom-end'
				className='max-h-[70vh] w-[calc(100vw-32px)] min-w-0 max-w-sm overflow-y-auto md:w-auto md:min-w-72'>
				<DropdownItem className='flex flex-col !items-start gap-2'>
					<div className='flex w-full items-center justify-between'>
						<div className='text-sm font-medium'>Tamaño de fuente</div>
						<span className='text-xs opacity-70'>Actual: {fontSize}px</span>
					</div>

					<ButtonGroup>
						<Button
							icon='HeroMinus'
							onClick={() => updateFontSize(fontSize - 1)}
							isDisable={fontSize <= MIN_FONT || isUpdatingFont}
							aria-label='Disminuir fuente'
							title='Alt + -'
						/>
						<Button isDisable className='cursor-default'>
							{fontSize}
						</Button>
						<Button
							icon='HeroPlus'
							onClick={() => updateFontSize(fontSize + 1)}
							isDisable={fontSize >= MAX_FONT || isUpdatingFont}
							aria-label='Aumentar fuente'
							title='Alt + ='
						/>
					</ButtonGroup>

					<div className='flex flex-wrap gap-2'>
						{fontPresets.map((p) => (
							<Button
								key={p.label}
								size='sm'
								variant={fontSize === p.value ? 'solid' : 'outline'}
								onClick={() => updateFontSize(p.value)}
								isDisable={isUpdatingFont}
								aria-pressed={fontSize === p.value}
								title={`Preset: ${p.label}`}>
								{p.label}
							</Button>
						))}
					</div>
				</DropdownItem>

				<DropdownItem className='flex flex-col !items-start gap-2'>
					<div className='text-sm font-medium'>Tema del sistema</div>
					<ButtonGroup>
						<Button
							icon='HeroMoon'
							onClick={() => updateTheme(DARK_MODE.DARK)}
							isActive={isDark}
							variant={isDark ? 'solid' : 'outline'}
							className='border-none'
							aria-label='Tema oscuro'
							title='Alt + D'
							isDisable={isUpdatingTheme}
						/>
						<Button
							icon='HeroSun'
							onClick={() => updateTheme(DARK_MODE.LIGHT)}
							isActive={isLight}
							variant={isLight ? 'solid' : 'outline'}
							className='border-none'
							aria-label='Tema claro'
							title='Alt + L'
							isDisable={isUpdatingTheme}
						/>
						<Button
							icon='HeroComputerDesktop'
							onClick={() => updateTheme(DARK_MODE.SYSTEM)}
							isActive={isSystem}
							variant={isSystem ? 'solid' : 'outline'}
							className='border-none'
							aria-label='Tema del sistema'
							title='Alt + S'
							isDisable={isUpdatingTheme}
						/>
					</ButtonGroup>
					<p className='text-xs opacity-70'>
						Sugerencia: en “Sistema” tu tema seguirá el modo del SO automáticamente.
					</p>
				</DropdownItem>

				<DropdownItem className='flex flex-col !items-start gap-2'>
					<div className='text-sm font-medium'>Color del tema</div>
					<ColorSelector onColorChange={handleColorChange} />
					{isUpdatingColor && (
						<div className='flex items-center gap-2 text-xs opacity-70'>
							<Icon icon='HeroArrowPath' className='animate-spin' />
							Guardando color…
						</div>
					)}
				</DropdownItem>

				<DropdownItem className='flex items-center justify-between'>
					<div className='text-sm opacity-80'>Restablecer a mis valores</div>
					<Button
						size='sm'
						variant='outline'
						icon='HeroArrowUturnLeft'
						onClick={handleReset}
						title='Alt + R'
						isDisable={isAnyUpdating}>
						Reset
					</Button>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default SettingsPartial;

/// version anterior -  no eliminar

// import React, { useState } from 'react';
// import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../../../components/ui/Dropdown';
// import Button from '../../../../components/ui/Button';
// import ButtonGroup from '../../../../components/ui/ButtonGroup';
// import DARK_MODE from '../../../../constants/darkMode.constant';
// import useFontSize from '../../../../hooks/useFontSize';
// import useDarkModeManager from '../../../../hooks/useDarkModeManager.ts';
// import useThemeColor from '../../../../hooks/useThemeColor';
// import { useAppDispatch, useAppSelector } from '@/store';
// import {
//     actualizarPersonalizacionThunk,
//     selectPersonalizacionUsuario
// } from '@/store/slices/personalizacion/personalizacionSlice';
// import { toast } from 'react-toastify';
// import { TColors } from '@/types/colors.type';
// import { TColorIntensity } from '@/types/colorIntensities.type';
// import ColorSelector from '@/components/ColorSelector';
// // import CompanySelector from '@/components/authorization/CompanySelector';
// import Icon from '@/components/icon/Icon';
// import { use } from 'i18next';

// const SettingsPartial = () => {
//     const dispatch = useAppDispatch();
//     const { fontSize, setFontSize } = useFontSize();
//     const { darkModeStatus, isDarkTheme, setDarkModeStatus, isLight, isDark, isSystem } = useDarkModeManager();
//     const { themeColor, setThemeColor, themeColorShade, setThemeColorShade } = useThemeColor();
//     const { user } = useAppSelector((state) => state.auth);
//     const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
//     const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);

//     const updateFontSize = async (newSize: number) => {
//         try {
//             // Actualizar localmente primero para respuesta inmediata
//             setFontSize(newSize);

//             // Luego guardar en API
//             await dispatch(actualizarPersonalizacionThunk({
//                 font_size: newSize
//             })).unwrap();

//         } catch (error: any) {
//             toast.error('Error al actualizar el tamaño de fuente');
//         }
//     };

//     const handleColorChange = async (color: TColors, intensity: TColorIntensity) => {
//         try {
//             // Actualizar localmente primero
//             setThemeColor(color);
//             setThemeColorShade(intensity);

//             // Luego actualizar en el servidor
//             await dispatch(actualizarPersonalizacionThunk({
//                 tcolor: color,
//                 tcolor_int: intensity
//             })).unwrap();

//             // toast.success('Colores actualizados correctamente');
//         } catch (error: any) {
//             toast.error(error || 'No se pudo actualizar los colores');
//             // Revertir cambios locales si falla
//             setThemeColor(themeColor);
//             setThemeColorShade(themeColorShade);
//         }
//     };    // Solo mostrar selector de empresa si el usuario tiene múltiples empresas o es super-admin
//     const shouldShowCompanySelector = user?.authority?.includes('super-admin') ||
//       user?.roles?.includes('super-admin') ||
//       (user?.companies && user.companies.length > 1);

//     return (
//         <Dropdown>
//             <DropdownToggle hasIcon={false}>
//                 <Button icon='HeroCog8Tooth' aria-label='Settings' />
//             </DropdownToggle>
//             <DropdownMenu placement='bottom-end'>

//                 <DropdownItem className='flex flex-col !items-start'>
//                     <div>Tamaño de Fuente:</div>
//                     <ButtonGroup>
//                         <Button
//                             icon='HeroMinus'
//                             onClick={() => updateFontSize(fontSize - 1)}
//                             isDisable={fontSize <= 12}
//                         />
//                         <Button isDisable>{fontSize}</Button>
//                         <Button
//                             icon='HeroPlus'
//                             onClick={() => updateFontSize(fontSize + 1)}
//                             isDisable={fontSize >= 18}
//                         />
//                     </ButtonGroup>
//                 </DropdownItem>
//                 <DropdownItem className='flex flex-col !items-start'>
//                     <div className="mb-2">Tema del sistema:</div>
//                     <ButtonGroup>
//                         <Button
//                             icon='HeroMoon'
//                             onClick={() => setDarkModeStatus(DARK_MODE.DARK)}
//                             isActive={isDark}
//                             variant={isDark ? 'solid' : 'outline'}
//                             className='border-none'
//                         />
//                         <Button
//                             icon='HeroSun'
//                             onClick={() => setDarkModeStatus(DARK_MODE.LIGHT)}
//                             isActive={isLight}
//                             variant={isLight ? 'solid' : 'outline'}
//                             className='border-none'
//                         />
//                         <Button
//                             icon='HeroComputerDesktop'
//                             onClick={() => setDarkModeStatus(DARK_MODE.SYSTEM)}
//                             isActive={isSystem}
//                             variant={isSystem ? 'solid' : 'outline'}
//                             className='border-none'
//                         />
//                     </ButtonGroup>

//                 </DropdownItem>
//                 <DropdownItem className='flex flex-col !items-start'>
//                     <div className="mb-2">Color del Tema:</div>
//                     <ColorSelector onColorChange={handleColorChange} />
//                 </DropdownItem>
//             </DropdownMenu>

//             {/* Modal de selector de empresa - Ya no necesario, movido a dropdown directo */}
//             {/* <CompanySelector
//         isOpen={isCompanySelectorOpen}
//         onClose={() => setIsCompanySelectorOpen(false)}
//     /> */}
//         </Dropdown>
//     );
// };

// export default SettingsPartial;
