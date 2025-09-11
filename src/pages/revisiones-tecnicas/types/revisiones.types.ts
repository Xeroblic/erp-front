// src/pages/revisiones-tecnicas/types/revisiones.types.ts

// Tipos de equipos disponibles
export type TipoEquipo = 'notebook' | 'desktop' | 'aio' | 'monitor' | 'docking';

// Categorías de equipos
export type CategoriaEquipo = 'A' | 'B' | 'C' | 'M';

// Estados de componentes
export type EstadoComponente = 'excelente' | 'bueno' | 'regular' | 'malo' | 'no_funciona';

// Tipos de RAM
export type TipoRAM = 'DDR3' | 'DDR4' | 'DDR5' | 'SO-DIMM DDR3' | 'SO-DIMM DDR4' | 'SO-DIMM DDR5';

// Tecnologías de disco
export type TecnologiaDisco = 'HDD' | 'SSD' | 'NVME' | 'eMMC' | 'Hibrido';

// Sistemas operativos
export type SistemaOperativo = 'Windows 11' | 'Windows 10' | 'Windows 8.1' | 'Windows 7' | 'macOS' | 'Linux Ubuntu' | 'Linux' | 'Chrome OS' | 'Sin OS';

// Tipos de panel para monitores
export type TipoPanel = 'IPS' | 'TN' | 'VA' | 'OLED' | 'QLED' | 'Otro';

// Interface base para revisión técnica
export interface IRevisionTecnicaBase {
    id: number;
    // Campos generales obligatorios
    tipo_equipo: TipoEquipo;
    marca: string;
    modelo: string;
    numero_serie: string;
    diagnostico_general: string;
    categoria_equipo: CategoriaEquipo;

    // Campos generales opcionales
    linea_serie?: string;
    codigo_barras_interno?: string;
    cliente?: string;
    proveedor?: string;
    observaciones_tecnicas?: string;
    adjunto_fotos: boolean;

    // Metadatos
    fecha_creacion: string;
    fecha_actualizacion: string;
    tecnico_responsable: string;
    tecnico_responsable_id: number;
    estado: 'activa' | 'completada' | 'cancelada';
}

// Especificaciones específicas por tipo de equipo

// Notebooks
export interface IEspecificacionesNotebook {
    // Hardware obligatorio
    procesador: string;
    memoria_ram_gb: number;
    slots_ram_usados: number;
    tipo_ram: TipoRAM;
    almacenamiento_capacidad_gb: number;
    tecnologia_disco: TecnologiaDisco;
    sistema_operativo: SistemaOperativo;

    // Conectividad obligatoria
    incluye_cargador: boolean;
    tiene_vga: boolean;
    tiene_hdmi: boolean;
    tiene_displayport: boolean;
    cantidad_puertos_usb: number;
    tiene_usb_tipo_c: boolean;
    tiene_lector_sd: boolean;
    tiene_wifi: boolean;
    tiene_bluetooth: boolean;
    tiene_rj45: boolean;
    tiene_lector_cd_dvd: boolean;

    // Pantalla obligatoria
    tamano_pantalla_pulgadas: number;
    resolucion_pantalla: string;
    estado_pantalla: EstadoComponente;
    estado_touchscreen: EstadoComponente | 'no_aplica';

    // Estados físicos obligatorios
    estado_touchpad: EstadoComponente;
    estado_teclado: EstadoComponente;
    estado_cubierta_superior: EstadoComponente;
    estado_bisagras: EstadoComponente;
    estado_tapa_inferior: EstadoComponente;
    estado_bateria: EstadoComponente;
}

// Desktops
export interface IEspecificacionesDesktop {
    // Hardware obligatorio
    procesador: string;
    memoria_ram_gb: number;
    slots_ram_usados: number;
    tipo_ram: TipoRAM;
    almacenamiento_capacidad_gb: number;
    tecnologia_disco: TecnologiaDisco;
    sistema_operativo: SistemaOperativo;

