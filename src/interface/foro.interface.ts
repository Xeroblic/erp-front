export interface IUsuario {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface IForo {
    id: number;
    nombre: string;
    descripcion: string;
    imagen?: string;
    creado_por: IUsuario;
    likes: IForoLike[];
    comentarios: IComentario[];
    comentarios_count: number;
    likes_count: number;
}

export interface ICategoria {
    id: number;
    foro: IForo;
    nombre: string;
    descripcion: string;
    comentarios_count: number;
    likes_count: number;
}

export interface IComentario {
    id: number;
    contenido: string;
    usuario: {
        first_name: string;
        last_name: string;
    };
    fecha_creacion: string;
    comentario_padre?: number;
    hijos: IComentario[];
}

export interface IForoLike {
    id: number;
    usuario: IUsuario;
    foro: IForo;
    fecha_creacion: Date;
    activo: boolean;
}

export interface IComentarioLike {
    id: number;
    usuario: IUsuario;
    comentario: IComentario;
    fecha_creacion: Date;
}