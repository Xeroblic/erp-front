import { useMemo } from 'react';
import {
	sanitiseAttributesInput,
	prepareAttributesForSubmit,
} from '../utils/dynamicAttributes.utils';

// helper to resolve dot paths and numeric indices like 'variants.0.sku' or 'items[0].name'
const getByPath = (obj: any, path: string): any => {
	if (!obj || !path) return undefined;
	const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
	let cur: any = obj;
	for (const p of parts) {
		if (cur === undefined || cur === null) return undefined;
		cur = cur[p];
	}
	return cur;
};

/**
 * useAttributesValidator
 * - productType: optional, not used by default logic (kept for future extensions)
 * - rawAttributes: the attributes_json coming from the product
 * - opts.requiredPaths?: optional array of dot-paths to validate explicitly
 *
 * Behavior:
 * - If opts.requiredPaths is provided, check each path against sanitised attributes and return missing list
 * - Otherwise, fallback to simple presence: prepareAttributesForSubmit(...) !== null => considered complete
 */
export const useAttributesValidator = (
	productType?: string | null,
	rawAttributes?: unknown,
	opts?: { requiredPaths?: string[]; treatEmptyStringAsMissing?: boolean },
) => {
	const res = useMemo(() => {
		const baseRequired = opts?.requiredPaths ?? [];

		// Parse rawAttributes (may be JSON string or object) and apply lightweight normalization.
		let parsed: any = rawAttributes ?? {};
		if (typeof parsed === 'string') {
			try {
				parsed = JSON.parse(parsed);
			} catch {
				parsed = {};
			}
		}

		// Normalization helper: try to map flat/legacy keys to the nested shape the UI expects.
		// This avoids false negatives when both 'RAM' and 'ram.capacity_gb' or 'CPU' and 'cpu.model' exist.
		const tryParseNumber = (v: any): number | undefined => {
			if (typeof v === 'number') return v;
			if (typeof v !== 'string') return undefined;
			const m = v.match(/(\d+)(?:[.,]?\d*)/);
			if (!m) return undefined;
			return Number(m[1]);
		};

		const ensure = (obj: any, path: string, value: any) => {
			const parts = path.split('.');
			let cur = obj;
			for (let i = 0; i < parts.length - 1; i++) {
				const p = parts[i];
				if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
				cur = cur[p];
			}
			const last = parts[parts.length - 1];
			if (cur[last] === undefined || cur[last] === null || cur[last] === '') {
				cur[last] = value;
			}
		};

		try {
			// Map common flat keys into nested structure when missing
			if (parsed && typeof parsed === 'object') {
				// CPU mapping
				if (parsed.CPU && !(parsed.cpu && parsed.cpu.model)) {
					ensure(parsed, 'cpu.model', parsed.CPU);
				}
				if (
					parsed.cpu &&
					typeof parsed.cpu === 'string' &&
					!(parsed.cpu && parsed.cpu.model)
				) {
					ensure(parsed, 'cpu.model', parsed.cpu);
				}

				// RAM mapping
				if (parsed.RAM && !(parsed.ram && (parsed.ram.capacity_gb || parsed.ram.gb))) {
					const n = tryParseNumber(parsed.RAM);
					ensure(parsed, 'ram.capacity_gb', n !== undefined ? n : parsed.RAM);
					// also set ram.gb alias when possible
					if (!parsed.ram) parsed.ram = parsed.ram || {};
					if (
						parsed.ram &&
						parsed.ram.capacity_gb !== undefined &&
						parsed.ram.gb === undefined
					) {
						parsed.ram.gb = parsed.ram.capacity_gb;
					}
				}
				if (parsed.ram && parsed.ram.capacity_gb === undefined && parsed.ram.capacity) {
					const n = tryParseNumber(parsed.ram.capacity);
					if (n !== undefined) parsed.ram.capacity_gb = n;
					if (
						parsed.ram &&
						parsed.ram.capacity_gb !== undefined &&
						parsed.ram.gb === undefined
					) {
						parsed.ram.gb = parsed.ram.capacity_gb;
					}
				}

				// grade fallback
				if (parsed.grade && !(parsed.grade && typeof parsed.grade === 'string')) {
					ensure(parsed, 'grade', parsed.grade);
				}

				// gpu flat
				if (parsed.GPU && !(parsed.gpu && parsed.gpu.model)) {
					ensure(parsed, 'gpu.model', parsed.GPU);
				}

				// storage flat (primary capacity)
				if (
					parsed.storage &&
					typeof parsed.storage === 'number' &&
					!(parsed.storage && parsed.storage.primary)
				) {
					ensure(parsed, 'storage.primary.capacity_gb', parsed.storage);
				}
			}
		} catch (e) {
			// normalization best-effort; ignore failures
			// console.debug('attributes normalization failed', e);
		}

		// sanitise attributes input to get a consistent object after normalization
		const sanitised = sanitiseAttributesInput(parsed ?? {}, true);

		// Build final required paths with simple conditional rules
		const dynamicRequired = new Set<string>(baseRequired);

		// Conditional: storage secondary required if config = 'hybrid'
		const storageConfig = getByPath(sanitised, 'storage.config');
		if (storageConfig === 'hybrid') {
			dynamicRequired.add('storage.secondary.type');
			dynamicRequired.add('storage.secondary.capacity_gb');
		}

		// Conditional: when storage is upgradable, require upgrade-related fields
		const storageUpgradable = getByPath(sanitised, 'storage.upgradable');
		if (storageUpgradable === true) {
			dynamicRequired.add('storage.max_supported_gb');
			dynamicRequired.add('storage.available_slots.m2');
			dynamicRequired.add('storage.available_slots.sata');
		}

		// Conditional: charger type required only if charger_included = true
		const chargerIncluded = getByPath(sanitised, 'packaging.charger_included');
		if (chargerIncluded === true) {
			dynamicRequired.add('packaging.charger_type');
		}

		// Conditional: if OS = Windows, version is required
		const osName = getByPath(sanitised, 'os.name');
		if (osName === 'Windows') {
			dynamicRequired.add('os.version');
		}

		const required = Array.from(dynamicRequired);

		const numericZeroIsMissingFor = new Set<string>([
			'ram.modules',
			'display.size_inches',
			'display.refresh_hz',
			'storage.primary.capacity_gb',
			'storage.secondary.capacity_gb',
			'storage.max_supported_gb',
			'storage.available_slots.m2',
			'storage.available_slots.sata',
		]);

		if (required.length > 0) {
			const missing: string[] = [];
			for (const path of required) {
				const v = getByPath(sanitised, path);
				let isMissing =
					v === undefined ||
					v === null ||
					(opts?.treatEmptyStringAsMissing && typeof v === 'string' && v.trim() === '') ||
					(Array.isArray(v) && v.length === 0);

				if (!isMissing && numericZeroIsMissingFor.has(path) && typeof v === 'number') {
					isMissing = v <= 0;
				}

				if (isMissing) missing.push(path);
			}
			const ok = missing.length === 0;

			// friendly labels for missing fields (turn 'ram.capacity_gb' -> 'RAM (capacity_gb)')
			const missingLabels = missing.map((p) => {
				const parts = p.split('.');
				const group = parts[0] ?? '';
				const last = parts[parts.length - 1];
				const labelGroup = group
					.replace('_', ' ')
					.replace('cpu', 'CPU')
					.replace('gpu', 'GPU')
					.replace('os', 'OS')
					.replace('ram', 'RAM')
					.replace('aio', 'AIO')
					.replace('pc', 'PC');
				return `${labelGroup} · ${last}`;
			});

			return {
				ok,
				missing,
				missingCount: missing.length,
				missingLabels,
				readyToPublish: ok,
			} as any;
		}

		// fallback: if prepareAttributesForSubmit returns non-null, we consider attributes present
		const prepared = prepareAttributesForSubmit(parsed ?? {}, true);
		const ok = prepared !== null;
		return {
			ok,
			missing: ok ? [] : ['attributes_json'],
			missingCount: ok ? 0 : 1,
			readyToPublish: ok,
		};
	}, [productType, JSON.stringify(rawAttributes ?? {}), JSON.stringify(opts ?? {})]);

	return res;
};

export default useAttributesValidator;
