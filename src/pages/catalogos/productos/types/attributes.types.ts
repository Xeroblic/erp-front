export interface CpuAttributes {
	brand: string;
	family: string;
	generation: string;
	model: string;
	cores: number;
	threads: number;
	base_clock_mhz: number;
	boost_clock_mhz: number | null;
}

export interface RamAttributes {
	type: string;
	capacity_gb: number;
	modules: number;
	channel: string;
	upgradable: boolean;
	max_supported_gb: number;
}

export interface StorageDrive {
	type: string;
	capacity_gb: number;
}

export interface StorageSlots {
	m2: number;
	sata: number;
}

export interface StorageAttributes {
	config: string;
	primary: StorageDrive;
	secondary?: StorageDrive;
	upgradable: boolean;
	max_supported_gb: number;
	available_slots: StorageSlots;
}

export interface GpuAttributes {
	type: string;
	model: string | null;
	vram_gb: number | null;
}

export interface LicenseAttributes {
	type: string;
	activated: boolean;
}

export interface OsAttributes {
	name: string;
	version: string;
	license: LicenseAttributes | null;
	can_upgrade_edition: boolean;
}

export interface ConnectivityAttributes {
	wifi: string | null;
	bluetooth: string | null;
	ethernet: string | null;
	power_input?: string | null;
	signal_inputs?: string[];
}

export interface AudioAttributes {
	speakers: boolean;
	microphone: boolean;
}

export interface CameraAttributes {
	present: boolean;
	resolution_mp: number | null;
}

export interface KeyboardAttributes {
	layout: string;
	backlit: boolean;
}

export interface PackagingAttributes {
	charger_included: boolean;
	charger_type: string | null;
}

export interface NotesAttributes {
	functional: string;
	cosmetic: string;
	defects: string | null;
}

export interface DisplayAttributes {
	size_inches: number;
	resolution: string;
	panel: string;
	refresh_hz: number;
	touch?: boolean;
	response_time_ms?: number;
	aspect_ratio?: string;
	brightness_nits?: number;
	connectors?: string[];
	adjustable_stand?: boolean;
	pivot?: boolean;
	integrated_speakers?: boolean;
}

export interface DesktopAttributes {
	product_kind: 'desktop_pc';
	category_grade: string;
	cpu: CpuAttributes;
	ram: RamAttributes;
	storage: StorageAttributes;
	gpu: GpuAttributes;
	os: OsAttributes;
	connectivity: ConnectivityAttributes;
	audio: AudioAttributes;
	packaging: PackagingAttributes;
	notes: NotesAttributes;
}

export interface NotebookAttributes {
	product_kind: 'notebook';
	category_grade: string;
	cpu: CpuAttributes;
	ram: RamAttributes;
	storage: StorageAttributes;
	gpu: GpuAttributes;
	display: DisplayAttributes;
	os: OsAttributes;
	connectivity: ConnectivityAttributes;
	camera: CameraAttributes;
	audio: AudioAttributes;
	keyboard: KeyboardAttributes;
	packaging: PackagingAttributes;
	notes: NotesAttributes;
}

export interface AioAttributes {
	product_kind: 'aio';
	category_grade: string;
	cpu: CpuAttributes;
	ram: RamAttributes;
	storage: StorageAttributes;
	gpu: GpuAttributes;
	display: DisplayAttributes;
	os: OsAttributes;
	connectivity: ConnectivityAttributes;
	camera: CameraAttributes;
	audio: AudioAttributes;
	keyboard: KeyboardAttributes;
	packaging: PackagingAttributes;
	notes: NotesAttributes;
}

export interface MonitorAttributes {
	product_kind: 'monitor';
	category_grade: string;
	display: DisplayAttributes;
	os: null;
	connectivity: ConnectivityAttributes;
	audio: AudioAttributes;
	packaging: PackagingAttributes;
	notes: NotesAttributes;
}

export interface DockingAttributes {
	product_kind: 'docking';
}

export type AttributesJson =
	| DesktopAttributes
	| NotebookAttributes
	| AioAttributes
	| MonitorAttributes
	| DockingAttributes
	| null;