    // Conectividad
    tiene_vga: boolean;
    tiene_hdmi: boolean;
    tiene_displayport: boolean;
    cantidad_puertos_usb: number;
    tiene_usb_tipo_c: boolean;
    tiene_lector_sd: boolean;
    tiene_wifi: boolean;
    tiene_bluetooth: boolean;
    tiene_rj45: boolean;
    tiene_lector_cd_dvd: boolean;
}

// All-in-One
export interface IEspecificacionesAIO {
    // Hardware obligatorio
    procesador: string;
    memoria_ram_gb: number;
    slots_ram_usados: number;
    tipo_ram: TipoRAM;
    almacenamiento_capacidad_gb: number;
    tecnologia_disco: TecnologiaDisco;
    sistema_operativo: SistemaOperativo;

    // Pantalla
    tamano_pantalla_pulgadas: number;
    resolucion_pantalla: string;
    estado_pantalla: EstadoComponente;

    // Conectividad
    incluye_cargador: boolean;
    tiene_vga: boolean;
    tiene_hdmi: boolean;
    tiene_displayport: boolean;
    cantidad_puertos_usb: number;
    tiene_usb_tipo_c: boolean;
    tiene_lector_sd: boolean;
    tiene_wifi: boolean;
    tiene_bluetooth: boolean;
    tiene_rj45: boolean;

    // Estado físico
    estado_bateria: EstadoComponente | 'no_aplica';
}

// Monitores
export interface IEspecificacionesMonitor {
    // Pantalla obligatoria
    tamano_pantalla_pulgadas: number;
    resolucion: string;
    tipo_panel: TipoPanel;

    // Conectividad
    entrada_hdmi: boolean;
    entrada_vga: boolean;
    entrada_displayport: boolean;

    // Características físicas
    ajuste_altura: boolean;
    rotacion_pantalla: boolean;

    // Estados físicos obligatorios
    estado_pantalla: EstadoComponente;
    estado_marco: EstadoComponente;
    estado_base_soporte: EstadoComponente;
}

// Docking Stations
export interface IEspecificacionesDocking {
    // Conectividad
    salida_vga: boolean;
    puertos_hdmi: number;
    puertos_displayport: number;
    puertos_usb: number;
    puertos_usb_tipo_c: number;
    lector_tarjetas_sd: boolean;
    tiene_wifi: boolean;
    puerto_rj45: boolean;

    // Estado físico
    estado_carcasa: EstadoComponente;
}

// Union type para especificaciones
export type EspecificacionesPorTipo =
    | IEspecificacionesNotebook
    | IEspecificacionesDesktop
    | IEspecificacionesAIO
    | IEspecificacionesMonitor
    | IEspecificacionesDocking;

// Interface completa de revisión técnica
export interface IRevisionTecnica extends IRevisionTecnicaBase {
    especificaciones: EspecificacionesPorTipo;
}

// Interfaces para formularios
export interface IRevisionFormData extends Omit<IRevisionTecnicaBase, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'tecnico_responsable' | 'tecnico_responsable_id' | 'estado'> {
    especificaciones: Partial<EspecificacionesPorTipo>;
}

// Filtros para el listado
export interface IRevisionFilters {
    busqueda: string;
    tipo_equipo: TipoEquipo | '';
    categoria: CategoriaEquipo | '';
    estado: 'activa' | 'completada' | 'cancelada' | '';
    tecnico_responsable: string;
    fecha_desde: string;
    fecha_hasta: string;
}

// Estadísticas del dashboard
export interface IRevisionStats {
    total: number;
    activas: number;
    completadas: number;
    canceladas: number;
    por_tipo: Record<TipoEquipo, number>;
    por_categoria: Record<CategoriaEquipo, number>;
}

// Payload para crear/actualizar
export interface ICreateRevisionPayload extends Omit<IRevisionFormData, 'adjunto_fotos'> {
    adjunto_fotos: boolean;
}

export interface IUpdateRevisionPayload extends ICreateRevisionPayload {
    id: number;
}

