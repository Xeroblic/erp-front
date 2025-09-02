import React, { useState } from 'react';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../../../components/ui/Dropdown';
import Button from '../../../../components/ui/Button';
import ButtonGroup from '../../../../components/ui/ButtonGroup';
import DARK_MODE from '../../../../constants/darkMode.constant';
import useFontSize from '../../../../hooks/useFontSize';
import useDarkModeManager from '../../../../hooks/useDarkModeManager.ts';
import useThemeColor from '../../../../hooks/useThemeColor';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    actualizarPersonalizacionThunk,
    selectPersonalizacionUsuario
} from '@/store/slices/personalizacion/personalizacionSlice';
import { toast } from 'react-toastify';
import { TColors } from '@/types/colors.type';
import { TColorIntensity } from '@/types/colorIntensities.type';
import ColorSelector from '@/components/ColorSelector';
// import CompanySelector from '@/components/authorization/CompanySelector';
import Icon from '@/components/icon/Icon';
import { use } from 'i18next';

const SettingsPartial = () => {
    const dispatch = useAppDispatch();
    const { fontSize, setFontSize } = useFontSize();
    const { darkModeStatus, isDarkTheme, setDarkModeStatus, isLight, isDark, isSystem } = useDarkModeManager();
    const { themeColor, setThemeColor, themeColorShade, setThemeColorShade } = useThemeColor();
    const { user } = useAppSelector((state) => state.auth);
    const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
    const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);

    const updateFontSize = async (newSize: number) => {
        try {
            // Actualizar localmente primero para respuesta inmediata
            setFontSize(newSize);

            // Luego guardar en API
            await dispatch(actualizarPersonalizacionThunk({
                font_size: newSize
            })).unwrap();

        } catch (error: any) {
            toast.error('Error al actualizar el tamaño de fuente');
        }
    };

    const handleColorChange = async (color: TColors, intensity: TColorIntensity) => {
        try {
            // Actualizar localmente primero
            setThemeColor(color);
            setThemeColorShade(intensity);

            // Luego actualizar en el servidor
            await dispatch(actualizarPersonalizacionThunk({
                tcolor: color,
                tcolor_int: intensity
            })).unwrap();

            // toast.success('Colores actualizados correctamente');
        } catch (error: any) {
            toast.error(error || 'No se pudo actualizar los colores');
            // Revertir cambios locales si falla
            setThemeColor(themeColor);
            setThemeColorShade(themeColorShade);
        }
    };    // Solo mostrar selector de empresa si el usuario tiene múltiples empresas o es super-admin
    const shouldShowCompanySelector = user?.authority?.includes('super-admin') ||
      user?.roles?.includes('super-admin') ||
      (user?.companies && user.companies.length > 1);

    return (
        <Dropdown>
            <DropdownToggle hasIcon={false}>
                <Button icon='HeroCog8Tooth' aria-label='Settings' />
            </DropdownToggle>
            <DropdownMenu placement='bottom-end'>
                {/* Selector de Empresa - Movido a dropdown directo en header */}
{shouldShowCompanySelector && ( 
        <DropdownItem>
            <Button
            variant="outline"
            className="w-full flex items-center justify-between"
            onClick={() => setIsCompanySelectorOpen(true)}
            >
            <div className="flex items-center gap-2">
                <Icon icon="HeroBuildingOffice2" className="w-4 h-4" />
                <span>Cambiar Empresa</span>
            </div>
            <Icon icon="HeroChevronRight" className="w-3 h-3" />
            </Button>
        </DropdownItem>
        )} 

                <DropdownItem className='flex flex-col !items-start'>
                    <div>Tamaño de Fuente:</div>
                    <ButtonGroup>
                        <Button
                            icon='HeroMinus'
                            onClick={() => updateFontSize(fontSize - 1)}
                            isDisable={fontSize <= 12}
                        />
                        <Button isDisable>{fontSize}</Button>
                        <Button
                            icon='HeroPlus'
                            onClick={() => updateFontSize(fontSize + 1)}
                            isDisable={fontSize >= 18}
                        />
                    </ButtonGroup>
                </DropdownItem>
                <DropdownItem className='flex flex-col !items-start'>
                    <div className="mb-2">Tema del sistema:</div>
                    <ButtonGroup>
                        <Button
                            icon='HeroMoon'
                            onClick={() => setDarkModeStatus(DARK_MODE.DARK)}
                            isActive={isDark}
                            variant={isDark ? 'solid' : 'outline'}
                            className='border-none'
                        />
                        <Button
                            icon='HeroSun'
                            onClick={() => setDarkModeStatus(DARK_MODE.LIGHT)}
                            isActive={isLight}
                            variant={isLight ? 'solid' : 'outline'}
                            className='border-none'
                        />
                        <Button
                            icon='HeroComputerDesktop'
                            onClick={() => setDarkModeStatus(DARK_MODE.SYSTEM)}
                            isActive={isSystem}
                            variant={isSystem ? 'solid' : 'outline'}
                            className='border-none'
                        />
                    </ButtonGroup>
                   
                </DropdownItem>
                <DropdownItem className='flex flex-col !items-start'>
                    <div className="mb-2">Color del Tema:</div>
                    <ColorSelector onColorChange={handleColorChange} />
                </DropdownItem>
            </DropdownMenu>

            {/* Modal de selector de empresa - Ya no necesario, movido a dropdown directo */}
            {/* <CompanySelector
        isOpen={isCompanySelectorOpen}
        onClose={() => setIsCompanySelectorOpen(false)}
    /> */}
        </Dropdown>
    );
};

export default SettingsPartial;