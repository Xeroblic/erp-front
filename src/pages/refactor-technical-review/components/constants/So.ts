export type TipoDispositivo = 'Notebook' | 'AIO' | 'Desktop'; // Kept for type compatibility if needed, but not used in hierarchy
export type MarcaSistema = 'Microsoft' | 'Apple' | 'Linux' | 'Google';

export interface EdicionSistema {
	id: string;
	nombre: string;
	descripcion?: string;
}

export interface VersionSistema {
	id: string;
	nombre: string;
	año?: number;
	modelos: EdicionSistema[];
}

export interface FamiliaSistema {
	id: string;
	nombre: string;
	descripcion?: string;
	generaciones: VersionSistema[];
}

export interface MarcaData {
	id: string;
	nombre: MarcaSistema;
	familias: FamiliaSistema[];
}

// Helpers for Data (Suffix removed as IDs are now global)
const getCommonWindowsData = (): FamiliaSistema => ({
	id: 'windows',
	nombre: 'Windows',
	descripcion: 'Sistema Operativo Microsoft',
	generaciones: [
		{
			id: 'win11',
			nombre: 'Windows 11',
			año: 2021,
			modelos: [
				{ id: 'win11-home', nombre: 'Home' },
				{ id: 'win11-pro', nombre: 'Pro' },
				{ id: 'win11-enterprise', nombre: 'Enterprise' },
				{ id: 'win11-education', nombre: 'Education' },
			],
		},
		{
			id: 'win10',
			nombre: 'Windows 10',
			año: 2015,
			modelos: [
				{ id: 'win10-home', nombre: 'Home' },
				{ id: 'win10-pro', nombre: 'Pro' },
				{ id: 'win10-enterprise', nombre: 'Enterprise' },
				{ id: 'win10-s', nombre: 'S Mode' },
			],
		},
		{
			id: 'win81',
			nombre: 'Windows 8.1',
			año: 2013,
			modelos: [
				{ id: 'win81-core', nombre: 'Core / Standard' },
				{ id: 'win81-pro', nombre: 'Pro' },
			],
		},
		{
			id: 'win7',
			nombre: 'Windows 7',
			año: 2009,
			modelos: [
				{ id: 'win7-home-prem', nombre: 'Home Premium' },
				{ id: 'win7-pro', nombre: 'Professional' },
				{ id: 'win7-ultimate', nombre: 'Ultimate' },
			],
		},
	],
});

const getCommonMacData = (): FamiliaSistema => ({
	id: 'macos',
	nombre: 'macOS',
	descripcion: 'Sistema Operativo Apple',
	generaciones: [
		{
			id: 'macos-15',
			nombre: 'macOS Sequoia (15)',
			año: 2024,
			modelos: [{ id: 'macos-15-base', nombre: 'Standard' }],
		},
		{
			id: 'macos-14',
			nombre: 'macOS Sonoma (14)',
			año: 2023,
			modelos: [{ id: 'macos-14-base', nombre: 'Standard' }],
		},
		{
			id: 'macos-13',
			nombre: 'macOS Ventura (13)',
			año: 2022,
			modelos: [{ id: 'macos-13-base', nombre: 'Standard' }],
		},
		{
			id: 'macos-12',
			nombre: 'macOS Monterey (12)',
			año: 2021,
			modelos: [{ id: 'macos-12-base', nombre: 'Standard' }],
		},
		{
			id: 'macos-11',
			nombre: 'macOS Big Sur (11)',
			año: 2020,
			modelos: [{ id: 'macos-11-base', nombre: 'Standard' }],
		},
		{
			id: 'macos-10-15',
			nombre: 'macOS Catalina (10.15)',
			año: 2019,
			modelos: [{ id: 'macos-10-15-base', nombre: 'Standard' }],
		},
	],
});

const getCommonLinuxData = (): FamiliaSistema => ({
	id: 'linux',
	nombre: 'Linux',
	descripcion: 'Open Source',
	generaciones: [
		{
			id: 'ubuntu',
			nombre: 'Ubuntu',
			modelos: [
				{ id: 'ubuntu-2404', nombre: '24.04 LTS' },
				{ id: 'ubuntu-2204', nombre: '22.04 LTS' },
				{ id: 'ubuntu-other', nombre: 'Otra Versión' },
			],
		},
		{
			id: 'linux-other',
			nombre: 'Otros / Genérico',
			modelos: [
				{ id: 'linux-fedora', nombre: 'Fedora' },
				{ id: 'linux-debian', nombre: 'Debian' },
				{ id: 'linux-mint', nombre: 'Mint' },
				{ id: 'linux-generic', nombre: 'Genérico' },
			],
		},
	],
});

const getChromeOSData = (): FamiliaSistema => ({
	id: 'chromeos',
	nombre: 'ChromeOS',
	descripcion: 'Google OS',
	generaciones: [
		{
			id: 'chromeos-std',
			nombre: 'ChromeOS',
			modelos: [
				{ id: 'chromeos-flex', nombre: 'Flex' },
				{ id: 'chromeos-enterprise', nombre: 'Enterprise' },
				{ id: 'chromeos-base', nombre: 'Standard' },
			],
		},
	],
});

// Single Source of Truth - No Device Type Dependency
export const SO_DATA: MarcaData[] = [
	{
		id: 'microsoft',
		nombre: 'Microsoft',
		familias: [getCommonWindowsData()],
	},
	{
		id: 'apple',
		nombre: 'Apple',
		familias: [getCommonMacData()],
	},
	{
		id: 'linux',
		nombre: 'Linux',
		familias: [getCommonLinuxData()],
	},
	{
		id: 'google',
		nombre: 'Google',
		familias: [getChromeOSData()],
	},
];

// Simplified Helpers
export const getMarcas = (): MarcaData[] => {
	return SO_DATA;
};

export const getFamiliasPorMarca = (marcaNombre: MarcaSistema): FamiliaSistema[] => {
	const marca = SO_DATA.find((m) => m.nombre === marcaNombre);
	return marca ? marca.familias : [];
};

export const getVersionesPorFamilia = (
	marcaNombre: MarcaSistema,
	familiaId: string,
): VersionSistema[] => {
	const familias = getFamiliasPorMarca(marcaNombre);
	const familia = familias.find((f) => f.id === familiaId);
	return familia ? familia.generaciones : [];
};

export const getEdicionesPorVersion = (
	marcaNombre: MarcaSistema,
	familiaId: string,
	versionId: string,
): EdicionSistema[] => {
	const versiones = getVersionesPorFamilia(marcaNombre, familiaId);
	const version = versiones.find((v) => v.id === versionId);
	return version ? version.modelos : [];
};
