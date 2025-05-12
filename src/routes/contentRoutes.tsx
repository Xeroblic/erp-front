import { lazy } from 'react';
import { RouteProps } from 'react-router-dom';
import { authPages, Pages } from '../config/pages.config';
import NotFoundPage from '../pages/NotFound.page';
import SinPermisos from '@/pages/SinPermisos';
import LoginPage from '../pages/Login.page';
import RecuperarPassword from '@/pages/ResetPassword/RecuperarPassword';
import ConfirmarNuevaPass from '@/pages/ResetPassword/ConfirmarNuevaPass';

const ProfilePage = lazy(() => import('../pages/Profile.page'));
const Home = lazy(() => import('@/pages/Home'))
// const ListaInvitacionesEmpresa = lazy(() => import('@/pages/InvitacionEmpresa/ListaInvitacionesEmpresa'))
// const DetalleSolicitudVacaciones = lazy(() => import('@/pages/Calendario/DetalleSolicitudVacaciones'))

const Foro = lazy(() => import('@/pages/Foro/Foro'))
export type IRoutePersonalizadas = RouteProps & {
	authority: string[]
}

const contentRoutes: IRoutePersonalizadas[] = [
	{ path: authPages.loginPage.to, element: <LoginPage />, authority: authPages.loginPage.autority },
	{ path: authPages.profilePage.to, element: <ProfilePage />, authority: authPages.profilePage.autority },
	// { path: authPages.aceptarInvitacionEmpresa.to, element: <AceptarInvitacionEmpresa />, authority: authPages.aceptarInvitacionEmpresa.authority },
	// { path: Pages.listaInvitacionesEmpresas.to, element: <ListaInvitacionesEmpresa />, authority: Pages.listaInvitacionesEmpresas.authority },
	{ path: Pages.Foro.to, element: <Foro />, authority: Pages.Foro.authority },
	{ path: authPages.RecuperarPassword.to, element: <RecuperarPassword />, authority: authPages.RecuperarPassword.authority },
	{ path: authPages.ConfirmarNuevaPass.to, element: <ConfirmarNuevaPass />, authority: authPages.ConfirmarNuevaPass.authority },
	{ path: '/', element: <Home />, authority: [] },
	{ path: '*', element: <NotFoundPage />, authority: [] },
	{ path: '/sin-permisos', element: <SinPermisos />, authority: [] },
];

export default contentRoutes;
