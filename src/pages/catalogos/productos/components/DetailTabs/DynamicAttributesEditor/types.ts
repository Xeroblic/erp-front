export type ProductKind = 'desktop_pc' | 'notebook' | 'aio' | 'monitor';
export type IsFieldVisibleFn = (fieldName: string) => boolean;

export interface AttributesData {
	product_kind?: string;
	category_grade?: string;
	cpu?: {
		brand?: string;
		family?: string;
		generation?: string;
		model?: string;
		cores?: number;
		threads?: number;
		base_clock_mhz?: number;
		boost_clock_mhz?: number;
	};
	ram?: {
		type?: string;
		capacity_gb?: number;
		modules?: number;
		channel?: string;
		upgradable?: boolean;
		max_supported_gb?: number;
	};
	storage?: {
		config?: string;
		primary?: {
			type?: string;
			capacity_gb?: number;
		};
		secondary?: {
			type?: string;
			capacity_gb?: number;
		};
		upgradable?: boolean;
		max_supported_gb?: number;
		available_slots?: {
			m2?: number;
			sata?: number;
		};
	};
	gpu?: {
		type?: string;
		model?: string;
		vram_gb?: number | null;
	};
	display?: {
		size_inches?: number;
		resolution?: string;
		panel?: string;
		refresh_hz?: number;
		response_time_ms?: number;
		aspect_ratio?: string;
		brightness_nits?: number;
		connectors?: string[];
		adjustable_stand?: boolean;
		pivot?: boolean;
		integrated_speakers?: boolean;
		touch?: boolean;
	};
	os?: {
		name?: string;
		version?: string;
		license?: {
			type?: string;
			activated?: boolean;
		};
		can_upgrade_edition?: boolean;
	};
	connectivity?: {
		wifi?: string;
		bluetooth?: string;
		ethernet?: string;
		power_input?: string;
		signal_inputs?: string[];
	};
	camera?: {
		present?: boolean;
		resolution_mp?: number;
	};
	audio?: {
		speakers?: boolean;
		microphone?: boolean;
	};
	keyboard?: {
		layout?: string;
		backlit?: boolean;
	};
	packaging?: {
		charger_included?: boolean;
		charger_type?: string;
	};
	notes?: {
		functional?: string;
		cosmetic?: string;
		defects?: string | null;
	};
}

export type UpdateAttributeFn = (path: string, value: unknown) => void;

export interface SectionBaseProps {
	attributes: AttributesData;
	updateAttribute: UpdateAttributeFn;
	currentProductKind: ProductKind;
	isFieldVisible: IsFieldVisibleFn;
}

export interface CpuSectionProps extends SectionBaseProps {
	currentCpuBrand: string;
}
