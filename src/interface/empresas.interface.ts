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
  usuarios: IUsuarioEmpresa[];
}

export interface IBranch {
  id: number;
  branch_name: string;
}

export interface ISubempresa {
  id: number;
  company_id: number;
  name: string;
  rut?: string;
  website?: string;
  phone?: string;
  address?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  status?: string | number | boolean;
  sucursales: ISucursal[];
  branches?: IBranch[]; // Nueva propiedad para la estructura del backend
  branches_count?: number;
}

export interface IEmpresa {
  id: number;
  company_name: string;
  company_rut: string;
  company_website?: string;
  company_phone?: string;
  representative_name?: string;
  contact_email?: string;
  company_address?: string;
  business_activity?: string;
  legal_name?: string;
  company_logo?: string | null;
  is_active: boolean;
  company_type?: string;
  created_at: string;
  updated_at: string;
  subsidiaries: ISubempresa[];
  // branches and users can be added if needed, depending on API response
  // branches?: ISucursal[];
  // users?: IUsuarioEmpresa[];
  pivot?: {
    rol_id: number;
    empresa_id: number;
    usuario_id: number;
  };
}
