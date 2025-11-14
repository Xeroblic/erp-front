// Constantes para el sistema de atributos de productos ECOPC

import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from './products.constant';

/**
 * Opciones de tipos de dispositivo para selects
 * Se genera automáticamente desde PRODUCT_TYPE_LABELS para mantener sincronización
 */
export const PRODUCT_DEVICE_TYPES = PRODUCT_TYPES.map((type) => ({
    value: type,
    label: PRODUCT_TYPE_LABELS[type] ?? type,
}));

export const CATEGORY_GRADES = [
    { value: 'A', label: 'A - Excelente estado (70–100% estética, batería >50%)' },
    { value: 'B', label: 'B - Buen estado (50–70% estética, batería >50%)' },
    { value: 'C', label: 'C - Aceptable (40–50% estética, batería <50%)' },
    { value: 'M', label: 'M - Mixto o partes combinadas' },
] as const;

// CPU
export const CPU_BRANDS = [
    { value: 'Intel', label: 'Intel' },
    { value: 'AMD', label: 'AMD' },
] as const;

export const CPU_FAMILIES = {
    Intel: [
        { value: 'Celeron', label: 'Celeron' },
        { value: 'Pentium', label: 'Pentium' },
        { value: 'Core', label: 'Core' },
        { value: 'Xeon', label: 'Xeon' },
    ],
    AMD: [
        { value: 'Athlon', label: 'Athlon' },
        { value: 'Ryzen', label: 'Ryzen' },
        { value: 'Ryzen PRO', label: 'Ryzen PRO' },
        { value: 'EPYC', label: 'EPYC' },
    ],
} as const;

export const CPU_GENERATIONS = {
    Intel: [
        { value: '4th Gen', label: '4th Gen (Haswell)' },
        { value: '5th Gen', label: '5th Gen (Broadwell)' },
        { value: '6th Gen', label: '6th Gen (Skylake)' },
        { value: '7th Gen', label: '7th Gen (Kaby Lake)' },
        { value: '8th Gen', label: '8th Gen (Coffee Lake)' },
        { value: '9th Gen', label: '9th Gen (Coffee Lake Refresh)' },
        { value: '10th Gen', label: '10th Gen (Comet Lake / Ice Lake)' },
        { value: '11th Gen', label: '11th Gen (Tiger Lake)' },
        { value: '12th Gen', label: '12th Gen (Alder Lake)' },
        { value: '13th Gen', label: '13th Gen (Raptor Lake)' },
    ],
    AMD: [
        { value: '1st Gen', label: '1st Gen (Zen)' },
        { value: '2nd Gen', label: '2nd Gen (Zen+)' },
        { value: '3rd Gen', label: '3rd Gen (Zen 2)' },
        { value: '4th Gen', label: '4th Gen (Zen 3)' },
        { value: '5th Gen', label: '5th Gen (Zen 4)' },
    ],
} as const;

// RAM
export const RAM_TYPES = [
    { value: 'DDR3', label: 'DDR3' },
    { value: 'DDR4', label: 'DDR4' },
    { value: 'DDR5', label: 'DDR5' },
] as const;

export const RAM_CAPACITIES = [
    { value: 4, label: '4 GB' },
    { value: 8, label: '8 GB' },
    { value: 16, label: '16 GB' },
    { value: 24, label: '24 GB' },
    { value: 32, label: '32 GB' },
    { value: 40, label: '40 GB' },
    { value: 48, label: '48 GB' },
    { value: 56, label: '56 GB' },
    { value: 64, label: '64 GB' },
] as const;

export const RAM_MODULES = [
    { value: 1, label: '1 módulo' },
    { value: 2, label: '2 módulos' },
    { value: 3, label: '3 módulos' },
    { value: 4, label: '4 módulos' },
] as const;

export const RAM_CHANNELS = [
    { value: 'single', label: 'Single Channel' },
    { value: 'dual', label: 'Dual Channel' },
    { value: 'quad', label: 'Quad Channel' },
] as const;

// Storage
export const STORAGE_CONFIGS = [
    { value: 'single', label: 'Almacenamiento único' },
    { value: 'hybrid', label: 'Almacenamiento híbrido' },
] as const;

export const STORAGE_TYPES = [
    { value: 'SSD SATA', label: 'SSD SATA' },
    { value: 'NVMe', label: 'NVMe' },
    { value: 'HDD', label: 'HDD' },
] as const;

export const STORAGE_CAPACITIES = [
    { value: 64, label: '64 GB' },
    { value: 128, label: '128 GB' },
    { value: 240, label: '240 GB' },
    { value: 256, label: '256 GB' },
    { value: 500, label: '500 GB' },
    { value: 512, label: '512 GB' },
    { value: 1000, label: '1 TB' },
    { value: 2000, label: '2 TB' },
    { value: 4000, label: '4 TB' },
] as const;

