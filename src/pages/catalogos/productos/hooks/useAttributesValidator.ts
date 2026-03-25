import { useMemo } from 'react';
import {
	sanitiseAttributesInput,
	prepareAttributesForSubmit,
} from '../utils/dynamicAttributes.utils';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as UnknownRecord;
	}
	return undefined;
};

// helper to resolve dot paths and numeric indices like 'variants.0.sku' or 'items[0].name'
const getByPath = (obj: unknown, path: string): unknown => {
	if (!obj || !path) return undefined;
	const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
	let cur: unknown = obj;
	for (const p of parts) {
		if (cur === undefined || cur === null) return undefined;
		if (Array.isArray(cur)) {
			const index = Number(p);
			cur = Number.isInteger(index) ? cur[index] : undefined;
			continue;
		}
		const rec = asRecord(cur);
		cur = rec ? rec[p] : undefined;
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
		let parsed: unknown = rawAttributes ?? {};
		if (typeof parsed === 'string') {
			try {
				parsed = JSON.parse(parsed);
			} catch {
				parsed = {};
			}
		}
		const parsedRecord = asRecord(parsed) ?? {};

		// Normalization helper: try to map flat/legacy keys to the nested shape the UI expects.
		// This avoids false negatives when both 'RAM' and 'ram.capacity_gb' or 'CPU' and 'cpu.model' exist.
		const tryParseNumber = (v: unknown): number | undefined => {
			if (typeof v === 'number') return v;
			if (typeof v !== 'string') return undefined;
			const m = v.match(/(\d+)(?:[.,]?\d*)/);
			if (!m) return undefined;
			return Number(m[1]);
		};

		const ensure = (obj: UnknownRecord, path: string, value: unknown) => {
			const parts = path.split('.');
			let cur: UnknownRecord = obj;
			for (let i = 0; i < parts.length - 1; i++) {
				const p = parts[i];
				const next = asRecord(cur[p]);
				if (!next) {
					cur[p] = {};
				}
				cur = asRecord(cur[p]) ?? {};
			}
			const last = parts[parts.length - 1];
			if (cur[last] === undefined || cur[last] === null || cur[last] === '') {
				cur[last] = value;
			}
		};

		try {
			// Map common flat keys into nested structure when missing
			if (Object.keys(parsedRecord).length > 0) {
				// CPU mapping
				const cpuVal = parsedRecord.CPU;
				const cpuObj = asRecord(parsedRecord.cpu);
				if (cpuVal && !(cpuObj && cpuObj.model)) {
					ensure(parsedRecord, 'cpu.model', cpuVal);
				}
				if (
					typeof parsedRecord.cpu === 'string' &&
					!(asRecord(parsedRecord.cpu)?.model)
				) {
					ensure(parsedRecord, 'cpu.model', parsedRecord.cpu);
				}

				// RAM mapping
				const ramVal = parsedRecord.RAM;
				const ramObj = asRecord(parsedRecord.ram);
				if (ramVal && !(ramObj && (ramObj.capacity_gb || ramObj.gb))) {
					const n = tryParseNumber(ramVal);
					ensure(parsedRecord, 'ram.capacity_gb', n !== undefined ? n : ramVal);
					// also set ram.gb alias when possible
					if (!asRecord(parsedRecord.ram)) parsedRecord.ram = {};
					const normalizedRam = asRecord(parsedRecord.ram);
					if (
						normalizedRam &&
						normalizedRam.capacity_gb !== undefined &&
						normalizedRam.gb === undefined
					) {
						normalizedRam.gb = normalizedRam.capacity_gb;
					}
				}
				const nextRam = asRecord(parsedRecord.ram);
				if (nextRam && nextRam.capacity_gb === undefined && nextRam.capacity) {
					const n = tryParseNumber(nextRam.capacity);
					if (n !== undefined) nextRam.capacity_gb = n;
					if (
						nextRam.capacity_gb !== undefined &&
						nextRam.gb === undefined
					) {
						nextRam.gb = nextRam.capacity_gb;
					}
				}

				// grade fallback
				if (parsedRecord.grade && typeof parsedRecord.grade !== 'string') {
					ensure(parsedRecord, 'grade', parsedRecord.grade);
				}

				// gpu flat
				if (parsedRecord.GPU && !(asRecord(parsedRecord.gpu)?.model)) {
					ensure(parsedRecord, 'gpu.model', parsedRecord.GPU);
				}

				// storage flat (primary capacity)
				if (
					typeof parsedRecord.storage === 'number' &&
					!(asRecord(parsedRecord.storage)?.primary)
				) {
					ensure(parsedRecord, 'storage.primary.capacity_gb', parsedRecord.storage);
				}
			}
		} catch (e) {
			// normalization best-effort; ignore failures
			// console.debug('attributes normalization failed', e);
		}

		// sanitise attributes input to get a consistent object after normalization
		const sanitised = sanitiseAttributesInput(parsedRecord, true);

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
			};
		}

		// fallback: if prepareAttributesForSubmit returns non-null, we consider attributes present
		const prepared = prepareAttributesForSubmit(parsedRecord, true);
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
