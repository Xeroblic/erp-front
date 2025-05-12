import React, { FC, ReactNode, useEffect } from 'react';
import classNames from 'classnames';
import { Navigate } from 'react-router-dom';
import { authPages } from '../../../config/pages.config';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { obtenerPersonalizacionThunk, useAppDispatch, useAppSelector } from '@/store';
import { listaComunasThunk, listaProvinciasThunk, listaRegionesThunk } from '@/store/slices/core/coreSlice';
import useAuthority from '@/hooks/useAuthority';
import useFontSize from '@/hooks/useFontSize';
import useDarkMode from '@/hooks/useDarkMode';

interface IPageWrapperProps {
	children: ReactNode;
	className?: string;
	isProtectedRoute?: boolean;
	title?: string;
	name?: string;
}

const PageWrapper: FC<IPageWrapperProps> = (props) => {
	const dispatch = useAppDispatch()
	const { fontSize, setFontSize } = useFontSize();
	const { darkModeStatus, setDarkModeStatus } = useDarkMode();
	const { children, className, isProtectedRoute, title, name, ...rest } = props;
	const { isAuthenticated, access, personalizacionUsuario, userMe } = useAppSelector((state) => state.auth)
	const { listaComunas, listaProvincias, listaRegiones } = useAppSelector((state) => state.core)

	useDocumentTitle({ title, name });

	useEffect(() => {
		if (isProtectedRoute && isAuthenticated) {
			if (listaComunas.length === 0 || listaProvincias.length === 0 || listaRegiones.length === 0) {
				dispatch(listaRegionesThunk())
				dispatch(listaProvinciasThunk())
				dispatch(listaComunasThunk())
			}
			if (personalizacionUsuario === undefined && userMe) {
				dispatch(obtenerPersonalizacionThunk({access}))
			}
		}
	}, [isAuthenticated, access, isProtectedRoute, userMe])

	useEffect(() => {
		if (personalizacionUsuario) {
			if (personalizacionUsuario.font_size !== fontSize) {
				setFontSize(personalizacionUsuario.font_size);
			}
			if (personalizacionUsuario.tema) {
				const tema =
					personalizacionUsuario.tema === "1"
						? "light"
						: personalizacionUsuario.tema === "2"
						? "dark"
						: personalizacionUsuario.tema === "3"
						? "system"
						: "system";
				setDarkModeStatus(tema);
			}
		}
	}, [personalizacionUsuario]);
	
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
