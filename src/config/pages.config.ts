// import DetalleCategoria from "@/pages/Items/Registro/Categorias/DetalleCategoria";
import RecuperarPassword from "@/pages/ResetPassword/RecuperarPassword";

export const authPages = {
	loginPage: {
		id: 'loginPage',
		to: '/login',
		text: 'Login',
		icon: 'HeroArrowRightOnRectangle',
		autority: [],
	},
	profilePage: {
		id: 'profilePage',
		to: '/profile',
		text: 'Perfil',
		icon: 'HeroUser',
		autority: [],
	},
	aceptarInvitacionEmpresa: {
		id: 'aceptarInvitacionEmpresa',
		to: '/aceptar-invitacion/:token',
		text: 'Aceptar Invitacion a Empresa',
		icon: 'HeroUser',
		authority: [],
	},
	RecuperarPassword:{
		id: 'RecuperarPassword',
		to: '/recuperar-password',
		text: 'Recuperar Password',
		icon: 'HeroDocument',
		authority: []
	},
	ConfirmarNuevaPass:{
		id: 'ConfirmarNuevaPass',
		to: '/confirmar-nueva-password/:uid/:token',
		text: 'Confirmar Nueva Password',
		icon: 'HeroDocument',
		authority: []
	}
};

export const Pages = {
	Foro: {
		id: 'foro',
		to: '/foro',
		text: 'Foro',
		icon: 'HeroDocument',
		authority: []
	},
};


const pagesConfig = {
	...authPages,
	...Pages
};

export default pagesConfig;
