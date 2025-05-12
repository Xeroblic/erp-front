
export interface ICliente {
    id: number;
    empresa: number;
    nombre: string;
    direccion_principal: string;
    sitio_web?: string;
    logo: string;
    firma_empresa: string;
}

export interface ISucursalCliente {
    id: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    region: number;
    provincia: number;
    comuna: number;
    cliente: number;
}