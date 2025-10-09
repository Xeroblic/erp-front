import {
	CATEGORY_GRADES,
	CPU_BRAND,
	CPU_FAMILY_BY_BRAND,
	CPU_GENERATION_BY_BRAND,
	RAM_TYPES,
	RAM_CHANNELS,
	STORAGE_CONFIGS,
	STORAGE_TYPES,
	GPU_TYPES,
	OS_NAMES,
	OS_LICENSE_TYPES,
	PANEL_TYPES,
	ASPECT_RATIOS,
	DISPLAY_RESOLUTIONS,
	REFRESH_RATES,
	SIGNAL_INPUTS,
	AUDIO_AVAILABILITY,
	KEYBOARD_LAYOUTS,
	DISPLAY_SIZES_NOTEBOOK,
	DISPLAY_SIZES_AIO,
	DISPLAY_SIZES_MONITOR,
	POWER_INPUT_OPTIONS,
	DEFAULT_CONNECTORS_MONITOR,
} from './attributes.constants';

export const ATTRS_DESKTOP_DEFAULT = {
	product_kind: 'desktop_pc',
	category_grade: CATEGORY_GRADES[0],
	cpu: {
		brand: CPU_BRAND[0],
		family: CPU_FAMILY_BY_BRAND[CPU_BRAND[0]][2],
		generation: CPU_GENERATION_BY_BRAND[CPU_BRAND[0]][6],
		model: 'i5-8500',
		cores: 6,
		threads: 6,
		base_clock_mhz: 3000,
		boost_clock_mhz: 4100,
	},
	ram: {
		type: RAM_TYPES[2],
		capacity_gb: 16,
		modules: 2,
		channel: RAM_CHANNELS[1],
		upgradable: true,
		max_supported_gb: 64,
	},
	storage: {
		config: STORAGE_CONFIGS[0],
		primary: {
			type: STORAGE_TYPES[0],
			capacity_gb: 512,
		},
		upgradable: true,
		max_supported_gb: 4000,
		available_slots: {
			m2: 1,
			sata: 2,
		},
	},
	gpu: {
		type: GPU_TYPES[0],
		model: 'Intel UHD Graphics 630',
		vram_gb: null,
	},
	os: {
		name: OS_NAMES[0],
		version: '10 Home',
		license: {
			type: OS_LICENSE_TYPES[0],
			activated: true,
		},
		can_upgrade_edition: true,
	},
	connectivity: {
		wifi: 'USB o PCIe opcional',
		bluetooth: 'No aplica',
		ethernet: '1GbE',
	},
	audio: {
		speakers: false,
		microphone: false,
	},
	packaging: {
		charger_included: false,
		charger_type: null,
	},
	notes: {
		functional: 'Equipos revisados y 100% funcionales.',
		cosmetic: 'Minimos signos de uso acorde a la categoria.',
		defects: null,
	},
} as const;

export const ATTRS_NOTEBOOK_DEFAULT = {
	product_kind: 'notebook',
	category_grade: CATEGORY_GRADES[0],
	cpu: {
		brand: CPU_BRAND[0],
		family: CPU_FAMILY_BY_BRAND[CPU_BRAND[0]][2],
		generation: CPU_GENERATION_BY_BRAND[CPU_BRAND[0]][6],
		model: 'i5-8350U',
		cores: 4,
		threads: 8,
		base_clock_mhz: 1700,
		boost_clock_mhz: 3600,
	},
	ram: {
		type: RAM_TYPES[2],
		capacity_gb: 8,
		modules: 2,
		channel: RAM_CHANNELS[1],
		upgradable: true,
		max_supported_gb: 32,
	},
	storage: {
		config: STORAGE_CONFIGS[1],
		primary: { type: STORAGE_TYPES[0], capacity_gb: 256 },
		secondary: { type: STORAGE_TYPES[2], capacity_gb: 1000 },
		upgradable: true,
		max_supported_gb: 2000,
		available_slots: {
			m2: 1,
			sata: 1,
		},
	},
	gpu: {
		type: GPU_TYPES[0],
		model: 'Intel UHD Graphics 620',
		vram_gb: null,
	},
	display: {
		size_inches: DISPLAY_SIZES_NOTEBOOK[2],
		resolution: DISPLAY_RESOLUTIONS[2],
		panel: PANEL_TYPES[2],
		refresh_hz: REFRESH_RATES[0],
		touch: false,
	},
	os: {
		name: OS_NAMES[0],
		version: '10 Home',
		license: {
			type: OS_LICENSE_TYPES[0],
			activated: true,
		},
		can_upgrade_edition: true,
	},
	connectivity: {
		wifi: '802.11ac',
		bluetooth: '4.2',
		ethernet: '1GbE',
	},
	camera: {
		present: true,
		resolution_mp: 1.0,
	},
	audio: {
		speakers: true,
		microphone: true,
	},
	keyboard: {
		layout: KEYBOARD_LAYOUTS[0],
		backlit: true,
	},
	packaging: {
		charger_included: true,
		charger_type: 'original',
	},
	notes: {
		functional: 'Equipos revisados y 100% funcionales.',
		cosmetic: 'Minimos signos de uso acorde a la categoria.',
		defects: null,
	},
} as const;