// GPU
export const GPU_TYPES = [
    { value: 'integrated', label: 'Integrada' },
    { value: 'dedicated', label: 'Dedicada' },
] as const;

// OS
export const OS_NAMES = [
    { value: 'Windows', label: 'Windows' },
    { value: 'Ubuntu', label: 'Ubuntu' },
    { value: 'Linux', label: 'Linux' },
] as const;

export const OS_VERSIONS = {
    Windows: [
        { value: '10 Home', label: 'Windows 10 Home' },
        { value: '10 Pro', label: 'Windows 10 Pro' },
        { value: '11 Home', label: 'Windows 11 Home' },
        { value: '11 Pro', label: 'Windows 11 Pro' },
    ],
} as const;

export const LICENSE_TYPES = [
    { value: 'digital', label: 'Digital' },
    { value: 'OEM', label: 'OEM' },
    { value: 'sin licencia', label: 'Sin licencia' },
] as const;

// Conectividad
export const WIFI_STANDARDS = [
    { value: '802.11n', label: '802.11n' },
    { value: '802.11ac', label: '802.11ac' },
    { value: '802.11ax', label: '802.11ax (Wi-Fi 6)' },
    { value: 'USB/PCIe opcional', label: 'USB/PCIe opcional' },
    { value: 'N/A', label: 'No disponible' },
] as const;

export const BLUETOOTH_VERSIONS = [
    { value: '4.0', label: 'Bluetooth 4.0' },
    { value: '4.2', label: 'Bluetooth 4.2' },
    { value: '5.0', label: 'Bluetooth 5.0' },
    { value: '5.1', label: 'Bluetooth 5.1' },
    { value: 'N/A', label: 'No disponible' },
] as const;

export const ETHERNET_SPEEDS = [
    { value: '100 Mbps', label: '100 Mbps' },
    { value: '1GbE', label: '1 GbE' },
    { value: '2.5GbE', label: '2.5 GbE' },
] as const;

// Display
export const DISPLAY_SIZES = [
    { value: 12.5, label: '12.5"' },
    { value: 13.3, label: '13.3"' },
    { value: 14.0, label: '14.0"' },
    { value: 15.6, label: '15.6"' },
    { value: 17.3, label: '17.3"' },
    { value: 19, label: '19"' },
    { value: 21.5, label: '21.5"' },
    { value: 23.8, label: '23.8"' },
    { value: 24, label: '24"' },
    { value: 27, label: '27"' },
] as const;

export const DISPLAY_RESOLUTIONS = [
    { value: '1366x768', label: '1366x768' },
    { value: '1600x900', label: '1600x900' },
    { value: '1920x1080', label: '1920x1080 (Full HD)' },
    { value: '2560x1440', label: '2560x1440 (QHD)' },
    { value: '3840x2160', label: '3840x2160 (4K UHD)' },
] as const;

export const DISPLAY_PANELS = [
    { value: 'TN', label: 'TN' },
    { value: 'IPS', label: 'IPS' },
    { value: 'VA', label: 'VA' },
    { value: 'OLED', label: 'OLED' },
] as const;

export const DISPLAY_REFRESH_RATES = [
    { value: 60, label: '60 Hz' },
    { value: 75, label: '75 Hz' },
    { value: 120, label: '120 Hz' },
    { value: 144, label: '144 Hz' },
] as const;

// Monitor específico
export const MONITOR_CONNECTORS = [
    { value: 'HDMI', label: 'HDMI' },
    { value: 'VGA', label: 'VGA' },
    { value: 'DisplayPort', label: 'DisplayPort' },
    { value: 'DVI', label: 'DVI' },
] as const;

// Teclado
export const KEYBOARD_LAYOUTS = [
    { value: 'ES-LA', label: 'Español (Latinoamérica)' },
    { value: 'EN-US', label: 'Inglés (Estados Unidos)' },
    { value: 'FR', label: 'Francés' },
    { value: 'DE', label: 'Alemán' },
] as const;

// Packaging
export const CHARGER_TYPES = [
    { value: 'original', label: 'Original' },
    { value: 'genérico', label: 'Genérico' },
    { value: 'no aplica', label: 'No aplica' },
] as const;

// Cámara
export const CAMERA_RESOLUTIONS = [
    { value: 0.9, label: '0.9 MP' },
    { value: 1.0, label: '1.0 MP' },
    { value: 1.3, label: '1.3 MP' },
    { value: 2.0, label: '2.0 MP' },
] as const;