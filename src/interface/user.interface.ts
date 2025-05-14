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
  email: string;
  first_name: string;
  second_name: string | null;
  last_name: string;
  second_last_name: string | null;
  rut: string | null;
  celular: string | null;
  genero: string;
  fecha_nacimiento: string | null;
  is_staff: boolean;
  pk: number;
  image: string | null;
  estado_civil: string | null;
  nacionalidad: string | null;
  fecha_ingreso: string | null;
  fecha_contrato: string | null;
  fono_fijo: string | null;
  cargo: string | null;
  direccion: string | null;
  region: number;
  provincia: number;
  comuna: number;
  // Nuevas propiedades desde el slice de Auth
  authority: string[];                       // mapeado desde permisos
  personalizacion?: IPersonalizacionUsuario; // cargada tras obtenerPersonalizacionThunk
}


export interface IGruposUsuarios {
    grupos: string[]
}