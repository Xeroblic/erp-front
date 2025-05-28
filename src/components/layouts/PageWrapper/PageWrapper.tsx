import React, { FC, ReactNode, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Navigate } from 'react-router-dom';
import { authPages } from '../../../config/pages.config';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useAppDispatch, useAppSelector } from '@/store';
import { listaComunasThunk, listaProvinciasThunk, listaRegionesThunk } from '@/store/slices/core/coreSlice';
import { userMeThunk } from '@/store/slices/auth/authSlice';
import useFontSize from '@/hooks/useFontSize';
import useDarkMode from '@/hooks/useDarkMode';

interface IPageWrapperProps {
  children: ReactNode;
  className?: string;
  isProtectedRoute?: boolean;
  title?: string;
  name?: string;
}

const PageWrapper: FC<IPageWrapperProps> = ({
  children,
  className,
  isProtectedRoute = false,
  title,
  name,
  ...rest
}) => {
  const dispatch = useAppDispatch();
  const { fontSize, setFontSize } = useFontSize();
  const { darkModeStatus, setDarkModeStatus } = useDarkMode();
  const { isAuthenticated, access, user } = useAppSelector(s => s.auth);
  const { listaComunas, listaProvincias, listaRegiones } = useAppSelector(s => s.core);

  const coreLoaded = useRef(false);
  const profileLoaded = useRef(false);

  useDocumentTitle({ title, name });

  // // 1) Solo una vez: carga regiones/provincias/comunas
  // useEffect(() => {
  //   if (!coreLoaded.current && isProtectedRoute && isAuthenticated) {
  //     dispatch(listaRegionesThunk());
  //     dispatch(listaProvinciasThunk());
  //     dispatch(listaComunasThunk());
  //     coreLoaded.current = true;
  //   }
  // }, [dispatch, isProtectedRoute, isAuthenticated]);

  // 2) Solo una vez: carga perfil (incluye personalización)
  useEffect(() => {
    if (!profileLoaded.current && isProtectedRoute && isAuthenticated && access) {
      dispatch(userMeThunk());
      profileLoaded.current = true;
    }
  }, [dispatch, isProtectedRoute, isAuthenticated, access]);

  // 3) Aplica personalización cuando llegue
  useEffect(() => {
    const pref = user?.personalizacion;
    if (pref) {
      if (pref.font_size !== fontSize) {
        setFontSize(pref.font_size);
      }
      const tema =
        pref.tema === '1'
          ? 'light'
          : pref.tema === '2'
            ? 'dark'
            : 'system';
      setDarkModeStatus(tema);
    }
  }, [user?.personalizacion, fontSize, setFontSize, setDarkModeStatus]);

  if (isProtectedRoute && !isAuthenticated) {
    return <Navigate to={authPages.loginPage.to} />;
  }

  return (
    <main
      data-component-name='PageWrapper'
      className={classNames('flex shrink-0 grow flex-col', className)}
      {...rest}>
      {children}
    </main>
  );
};

export default PageWrapper;