export const ATTRS_AIO_DEFAULT = {
	product_kind: 'aio',
	category_grade: CATEGORY_GRADES[0],
	cpu: {
		brand: CPU_BRAND[0],
		family: CPU_FAMILY_BY_BRAND[CPU_BRAND[0]][2],
		generation: CPU_GENERATION_BY_BRAND[CPU_BRAND[0]][8],
		model: 'i5-10400T',
		cores: 6,
		threads: 12,
		base_clock_mhz: 2000,
		boost_clock_mhz: 4000,
	},
	ram: {
		type: RAM_TYPES[2],
		capacity_gb: 8,
		modules: 2,
		channel: RAM_CHANNELS[1],
		upgradable: true,
		max_supported_gb: 32,
	},
	storage: {
		config: STORAGE_CONFIGS[1],
		primary: { type: STORAGE_TYPES[0], capacity_gb: 256 },
		secondary: { type: STORAGE_TYPES[2], capacity_gb: 1000 },
		upgradable: true,
		max_supported_gb: 2000,
		available_slots: {
			m2: 1,
			sata: 1,
		},
	},
	gpu: {
		type: GPU_TYPES[0],
		model: 'Intel UHD Graphics 630',
		vram_gb: null,
	},
	display: {
		size_inches: DISPLAY_SIZES_AIO[1],
		resolution: DISPLAY_RESOLUTIONS[2],
		panel: PANEL_TYPES[2],
		refresh_hz: REFRESH_RATES[0],
		touch: false,
	},
	os: {
		name: OS_NAMES[0],
		version: '10 Home',
		license: {
			type: OS_LICENSE_TYPES[0],
			activated: true,
		},
		can_upgrade_edition: true,
	},
	connectivity: {
		wifi: '802.11ac',
		bluetooth: '5.0',
		ethernet: '1GbE',
	},
	camera: {
		present: true,
		resolution_mp: 1.0,
	},
	audio: {
		speakers: true,
		microphone: true,
	},
	keyboard: {
		layout: KEYBOARD_LAYOUTS[0],
		backlit: false,
	},
	packaging: {
		charger_included: true,
		charger_type: 'original',
	},
	notes: {
		functional: 'Equipos revisados y 100% funcionales.',
		cosmetic: 'Minimos signos de uso acorde a la categoria.',
		defects: null,
	},
} as const;

export const ATTRS_MONITOR_DEFAULT = {
	product_kind: 'monitor',
	category_grade: CATEGORY_GRADES[0],
	display: {
		size_inches: DISPLAY_SIZES_MONITOR[3],
		resolution: DISPLAY_RESOLUTIONS[2],
		panel: PANEL_TYPES[2],
		refresh_hz: REFRESH_RATES[1],
		response_time_ms: 5,
		aspect_ratio: ASPECT_RATIOS[0],
		brightness_nits: 250,
		connectors: [...DEFAULT_CONNECTORS_MONITOR],
		adjustable_stand: true,
		pivot: false,
		integrated_speakers: false,
	},
	os: null,
	connectivity: {
		power_input: POWER_INPUT_OPTIONS[0],
		signal_inputs: [...DEFAULT_CONNECTORS_MONITOR],
	},
	audio: {
		speakers: false,
		microphone: false,
	},
	packaging: {
		charger_included: true,
		charger_type: 'original',
	},
	notes: {
		functional: 'Pantalla revisada y sin pixeles muertos.',
		cosmetic: 'Minimos signos de uso en marco o base.',
		defects: null,
	},
} as const;

export const ATTRIBUTES_DEFAULT_BY_TYPE: Record<string, unknown> = {
	desktop_pc_reacondicionado: ATTRS_DESKTOP_DEFAULT,
	notebook_reacondicionado: ATTRS_NOTEBOOK_DEFAULT,
	aio_reacondicionado: ATTRS_AIO_DEFAULT,
	desktop_pc: ATTRS_DESKTOP_DEFAULT,
	notebook: ATTRS_NOTEBOOK_DEFAULT,
	aio: ATTRS_AIO_DEFAULT,
	monitor_reacondicionado: ATTRS_MONITOR_DEFAULT,
	monitor: ATTRS_MONITOR_DEFAULT,
};
