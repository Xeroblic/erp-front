import { IItemEmpresa } from "./items.interface"

export interface IBodega {
    id: number
    nombre: string
    fecha_creacion: string
    fecha_modificacion: string
    sucursal: number
}

export interface IItemEnOrdenCompra {
    id: number
    item_empresa: IItemEmpresa
    fecha_creacion: string
    fecha_modificacion: string
    cantidad: number
    precio: number
    orden_compra: number
    item: number
}

export interface IOrdenCompra {
    id: number
    items: number[]
    datos_item: IItemEnOrdenCompra[]
    fecha_creacion: string
    fecha_modificacion: string
    codigo: string
    observaciones: string
    estado: string
    proveedor: number
    sucursal: number
    creado_por: number
    nombre_proveedor: string
    estado_label: string
    cotizacion: string
    nombre_cotizacion: string
}