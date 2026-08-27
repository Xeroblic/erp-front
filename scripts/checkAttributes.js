const payload = {
	attributes_json: {
		os: {
			name: 'Windows',
			version: '10 Home',
			can_upgrade_edition: true,
		},
		CPU: 'I7 8350U',
		RAM: '16 GB',
		cpu: {
			brand: 'Intel',
			model: '23232',
			family: 'Pentium',
			generation: '5th Gen',
		},
		gpu: {
			type: 'integrated',
			model: '2dsdsds',
		},
		ram: {
			type: 'DDR5',
			channel: 'dual',
			modules: 0,
			upgradable: true,
			capacity_gb: 8,
			max_supported_gb: 8,
		},
		grade: 'B',
		storage: {
			config: 'hybrid',
			primary: {
				type: 'NVMe',
				capacity_gb: 1000,
			},
			secondary: {
				type: 'SSD SATA',
				capacity_gb: 128,
			},
			upgradable: true,
			available_slots: {
				m2: 0,
				sata: 3232,
			},
			max_supported_gb: 21323,
		},
		packaging: {
			charger_type: 'genérico',
			charger_included: true,
		},
		connectivity: {
			wifi: '802.11ac',
			ethernet: '2.5GbE',
			bluetooth: '4.2',
		},
		product_kind: 'desktop_pc',
		category_grade: 'A',
	},
};

const ATTRIBUTES_FIELD_PATHS = {
	general: ['cpu.brand', 'cpu.model', 'os.name', 'os.version'],

	notebook: [
		'cpu.brand',
		'cpu.model',
		'ram.type',
		'ram.capacity_gb',
		'ram.modules',
		'ram.channel',
		'ram.max_supported_gb',
		'storage.config',
		'storage.primary.type',
		'storage.primary.capacity_gb',
		'storage.secondary.type',
		'storage.secondary.capacity_gb',
		'os.name',
		'battery.capacity',
	],

	device: [
		'cpu.brand',
		'cpu.model',
		'ram.type',
		'ram.capacity_gb',
		'ram.modules',
		'ram.channel',
		'ram.max_supported_gb',
		'storage.config',
		'storage.primary.type',
		'storage.primary.capacity_gb',
		'storage.secondary.type',
		'storage.secondary.capacity_gb',
		'storage.upgradable',
		'storage.available_slots.m2',
		'storage.available_slots.sata',
		'gpu.type',
		'gpu.model',
		'os.name',
		'packaging.charger_included',
		'grade',
	],

	desktop_pc: [
		'cpu.brand',
		'cpu.model',
		'ram.type',
		'ram.capacity_gb',
		'ram.modules',
		'ram.max_supported_gb',
		'storage.config',
		'storage.primary.type',
		'storage.primary.capacity_gb',
		'storage.upgradable',
		'storage.available_slots.m2',
		'storage.available_slots.sata',
		'gpu.type',
		'gpu.model',
		'os.name',
		'packaging.charger_included',
	],

	aio: [
		'cpu.brand',
		'cpu.model',
		'ram.capacity_gb',
		'storage.primary.type',
		'storage.primary.capacity_gb',
		'os.name',
	],

	monitor: ['display.size', 'display.panel', 'display.resolution', 'display.refresh_rate'],
};

function getByPath(obj, path) {
	if (!obj || !path) return undefined;
	const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
	let cur = obj;
	for (const p of parts) {
		if (cur === undefined || cur === null) return undefined;
		cur = cur[p];
	}
	return cur;
}

function isMissing(v) {
	if (v === undefined || v === null) return true;
	if (typeof v === 'string' && v.trim() === '') return true;
	if (Array.isArray(v) && v.length === 0) return true;
	return false;
}

function check(payload, productType) {
	const attrs = payload.attributes_json || payload;
	const required = ATTRIBUTES_FIELD_PATHS[productType] || ATTRIBUTES_FIELD_PATHS.general || [];
	const missing = [];
	for (const path of required) {
		const v = getByPath(attrs, path);
		if (isMissing(v)) missing.push(path);
	}
	return missing;
}

const productType = 'desktop_pc';
const missing = check(payload.data || payload, productType);
console.log('Missing paths for type', productType, ':', missing);
console.log('Count:', missing.length);

process.exit(0);
