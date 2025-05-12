import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import ApiService from "@/services/ApiService";
import { IComentario, IForo, IForoLike, IComentarioLike, ICategoria } from "@/interface/foro.interface";

export interface ForoState {
    foros: IForo[];
    categorias: ICategoria[];
    comentarios: IComentario[];
    foroLikes: IForoLike[];
    comentarioLikes: IComentarioLike[];
    loading: boolean;
    error: string | undefined;
}

const initialState: ForoState = {
    foros: [],
    categorias: [],
    comentarios: [],
    foroLikes: [],
    comentarioLikes: [],
    loading: false,
    error: undefined,
};

export const fetchForosThunk = createAsyncThunk<IForo[], void, { rejectValue: string }>(
    "foro/fetchForosThunk",
    async (_, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IForo[]>({
                url: "/api/foros/foros/",
                method: "get",
            });
            const forosWithDetails = await Promise.all(response.data.map(async (foro) => {
                const detallesResponse = await ApiService.fetchData<{ comentarios: IComentario[], likes: IForoLike[] }>({
                    url: `/api/foros/foros/${foro.id}/detalles/`,
                    method: "get",
                });
                return {
                    ...foro,
                    comentarios: detallesResponse.data.comentarios,
                    likes: detallesResponse.data.likes,
                };
            }));
            return forosWithDetails;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createForoThunk = createAsyncThunk<IForo, { nombre: string; descripcion: string }, { rejectValue: string }>(
    "foro/createForoThunk",
    async ({ nombre, descripcion }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IForo>({
                url: "/api/foros/foros/",
                method: "post",
                data: { nombre, descripcion },
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const updateForoThunk = createAsyncThunk<IForo, { id: number; foro: IForo }, { rejectValue: string }>(
    "foro/updateForoThunk",
    async ({ id, foro }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IForo>({
                url: `/api/foros/foros/${id}/`,
                method: "put",
                data: foro as unknown as Record<string, unknown>,
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deleteForoThunk = createAsyncThunk<number, number, { rejectValue: string }>(
    "foro/deleteForoThunk",
    async (id, { rejectWithValue }) => {
        try {
            await ApiService.fetchData<void>({
                url: `/api/foros/foros/${id}/`,
                method: "delete",
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchComentariosThunk = createAsyncThunk<IComentario[], void, { rejectValue: string }>(
    "foro/fetchComentariosThunk",
    async (_, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IComentario[]>({
                url: "/api/foros/comentarios/",
                method: "get",
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createComentarioThunk = createAsyncThunk<IComentario, { contenido: string; foroId?: number; comentarioId?: number }, { rejectValue: string }>(
    "foro/createComentarioThunk",
    async ({ contenido, foroId, comentarioId }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IComentario>({
                url: "/api/foros/comentarios/",
                method: "post",
                data: { contenido, foro: foroId, comentario_padre: comentarioId },
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deleteComentarioThunk = createAsyncThunk<number, number, { rejectValue: string }>(
    "foro/deleteComentarioThunk",
    async (id, { rejectWithValue }) => {
        try {
            await ApiService.fetchData<void>({
                url: `/api/comentarios/${id}/`,
                method: "delete",
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createForoLikeThunk = createAsyncThunk<IForoLike, { foroId: number }, { rejectValue: string }>(
    "foro/createForoLikeThunk",
    async ({ foroId }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IForoLike>({
                url: `/api/foros/${foroId}/like/`,
                method: "post",
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createComentarioLikeThunk = createAsyncThunk<IComentarioLike, { comentarioId: number }, { rejectValue: string }>(
    "foro/createComentarioLikeThunk",
    async ({ comentarioId }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IComentarioLike>({
                url: `/api/comentarios/${comentarioId}/like/`,
                method: "post",
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchForoLikesThunk = createAsyncThunk<IForoLike[], void, { rejectValue: string }>(
    "foro/fetchForoLikesThunk",
    async (_, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IForoLike[]>({
                url: "/api/foros/likes/",
                method: "get",
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchComentarioLikesThunk = createAsyncThunk<IComentarioLike[], void, { rejectValue: string }>(
    "foro/fetchComentarioLikesThunk",
    async (_, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IComentarioLike[]>({
                url: "/api/comentarios/likes/",
                method: "get",
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const toggleForoLikeThunk = createAsyncThunk<IForoLike, { foroId: number, activo?: boolean }, { rejectValue: string }>(
    "foro/toggleForoLikeThunk",
    async ({ foroId, activo }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IForoLike>({
                url: `/api/foros/${foroId}/toggle-like/`,
                method: "post",
                data: { activo } 
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const foroSlice = createSlice({
    name: "foro",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchForosThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchForosThunk.fulfilled, (state, action: PayloadAction<IForo[]>) => {
                state.loading = false;
                state.foros = action.payload;
            })
            .addCase(fetchForosThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createForoThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createForoThunk.fulfilled, (state, action: PayloadAction<IForo>) => {
                state.loading = false;
                state.foros.push(action.payload);
            })
            .addCase(createForoThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateForoThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateForoThunk.fulfilled, (state, action: PayloadAction<IForo>) => {
                state.loading = false;
                const index = state.foros.findIndex((foro) => foro.id === action.payload.id);
                if (index !== -1) {
                    state.foros[index] = action.payload;
                }
            })
            .addCase(updateForoThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteForoThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteForoThunk.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.foros = state.foros.filter((foro) => foro.id !== action.payload);
            })
            .addCase(deleteForoThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchComentariosThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchComentariosThunk.fulfilled, (state, action: PayloadAction<IComentario[]>) => {
                state.loading = false;
                state.comentarios = action.payload;
            })
            .addCase(fetchComentariosThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createComentarioThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createComentarioThunk.fulfilled, (state, action: PayloadAction<IComentario>) => {
                state.loading = false;
                state.comentarios.push(action.payload);
            })
            .addCase(createComentarioThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteComentarioThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteComentarioThunk.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.comentarios = state.comentarios.filter(comentario => comentario.id !== action.payload);
            })
            .addCase(deleteComentarioThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createForoLikeThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createForoLikeThunk.fulfilled, (state, action: PayloadAction<IForoLike>) => {
                state.loading = false;
                state.foroLikes.push(action.payload);
            })
            .addCase(createForoLikeThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createComentarioLikeThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createComentarioLikeThunk.fulfilled, (state, action: PayloadAction<IComentarioLike>) => {
                state.loading = false;
                state.comentarioLikes.push(action.payload);
            })
            .addCase(createComentarioLikeThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchForoLikesThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchForoLikesThunk.fulfilled, (state, action: PayloadAction<IForoLike[]>) => {
                state.loading = false;
                state.foroLikes = action.payload;
            })
            .addCase(fetchForoLikesThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchComentarioLikesThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchComentarioLikesThunk.fulfilled, (state, action: PayloadAction<IComentarioLike[]>) => {
                state.loading = false;
                state.comentarioLikes = action.payload;
            })
            .addCase(fetchComentarioLikesThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(toggleForoLikeThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(toggleForoLikeThunk.fulfilled, (state, action: PayloadAction<IForoLike>) => {
                state.loading = false;
                const foro = state.foros.find(f => f.id === action.payload.foro.id);
                if (foro) {
                    const likeIndex = foro.likes.findIndex(like => like.usuario === action.payload.usuario);
                    if (likeIndex !== -1) {
                        foro.likes.splice(likeIndex, 1);
                    } else {
                        foro.likes.push(action.payload);
                    }
                }
            })
            .addCase(toggleForoLikeThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default foroSlice.reducer;