// Source of truth for validator: dot‑paths of fields
// that the DynamicAttributesEditor renders per product type.
// Names must match the section components (Cpu/Ram/Storage/Gpu/Display/Os/Connectivity/Packaging/...)

const ATTRIBUTES_FIELD_PATHS: Record<string, string[]> = {
  // Not used for publication; keep minimal fallback
  general: [
    'category_grade',
  ],

  // Computador reacondicionado
  desktop_pc: [
    // Básicos
    'product_kind',
    'category_grade',

    // CPU visibles (se ocultan métricas avanzadas)
    'cpu.brand',
    'cpu.family',
    'cpu.generation',
    'cpu.model',

    // RAM visibles
    'ram.type',
    'ram.capacity_gb',
    'ram.modules',
    'ram.channel',
    'ram.max_supported_gb',

    // Storage básicos (secundario sólo si config = hybrid)
    'storage.config',
    'storage.primary.type',
    'storage.primary.capacity_gb',

    // GPU visibles
    'gpu.type',
    'gpu.model',

    // OS visibles
    'os.name',
    'os.version',

    // Conectividad visibles
    'connectivity.wifi',
    'connectivity.bluetooth',
    'connectivity.ethernet',

    // Empaquetado
    'packaging.charger_included',
  ],

  // Notebook reacondicionado
  notebook: [
    'product_kind',
    'category_grade',

    'cpu.brand',
    'cpu.family',
    'cpu.generation',
    'cpu.model',

    'ram.type',
    'ram.capacity_gb',
    'ram.modules',
    'ram.channel',
    'ram.max_supported_gb',

    'storage.config',
    'storage.primary.type',
    'storage.primary.capacity_gb',

    'gpu.type',
    'gpu.model',

    // Display visibles para portátiles
    'display.size_inches',
    'display.resolution',

    'os.name',
    'os.version',

    'connectivity.wifi',
    'connectivity.bluetooth',
    'connectivity.ethernet',

    'packaging.charger_included',
  ],

  // AIO reacondicionado
  aio: [
    'product_kind',
    'category_grade',

    'cpu.brand',
    'cpu.family',
    'cpu.generation',
    'cpu.model',

    'ram.type',
    'ram.capacity_gb',
    'ram.modules',
    'ram.channel',
    'ram.max_supported_gb',

    'storage.config',
    'storage.primary.type',
    'storage.primary.capacity_gb',

    'gpu.type',
    'gpu.model',

    // Display visibles para AIO
    'display.size_inches',
    'display.resolution',

    'os.name',
    'os.version',

    'connectivity.wifi',
    'connectivity.bluetooth',
    'connectivity.ethernet',

    'packaging.charger_included',
  ],

  // Monitor reacondicionado
  monitor: [
    'product_kind',
    'category_grade',

    // Display visibles para monitor
    'display.size_inches',
    'display.resolution',
    'display.panel',
    'display.refresh_hz',

    // Conectividad específica de monitor
    'connectivity.signal_inputs',
    'connectivity.power_input',

    // Empaquetado
    'packaging.charger_included',
  ],
};

export default ATTRIBUTES_FIELD_PATHS;
