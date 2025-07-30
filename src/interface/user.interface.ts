export interface IPersonalizacionUsuario {
  id: number;
  fecha_creacion: string;
  fecha_modificacion: string;
  tema: string;          // "1" | "2" | "3"
  font_size: number;
  usuario: number;
  sucursal_principal: number | null;
  empresa: number | null;
}

export interface IUserMe {
  id: number;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  second_last_name: string | null;
  position: string | null;
  rut: string | null;
  phone_number: string | null;
  address: string | null;
  gender: string | null;
  is_active: boolean;
  branch_id: number | null;
  company?: {
    id: number;
    name: string;
  } | null;
  subsidiary?: {
    id: number;
    name: string;
  } | null;
  branch?: {
    id: number;
    name: string;
  } | null;
  authority: string[];
  personalizacion?: IPersonalizacionUsuario;
}


export interface IGruposUsuarios {
    grupos: string[]
}