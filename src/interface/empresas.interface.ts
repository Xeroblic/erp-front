export interface IUsuarioEmpresa {
  id: number;
  nombre: string;
  email: string;
  activado: boolean;
  token_activacion?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ISucursal {
  id: number;
  subempresa_id: number;
  nombre: string;
  direccion?: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
  usuarios?: IUsuarioEmpresa[];
}

export interface ISubempresa {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  sucursales?: ISucursal[];
}

export interface IEmpresa {
  id: number;
  nombre: string;
  rut: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
  subempresas?: ISubempresa[];
}
