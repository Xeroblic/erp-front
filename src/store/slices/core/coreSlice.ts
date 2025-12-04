import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IComuna, IProvincia, IRegion } from '@/interface/core.interface';
import ApiService from '@/services/ApiService';

export interface CoreState {
	loading: boolean;
	error: string | undefined;
	listaRegiones: IRegion[];
	listaProvincias: IProvincia[];
	listaComunas: IComuna[];
}

const initialState: CoreState = {
	loading: false,
	error: undefined,
	listaRegiones: [],
	listaProvincias: [],
	listaComunas: [],
};

// Normalizadores para mapear el backend actual (id, name, *_id) al modelo local (codigo, nombre, codigo_padre)
const mapRegion = (r: any): IRegion => ({
	codigo: String(r.id ?? r.codigo ?? r.code ?? ''),
	tipo: 'region',
	nombre: r.name ?? r.nombre ?? '',
	lat: r.lat ?? 0,
	lng: r.lng ?? 0,
	url: r.url ?? '',
	codigo_padre: '',
});

const mapProvincia = (p: any): IProvincia => ({
	codigo: String(p.id ?? p.codigo ?? p.code ?? ''),
	tipo: 'provincia',
	nombre: p.name ?? p.nombre ?? '',
	lat: p.lat ?? 0,
	lng: p.lng ?? 0,
	url: p.url ?? '',
	codigo_padre: String(p.region_id ?? p.codigo_padre ?? ''),
});

const mapComuna = (c: any): IComuna => ({
	codigo: String(c.id ?? c.codigo ?? c.code ?? ''),
	tipo: 'comuna',
	nombre: c.name ?? c.nombre ?? '',
	lat: c.lat ?? 0,
	lng: c.lng ?? 0,
	url: c.url ?? '',
	codigo_padre: String(c.province_id ?? c.codigo_padre ?? ''),
});

export const listaRegionesThunk = createAsyncThunk<IRegion[], undefined, { rejectValue: string }>(
	'core/listaRegionesThunk',
	async (_, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ data?: any[] } | any>({
				url: '/regions',
				method: 'get',
			});
			const raw = Array.isArray(response.data?.data)
				? response.data.data
				: Array.isArray(response.data)
					? response.data
					: [];
			return (raw as any[]).map(mapRegion);
		} catch (error: any) {
			return rejectWithValue(error?.message ?? 'No se pudieron cargar regiones');
		}
	},
);

export const listaProvinciasThunk = createAsyncThunk<
	IProvincia[],
	undefined,
	{ rejectValue: string }
>('core/listaProvinciasThunk', async (_, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: any[] } | any>({
			url: '/provinces',
			method: 'get',
		});
		const raw = Array.isArray(response.data?.data)
			? response.data.data
			: Array.isArray(response.data)
				? response.data
				: [];
		return (raw as any[]).map(mapProvincia);
	} catch (error: any) {
		return rejectWithValue(error?.message ?? 'No se pudieron cargar provincias');
	}
});

export const listaComunasThunk = createAsyncThunk<IComuna[], undefined, { rejectValue: string }>(
	'core/listaComunasThunk',
	async (_, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ data?: any[] } | any>({
				url: '/communes',
				method: 'get',
			});
			const raw = Array.isArray(response.data?.data)
				? response.data.data
				: Array.isArray(response.data)
					? response.data
					: [];
			return (raw as any[]).map(mapComuna);
		} catch (error: any) {
			return rejectWithValue(error?.message ?? 'No se pudieron cargar comunas');
		}
	},
);

const coreSlice = createSlice({
	name: `core/coreSlice`,
	initialState,
	reducers: {},
	extraReducers(builder) {
		builder
			.addCase(listaRegionesThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(listaRegionesThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.listaRegiones = action.payload;
			})
			.addCase(listaRegionesThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(listaProvinciasThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(listaProvinciasThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.listaProvincias = action.payload;
			})
			.addCase(listaProvinciasThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(listaComunasThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(listaComunasThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.listaComunas = action.payload;
			})
			.addCase(listaComunasThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});
	},
});

export const {} = coreSlice.actions;

export default coreSlice.reducer;
