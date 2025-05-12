import React from 'react';
import { RouteProps } from 'react-router-dom';
import DefaultFooterTemplate from '../templates/layouts/Footers/DefaultFooter.template';
import { authPages } from '../config/pages.config';

const footerRoutes: RouteProps[] = [
	{ path: authPages.loginPage.to, element: null },
	{ path: authPages.aceptarInvitacionEmpresa.to, element: null},
	{ path: authPages.RecuperarPassword.to, element: null},
	{ path: authPages.ConfirmarNuevaPass.to, element: null},
	{ path: '*', element: <DefaultFooterTemplate /> },
];

export default footerRoutes;
