import React from 'react';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../../../components/ui/Dropdown';
import Button from '../../../../components/ui/Button';
import ButtonGroup from '../../../../components/ui/ButtonGroup';
import DARK_MODE from '../../../../constants/darkMode.constant';
import useFontSize from '../../../../hooks/useFontSize';
import useDarkMode from '../../../../hooks/useDarkMode';
import { useAppDispatch, useAppSelector } from '@/store';
import { actualizarPersonalizacionThunk } from '@/store/slices/auth/authSlice';
import { toast } from 'react-toastify';

const SettingsPartial = () => {
  const dispatch = useAppDispatch();
  const { fontSize, setFontSize } = useFontSize();
  const { darkModeStatus, setDarkModeStatus } = useDarkMode();
  const { user } = useAppSelector((state) => state.auth);
  const personalizacion = user?.personalizacion;

  const updatePersonalizacion = async (tema: string, size: number) => {
    try {
      await dispatch(actualizarPersonalizacionThunk({ tema, font_size: size })).unwrap();
    } catch (error: any) {
      toast.error(error || 'No se pudo actualizar la personalización');
    }
  };

  return (
    <Dropdown>
      <DropdownToggle hasIcon={false}>
        <Button icon='HeroCog8Tooth' aria-label='Settings' />
      </DropdownToggle>
      <DropdownMenu placement='bottom-end'>
        <DropdownItem className='flex flex-col !items-start'>
          <div>Tamaño de Fuente:</div>
          <ButtonGroup>
            <Button
              icon='HeroMinus'
              onClick={() => {
                const newSize = fontSize - 1;
                setFontSize(newSize);
                updatePersonalizacion(personalizacion?.tema || '3', newSize);
              }}
              isDisable={fontSize <= 12}
            />
            <Button isDisable>{fontSize}</Button>
            <Button
              icon='HeroPlus'
              onClick={() => {
                const newSize = fontSize + 1;
                setFontSize(newSize);
                updatePersonalizacion(personalizacion?.tema || '3', newSize);
              }}
              isDisable={fontSize >= 18}
            />
          </ButtonGroup>
        </DropdownItem>
        <DropdownItem className='flex flex-col !items-start'>
          <div>Dark Mode:</div>
          <ButtonGroup>
            <Button
              icon='HeroMoon'
              onClick={() => {
                setDarkModeStatus(DARK_MODE.DARK);
                updatePersonalizacion('2', fontSize);
              }}
              isActive={darkModeStatus === DARK_MODE.DARK}
            />
            <Button
              icon='HeroSun'
              onClick={() => {
                setDarkModeStatus(DARK_MODE.LIGHT);
                updatePersonalizacion('1', fontSize);
              }}
              isActive={darkModeStatus === DARK_MODE.LIGHT}
            />
            <Button
              icon='HeroComputerDesktop'
              onClick={() => {
                setDarkModeStatus(DARK_MODE.SYSTEM);
                updatePersonalizacion('3', fontSize);
              }}
              isActive={darkModeStatus === DARK_MODE.SYSTEM}
            />
          </ButtonGroup>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default SettingsPartial;