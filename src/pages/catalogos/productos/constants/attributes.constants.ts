export const DEVICE_KINDS = ['desktop_pc', 'notebook', 'aio', 'monitor'] as const;

export const PRODUCT_DEVICE_LABELS: Record<string, string> = {
	desktop_pc: 'Desktop',
	notebook: 'Notebook',
	aio: 'All in One',
	monitor: 'Monitor',
};

export const CATEGORY_GRADES = ['A', 'B', 'C', 'M'] as const;

export const CPU_BRAND = ['Intel', 'AMD'] as const;

export const CPU_FAMILY_INTEL = [
	'Celeron',
	'Pentium',
	'Core',
	'Xeon',
] as const;

export const CPU_FAMILY_AMD = ['Athlon', 'Ryzen', 'Ryzen PRO', 'EPYC'] as const;

export const CPU_FAMILY_BY_BRAND: Record<string, readonly string[]> = {
	Intel: CPU_FAMILY_INTEL,
	AMD: CPU_FAMILY_AMD,
};

export const CPU_GENERATION_INTEL = [
	'2nd Gen (Sandy Bridge)',
	'3rd Gen (Ivy Bridge)',
	'4th Gen (Haswell)',
	'5th Gen (Broadwell)',
	'6th Gen (Skylake)',
	'7th Gen (Kaby Lake)',
	'8th Gen (Coffee Lake)',
	'9th Gen (Coffee Lake Refresh)',
	'10th Gen (Comet Lake / Ice Lake)',
	'11th Gen (Tiger Lake)',
	'12th Gen (Alder Lake)',
	'13th Gen (Raptor Lake)',
] as const;

export const CPU_GENERATION_AMD = [
	'1st Gen (Zen)',
	'2nd Gen (Zen+)',
	'3rd Gen (Zen 2)',
	'4th Gen (Zen 3)',
	'5th Gen (Zen 4)',
] as const;

export const CPU_GENERATION_BY_BRAND: Record<string, readonly string[]> = {
	Intel: CPU_GENERATION_INTEL,
	AMD: CPU_GENERATION_AMD,
};

export const RAM_TYPES = ['DDR3', 'DDR3L', 'DDR4', 'DDR5'] as const;
export const RAM_CHANNELS = ['single', 'dual', 'quad'] as const;

export const STORAGE_CONFIGS = ['single', 'hybrid'] as const;
export const STORAGE_TYPES = ['NVMe', 'SSD_SATA', 'HDD'] as const;

export const GPU_TYPES = ['integrated', 'discrete'] as const;

export const OS_NAMES = ['Windows', 'Ubuntu', 'Linux', 'No OS'] as const;
export const OS_LICENSE_TYPES = ['digital', 'OEM', 'sticker', 'none'] as const;

export const PANEL_TYPES = ['TN', 'VA', 'IPS', 'OLED'] as const;
export const ASPECT_RATIOS = ['16:9', '16:10', '21:9'] as const;

export const DISPLAY_SIZES_NOTEBOOK = [12.5, 13.3, 14.0, 15.6, 17.3] as const;
export const DISPLAY_SIZES_AIO = [21.5, 23.8, 27.0] as const;
export const DISPLAY_SIZES_MONITOR = [19, 21.5, 23.8, 24, 27] as const;

export const DISPLAY_RESOLUTIONS = [
	'1366x768',
	'1600x900',
	'1920x1080',
	'2560x1440',
	'3840x2160',
] as const;

export const REFRESH_RATES = [60, 75, 120, 144] as const;

export const POWER_INPUT_OPTIONS = ['AC 100-240V', 'DC 19V'] as const;

export const SIGNAL_INPUTS = ['HDMI', 'VGA', 'DisplayPort', 'DVI'] as const;

export const AUDIO_AVAILABILITY = [true, false] as const;

export const KEYBOARD_LAYOUTS = ['ES-LA', 'EN-US', 'FR', 'DE'] as const;

export const DEVICE_GRADES_LABEL: Record<string, string> = {
	A: 'Excelente',
	B: 'Bueno',
	C: 'Aceptable',
	M: 'Mixto',
};

export const DEFAULT_CONNECTORS_MONITOR = ['HDMI', 'VGA'] as const;
