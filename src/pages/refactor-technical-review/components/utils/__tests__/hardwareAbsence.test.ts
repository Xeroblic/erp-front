import { describe, expect, it } from 'vitest';
import { getHardwareDisplayValue } from '../hardwareAbsence';
import { notebookSchema } from '../../validation/notebook.schema';
import { desktopSchema } from '../../validation/desktop.schema';
import { aioSchema } from '../../validation/aio.schema';

describe('hardware absence flags', () => {
	it('shows absence only for the related hardware fields and preserves a string zero elsewhere', () => {
		const details = { has_no_ram: true, has_no_storage: true, usb_a_ports: '0' };
		expect(getHardwareDisplayValue(details, 'ram_size')).toBe('No tiene');
		expect(getHardwareDisplayValue(details, 'storage_size')).toBe('No tiene');
		expect(getHardwareDisplayValue(details, 'ram_slots')).toBe('');
		expect(getHardwareDisplayValue(details, 'usb_a_ports')).toBeNull();
	});

	it.each([
		['notebook', notebookSchema],
		['desktop', desktopSchema],
		['aio', aioSchema],
	])('%s allows absent hardware dependencies', async (_type, schema) => {
		await expect(schema.validateAt('ram_type', { has_no_ram: true })).resolves.toBeUndefined();
		await expect(
			schema.validateAt('storage_technology', { has_no_storage: true }),
		).resolves.toBeUndefined();
		await expect(schema.validateAt('ram_size', { has_no_ram: false })).rejects.toThrow(
			'La RAM es obligatoria',
		);
	});
});
