import { RouteProps } from 'react-router-dom';
import DefaultHeaderTemplate from '../templates/layouts/Headers/DefaultHeader.template';
import { authPages } from '../config/pages.config';


const headerRoutes: RouteProps[] = [
	{ path: authPages.aceptarInvitacionEmpresa.to, element: null},
	{ path: authPages.loginPage.to, element: null },
	{ path: authPages.RecuperarPassword.to, element: null},
	{ path: authPages.ConfirmarNuevaPass.to, element: null},
	{
		path: '',
		element: null,
	},
	{ path: '*', element: <DefaultHeaderTemplate /> },
];

export default headerRoutes;
