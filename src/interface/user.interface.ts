export interface IPersonalizacionUsuario {
  id: number;
  fecha_creacion: string;
  fecha_modificacion: string;
  tema: number;          // "1" | "2" | "3"
  font_size: number;
  tcolor: string;
  tcolor_int: string;
  dark_mode: number;
  usuario: number;
  sucursal_principal: number | null;
  empresa: number | null;
}

export interface IUserMe {
  id: number;
  email: string;
  first_name: string;
  middle_name: string | null;
  second_name?: string | null;
  last_name: string;
  second_last_name: string | null;
  position: string | null;
  rut: string | null;
  phone_number: string | null;
  celular?: string | null;
  address: string | null;
  direccion?: string | null;
  gender: string | null;
  is_active: boolean;
  image: string | null;
  branch_id: number | null;
  // Nuevos campos para multi-empresa
  companies?: Array<{
    id: number;
    name: string;
    rut: string;
    role: string;
    is_primary: boolean;
  }>;
  company?: {
    id: number;
    name: string;
    rut?: string;
  } | null;
  subsidiary?: {
    id: number;
    name: string;
  } | null;
  branch?: {
    id: number;
    name: string;
  } | null;
  region?: number;
  provincia?: number;
  comuna?: number;
  authority: string[];
  roles?: string[];
  permisos?: string[];
  personalizacion?: IPersonalizacionUsuario;
}


export interface IGruposUsuarios {
  grupos: string[]
}