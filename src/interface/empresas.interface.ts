export interface IEmpresa {
    id: number
    sucursales: {
        id: number
        nombre: string
        direccion: string
        telefono: string
        email: string
        empresa: number
    }[]
    fecha_creacion: string
    fecha_modificacion: string
    nombre: string
    sitio_web: null | string
    direccion_principal: string
}

export interface IUsuarioEmpresa {
    id: number
    nombre_usuario: string
    papeleta: {
        nombre_empleado: string
        años_servicio: number
        dias_acumulados: number
        dias_tomados: number
        dias_disponibles: number
        rut: string
        dias_corridos: {
            dias_totales: number
            formato: string
        }
    },
    fecha_creacion: string
    fecha_modificacion: string
    fecha_ingreso: string
    fecha_contrato: string
    cargo: null | string
    estado: string
    usuario: number
    sucursal: number
    email_usuario: string
    estado_label: string
}

export interface IUltimasActividadesUsuarioEmpresa {
    tipo: string
    fecha: string
    descripcion: string
}