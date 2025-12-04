export interface UsuarioConRolesPerms {
	id: number;
	nombre: string;
	email: string;
	roles: {
		id: number;
		slug: string;
		nombre: string;
	}[];
	permisos: {
		id: number;
		clave: string;
		descripcion: string;
	}[];
}
