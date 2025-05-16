export interface IUsuarioEmpresa {
  id: number;
  nombre: string;
  email: string;
  activado: boolean;
  token_activacion: string | null;  // si puede ser null, pero siempre existe la propiedad
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
  usuarios: IUsuarioEmpresa[];      // ya no opcional, siempre un array (quizá vacío)
}

export interface ISubempresa {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  sucursales: ISucursal[];         // idem
}

export interface IEmpresa {
  id: number;
  nombre: string;
  rut: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
  subempresas: ISubempresa[];      // idem
  pivot ?: {
    rol_id: number;
    empresa_id: number;
    usuario_id: number;
  }
}
