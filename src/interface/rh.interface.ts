// src/interface/rh.interface.ts
// Interfaces del módulo de Recursos Humanos — Reloj Control MVP

/* ======================================================
   CONFIGURACIÓN DE SUCURSAL PARA RELOJ CONTROL
   ====================================================== */

/** Configuración de geolocalización y red de una sucursal */
export interface IRHBranchConfig {
	/** Latitud de la sucursal */
	latitude: number;
	/** Longitud de la sucursal */
	longitude: number;
	/** Radio de tolerancia en metros */
	radiusMeters: number;
	/** IP pública autorizada para validar red */
	authorizedPublicIP: string;
	/** Hora de entrada (formato HH:mm, ej: "08:00") */
	entryTime: string;
	/** Hora de salida (formato HH:mm, ej: "18:00") */
	exitTime: string;
	/** Zona horaria (ej: "America/Santiago") */
	timezone: string;
	/** Código QR único de la sucursal (string generado, UUID) */
	qrCode: string;
	/** Nombre identificador de la sucursal */
	branchName: string;
	/** ID de la sucursal (si existiese en backend, para futuro enlace) */
	branchId?: number;
}

/* ======================================================
   FERIADOS
   ====================================================== */

export interface IRHHoliday {
	/** ID único */
	id: string;
	/** Nombre del feriado */
	name: string;
	/** Fecha en formato ISO (YYYY-MM-DD) */
	date: string;
	/** Si se repite cada año */
	recurring: boolean;
}

/* ======================================================
   RESULTADO DE VALIDACIONES
   ====================================================== */

export interface IRHGeolocationValidation {
	/** Si pasó la validación */
	passed: boolean;
	/** Distancia calculada en metros */
	distanceMeters: number;
	/** Latitud detectada */
	detectedLat: number;
	/** Longitud detectada */
	detectedLng: number;
	/** Mensaje descriptivo */
	message: string;
}

export interface IRHNetworkValidation {
	/** Si pasó la validación */
	passed: boolean;
	/** IP detectada */
	detectedIP: string;
	/** Mensaje descriptivo */
	message: string;
}

export interface IRHScheduleValidation {
	/** Si pasó la validación */
	passed: boolean;
	/** Razón de fallo (si aplica) */
	reason: string;
}

export interface IRHQRValidation {
	/** Si el QR escaneado coincide con el configurado */
	passed: boolean;
	/** Código QR escaneado */
	scannedCode: string;
	/** Mensaje descriptivo */
	message: string;
}

export interface IRHValidationResult {
	geolocation: IRHGeolocationValidation | null;
	network: IRHNetworkValidation | null;
	schedule: IRHScheduleValidation | null;
	qr: IRHQRValidation | null;
	/** Si todas las validaciones pasaron */
	allPassed: boolean;
}

/* ======================================================
   REGISTRO DE MARCACIÓN (ATTENDANCE)
   ====================================================== */

export type TRHPunchType = 'entry' | 'exit';
export type TRHPunctuality = 'on_time' | 'late' | 'early_exit';

export interface IRHAttendanceRecord {
	/** ID único del registro */
	id: string;
	/** ID del usuario que marcó (del auth slice) */
	userId: number;
	/** Nombre del usuario */
	userName: string;
	/** Tipo de marcación */
	type: TRHPunchType;
	/** Timestamp ISO */
	timestamp: string;
	/** Latitud al momento de marcar */
	latitude: number;
	/** Longitud al momento de marcar */
	longitude: number;
	/** IP pública al momento de marcar */
	publicIP: string;
	/** Código QR escaneado */
	qrCodeScanned: string;
	/** Resultado de validaciones al momento */
	validations: IRHValidationResult;
	/** Puntualidad: a tiempo, atrasado o salida anticipada */
	punctuality: TRHPunctuality;
}

/* ======================================================
   ESTADO GLOBAL DEL MÓDULO (REDUX SLICE)
   ====================================================== */

export type TRHPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface IRHUIState {
	/** Si está validando ubicación/red */
	isValidating: boolean;
	/** Si está escaneando QR */
	isScanning: boolean;
	/** Estado del permiso de geolocalización */
	geoPermission: TRHPermissionStatus;
	/** Último resultado de validaciones (antes de QR) */
	lastValidation: IRHValidationResult | null;
	/** Error general */
	error: string | null;
}

export interface IRHState {
	/** Configuración de la sucursal */
	config: IRHBranchConfig;
	/** Lista de feriados */
	holidays: IRHHoliday[];
	/** Registros de marcación */
	records: IRHAttendanceRecord[];
	/** Estado de UI */
	ui: IRHUIState;
}

/* ======================================================
   FORMULARIOS (FORMIK)
   ====================================================== */

export interface IRHBranchConfigFormValues {
	latitude: string;
	longitude: string;
	radiusMeters: string;
	authorizedPublicIP: string;
	entryTime: string;
	exitTime: string;
	timezone: string;
	branchName: string;
}

export interface IRHHolidayFormValues {
	name: string;
	date: string;
	recurring: boolean;
}
