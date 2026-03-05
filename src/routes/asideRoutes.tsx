import { RouteProps } from 'react-router-dom';
import DefaultAsideTemplate from '../templates/layouts/Asides/DefaultAside.template';
import { authPages } from '../config/pages.config';

const asideRoutes: RouteProps[] = [
	{ path: authPages.loginPage.to, element: null },
	{ path: authPages.aceptarInvitacion.to, element: null },
	{ path: '/usuarios/activar/:token', element: null },
	{ path: authPages.recuperarPassword.to, element: null },
	{ path: authPages.confirmarNuevaPass.to, element: null },
	{ path: authPages.portalPedidos.to, element: null },
	{ path: '*', element: <DefaultAsideTemplate /> },
];

export default asideRoutes;
