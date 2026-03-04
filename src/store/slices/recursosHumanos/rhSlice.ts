// src/store/slices/recursosHumanos/rhSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
	IRHState,
	IRHBranchConfig,
	IRHHoliday,
	IRHAttendanceRecord,
	IRHValidationResult,
	TRHPermissionStatus,
} from '@/interface/rh.interface';

/* ======================================================
   CONSTANTES
   ====================================================== */

const LOCAL_STORAGE_KEY = 'zentria_rh_state';

const defaultConfig: IRHBranchConfig = {
	latitude: 0,
	longitude: 0,
	radiusMeters: 50,
	authorizedPublicIP: '',
	entryTime: '08:00',
	exitTime: '18:00',
	timezone: 'America/Santiago',
	qrCode: '',
	branchName: '',
};

/* ======================================================
   HELPERS: localStorage
   ====================================================== */

function loadStateFromStorage(): Partial<IRHState> | null {
	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as Partial<IRHState>;
	} catch {
		return null;
	}
}

function saveStateToStorage(state: IRHState): void {
	try {
		const toSave = {
			config: state.config,
			holidays: state.holidays,
			records: state.records,
		};
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
	} catch {
		// Silenciar errores de localStorage lleno
	}
}

/* ======================================================
   INITIAL STATE
   ====================================================== */

const persisted = loadStateFromStorage();

const initialState: IRHState = {
	config: persisted?.config ?? defaultConfig,
	holidays: persisted?.holidays ?? [],
	records: persisted?.records ?? [],
	ui: {
		isValidating: false,
		isScanning: false,
		geoPermission: 'prompt',
		lastValidation: null,
		error: null,
	},
};

/* ======================================================
   SLICE
   ====================================================== */

const rhSlice = createSlice({
	name: 'recursosHumanos',
	initialState,
	reducers: {
		// ── Configuración ──────────────────────────────
		setBranchConfig(state, action: PayloadAction<IRHBranchConfig>) {
			state.config = action.payload;
			saveStateToStorage(state);
		},

		updateBranchConfig(state, action: PayloadAction<Partial<IRHBranchConfig>>) {
			state.config = { ...state.config, ...action.payload };
			saveStateToStorage(state);
		},

		// ── Feriados ───────────────────────────────────
		addHoliday(state, action: PayloadAction<IRHHoliday>) {
			state.holidays.push(action.payload);
			saveStateToStorage(state);
		},

		removeHoliday(state, action: PayloadAction<string>) {
			state.holidays = state.holidays.filter((h) => h.id !== action.payload);
			saveStateToStorage(state);
		},

		updateHoliday(state, action: PayloadAction<IRHHoliday>) {
			const idx = state.holidays.findIndex((h) => h.id === action.payload.id);
			if (idx !== -1) {
				state.holidays[idx] = action.payload;
				saveStateToStorage(state);
			}
		},

		// ── Registros de marcación ─────────────────────
		addRecord(state, action: PayloadAction<IRHAttendanceRecord>) {
			state.records.unshift(action.payload);
			saveStateToStorage(state);
		},

		clearRecords(state) {
			state.records = [];
			saveStateToStorage(state);
		},

		// ── UI State ───────────────────────────────────
		setIsValidating(state, action: PayloadAction<boolean>) {
			state.ui.isValidating = action.payload;
		},

		setIsScanning(state, action: PayloadAction<boolean>) {
			state.ui.isScanning = action.payload;
		},

		setGeoPermission(state, action: PayloadAction<TRHPermissionStatus>) {
			state.ui.geoPermission = action.payload;
		},

		setLastValidation(state, action: PayloadAction<IRHValidationResult | null>) {
			state.ui.lastValidation = action.payload;
		},

		setError(state, action: PayloadAction<string | null>) {
			state.ui.error = action.payload;
		},

		// ── Reset ──────────────────────────────────────
		resetRHState: () => {
			localStorage.removeItem(LOCAL_STORAGE_KEY);
			return {
				config: defaultConfig,
				holidays: [],
				records: [],
				ui: {
					isValidating: false,
					isScanning: false,
					geoPermission: 'prompt' as TRHPermissionStatus,
					lastValidation: null,
					error: null,
				},
			};
		},

		// ── Cargar desde storage (hydrate) ─────────────
		hydrateFromStorage(state) {
			const data = loadStateFromStorage();
			if (data) {
				if (data.config) state.config = data.config;
				if (data.holidays) state.holidays = data.holidays;
				if (data.records) state.records = data.records;
			}
		},
	},
});

export const {
	setBranchConfig,
	updateBranchConfig,
	addHoliday,
	removeHoliday,
	updateHoliday,
	addRecord,
	clearRecords,
	setIsValidating,
	setIsScanning,
	setGeoPermission,
	setLastValidation,
	setError,
	resetRHState,
	hydrateFromStorage,
} = rhSlice.actions;

export type { IRHState };
export default rhSlice.reducer;