// Constantes para formularios
export const TIPOS_EQUIPO = [
    { value: 'notebook', label: 'Notebook' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'aio', label: 'All-in-One (AIO)' },
    { value: 'monitor', label: 'Monitor' },
    { value: 'docking', label: 'Docking Station' },
] as const;

export const CATEGORIAS_EQUIPO = [
    { value: 'A', label: 'Categoría A' },
    { value: 'B', label: 'Categoría B' },
    { value: 'C', label: 'Categoría C' },
    { value: 'M', label: 'Categoría M' },
] as const;

export const ESTADOS_COMPONENTE = [
    { value: 'excelente', label: 'Excelente' },
    { value: 'bueno', label: 'Bueno' },
    { value: 'regular', label: 'Regular' },
    { value: 'malo', label: 'Malo' },
    { value: 'no_funciona', label: 'No Funciona' },
] as const;

export const TIPOS_RAM = [
    { value: 'DDR3', label: 'DDR3' },
    { value: 'DDR4', label: 'DDR4' },
    { value: 'DDR5', label: 'DDR5' },
    { value: 'SO-DIMM DDR3', label: 'SO-DIMM DDR3' },
    { value: 'SO-DIMM DDR4', label: 'SO-DIMM DDR4' },
    { value: 'SO-DIMM DDR5', label: 'SO-DIMM DDR5' },
] as const;

export const TECNOLOGIAS_DISCO = [
    { value: 'HDD', label: 'HDD (Disco Duro)' },
    { value: 'SSD', label: 'SSD (Estado Sólido)' },
    { value: 'NVME', label: 'NVMe (M.2)' },
    { value: 'eMMC', label: 'eMMC' },
    { value: 'Hibrido', label: 'Híbrido' },
] as const;

export const SISTEMAS_OPERATIVOS = [
    { value: 'Windows 11', label: 'Windows 11' },
    { value: 'Windows 10', label: 'Windows 10' },
    { value: 'Windows 8.1', label: 'Windows 8.1' },
    { value: 'Windows 7', label: 'Windows 7' },
    { value: 'macOS', label: 'macOS' },
    { value: 'Linux Ubuntu', label: 'Linux Ubuntu' },
    { value: 'Linux', label: 'Linux (Otra distribución)' },
    { value: 'Chrome OS', label: 'Chrome OS' },
    { value: 'Sin OS', label: 'Sin Sistema Operativo' },
] as const;

export const TIPOS_PANEL = [
    { value: 'IPS', label: 'IPS' },
    { value: 'TN', label: 'TN' },
    { value: 'VA', label: 'VA' },
    { value: 'OLED', label: 'OLED' },
    { value: 'QLED', label: 'QLED' },
    { value: 'Otro', label: 'Otro' },
] as const;

export const ESTADOS_REVISION = [
    { value: 'activa', label: 'Activa' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
] as const;

// Función para obtener color de badge según el tipo
export const getTipoEquipoColor = (tipo: TipoEquipo): string => {
    const colors = {
        notebook: 'blue',
        desktop: 'green',
        aio: 'purple',
        monitor: 'orange',
        docking: 'indigo',
    };
    return colors[tipo] || 'gray';
};

// Función para obtener color de badge según la categoría
export const getCategoriaColor = (categoria: CategoriaEquipo): string => {
    const colors = {
        A: 'emerald',
        B: 'blue',
        C: 'amber',
        M: 'red',
    };
    return colors[categoria] || 'gray';
};

// Función para obtener color de badge según el estado
export const getEstadoColor = (estado: string): string => {
    const colors = {
        activa: 'blue',
        completada: 'emerald',
        cancelada: 'red',
    };
    return colors[estado] || 'gray';
};

// Función para obtener color según estado de componente
export const getEstadoComponenteColor = (estado: EstadoComponente | string): string => {
    const colors = {
        excelente: 'emerald',
        bueno: 'green',
        regular: 'amber',
        malo: 'orange',
        no_funciona: 'red',
        no_aplica: 'gray',
    };
    return colors[estado] || 'gray';
};
