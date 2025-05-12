export interface IItem {
    id: number
    datos_categoria: null | ICategoria
    datos_fabricante: null | IFabricante
    imagenes: IImagen[]
    unidad_label: string
    fecha_creacion: string
    fecha_modificacion: string
    nombre: string
    descripcion_corta: null | string
    tamanio: null | number
    unidad: string
    perecible: boolean
    fabricante: null | number
    categoria: number
}

export interface IImagen{
    id: number
    item: number
    imagen: string
}

export interface ICategoria {
    id: number;
    fecha_creacion: string;
    fecha_modificacion: string;
    nombre: string;
}

export interface IFabricante {
    id: number;
    nombre: string;
    pagina_web: string | null;
    email_soporte: string | null;
    telefono_soporte: string | null;
}

// export interface IProveedor {
//     id: number
//     fecha_creacion: string
//     fecha_modificacion: string
//     nombre: string
//     rut: string
//     direccion: string
//     region: number
//     provincia: number
//     comuna: number
//     pagina_web: null | string
//     telefono: null | string
// }

export interface IProveedorEmpresa {
    id: number
    fecha_creacion: string
    fecha_modificacion: string
    nombre: string
    rut: string
    direccion: string
    region: number
    provincia: number
    comuna: number
    pagina_web: string | null
    telefono: string | null
    ejecutivo_asignado: string | null
    email_ejecutivo: string | null
    catalogo_web: string | null
    empresa: number
}

export interface IItemEmpresa {
    id: number
    datos_categoria: null | ICategoria
    datos_fabricante: null | IFabricante
    unidad_label: string
    nombre: string
    descripcion_corta: null | string
    tamanio: null | number
    unidad: string
    perecible: boolean
    fabricante: null | number
    categoria: number
    fecha_creacion: string
    fecha_modificacion: string
    comentarios: number
    empresa: number
    proveedores_empresa: number[]
    datos_proveedores: IProveedorEmpresa[]
}