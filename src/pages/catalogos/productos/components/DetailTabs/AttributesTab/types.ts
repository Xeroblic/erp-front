export type ProductKind = 'desktop_pc' | 'notebook' | 'aio' | 'monitor' | 'docking';

export interface ReviewData {
	// Condición general
	general_condition?: string;

	// Pantalla (condición)
	screen_condition?: string;
	dead_pixels_count?: number;
	spots_count?: number;
	screen_inches?: string;
	screen_resolution?: string;
	is_touchscreen?: boolean;

	// Carcasa / Estética
	cover_condition?: string;
	hinge_condition?: string;
	touchpad_condition?: string;
	bottom_condition?: string;
	stand_condition?: string;
	frame_condition?: string;

	// Teclado
	keyboard_condition?: string;
	keyboard_layout?: string;
	has_numeric_keypad?: boolean;
	has_backlit_keyboard?: boolean;

	// Batería (notebook)
	battery_status?: string;
	battery_percentage?: number;
	battery_health?: string;

	// Hardware resumen
	brand?: string;
	model?: string;
	line?: string;
	processor?: string;
	ram_size?: string;
	ram_slots?: string;
	ram_type?: string;
	storage_size?: string;
	storage_technology?: string;

	// Puertos
	vga_ports?: number;
	hdmi_ports?: number;
	displayport_ports?: number;
	usb_c_ports?: number;
	usb_a_ports?: number;
	sd_readers?: number;
	rj45_ports?: number;
	dvi_ports?: number;
	type_c_ports?: number;
	has_usb_hub?: boolean;
	usb_hub_ports?: number;
	all_ports_functional?: boolean;
	defective_ports_count?: number;
	defective_ports_critical_count?: number;

	// Accesorios
	includes_charger?: boolean;
	charger_watts?: string;
	charger_status?: string;
	includes_power_adapter?: boolean;
	includes_power_cable?: boolean;
	includes_video_cable?: boolean;
	includes_stand?: boolean;

	// Software / Conectividad
	operating_system?: string;
	has_biometric?: boolean;
	has_wifi?: boolean;
	has_bluetooth?: boolean;
	has_cd_drive?: boolean;

	// Notas
	observations?: string;
	extra_attributes?: Record<string, unknown>;
}

export type UpdateReviewFieldFn = (field: string, value: unknown) => void;

export interface ReviewSectionProps {
	data: ReviewData;
	updateField: UpdateReviewFieldFn;
	productKind: ProductKind;
}

export interface SubTabConfig {
	id: string;
	label: string;
	icon: string;
	visibleFor: ProductKind[];
}
