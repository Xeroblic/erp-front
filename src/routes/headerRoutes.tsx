import { RouteProps } from 'react-router-dom';
import DefaultHeaderTemplate from '../templates/layouts/Headers/DefaultHeader.template';
import { authPages } from '../config/pages.config';

const headerRoutes: RouteProps[] = [
	{ path: authPages.loginPage.to, element: null },
	{ path: authPages.aceptarInvitacion.to, element: null },
	{ path: '/usuarios/activar/:token', element: null },
	{ path: authPages.recuperarPassword.to, element: null },
	{ path: authPages.confirmarNuevaPass.to, element: null },
	{ path: authPages.portalPedidos.to, element: null },
	{ path: authPages.portalPedidosMock.to, element: null },
	{ path: authPages.FormularioLockCare.to, element: null },
	{ path: authPages.FormularioLockCare.subPages.publicLockCare.to, element: null },
	{ path: '*', element: <DefaultHeaderTemplate /> },
];

export default headerRoutes;
