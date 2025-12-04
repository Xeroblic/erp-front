export interface IRegion {
	codigo: string;
	tipo: 'region';
	nombre: string;
	lat: number;
	lng: number;
	url: string;
	codigo_padre: string;
}

export interface IProvincia {
	codigo: string;
	tipo: 'provincia';
	nombre: string;
	lat: number;
	lng: number;
	url: string;
	codigo_padre: string;
}

export interface IComuna {
	codigo: string;
	tipo: 'comuna';
	nombre: string;
	lat: number;
	lng: number;
	url: string;
	codigo_padre: string;
}
