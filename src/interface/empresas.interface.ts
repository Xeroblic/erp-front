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
  subsidiary_id?: number; // Para compatibilidad con backend
  subempresa_id?: number; // Para compatibilidad legacy
  branch_name?: string; // Campo del backend
  branch_rut?: string;
  branch_phone?: string;
  branch_address?: string;
  branch_email?: string;
  branch_manager_name?: string;
  branch_manager_phone?: string;
  branch_manager_email?: string;
  branch_status?: string | number | boolean;
  branch_created_at?: string;
  branch_updated_at?: string;

  // Campos normalizados para el frontend (mapeo de los anteriores)
  nombre?: string; // Para compatibilidad legacy
  name: string;
  rut?: string;
  phone?: string;
  address?: string;
  email?: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  status?: string | number | boolean;
  descripcion?: string;
  created_at: string;
  updated_at: string;
  direccion?: string; // Para compatibilidad legacy
  usuarios?: IUsuarioEmpresa[];

  // Información adicional de la subsidiaria
  subsidiary_name?: string;
}

export interface IBranch {
  id: number;
  branch_name: string;
}

export interface ISubempresa {
  id: number;
  company_id: number;
  subsidiary_name?: string;
  subsidiary_rut?: string;
  subsidiary_website?: string;
  subsidiary_phone?: string;
  subsidiary_address?: string;
  subsidiary_email?: string;
  subsidiary_manager_name?: string;
  subsidiary_manager_phone?: string;
  subsidiary_manager_email?: string;
  subsidiary_status?: string | number | boolean;
  subsidiary_created_at?: string;
  subsidiary_updated_at?: string;

  // Campos normalizados para el frontend (mapeo de los anteriores)
  name: string;
  rut?: string;
  website?: string;
  phone?: string;
  address?: string;
  email?: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  status?: string | number | boolean;
  created_at: string;
  updated_at: string;

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
