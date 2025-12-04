export interface Feature {
	id: number;
	clave: string;
	texto: string;
	ruta: string;
	componente: string;
	icono?: string;
	orden: number;
	grupo?: string;
	subgrupo?: string;
}
