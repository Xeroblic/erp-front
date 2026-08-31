import { describe, expect, it } from 'vitest';
import {
	applyHardwareAbsenceToPayload,
	filterTechnicalReviewPayload,
	HARDWARE_NULLABLE_FIELDS,
} from '@/utils/technicalReviewHardware';

describe('applyHardwareAbsenceToPayload', () => {
	it('replaces persisted RAM and storage details with explicit nulls when both are absent', () => {
		expect(
			applyHardwareAbsenceToPayload({
				has_no_ram: true,
				has_no_storage: true,
				ram_size: '8',
				ram_slots: '2',
				ram_type: 'DDR4',
				storage_size: '512',
				storage_technology: 'SSD',
			}),
		).toEqual({
			has_no_ram: true,
			has_no_storage: true,
			ram_size: null,
			ram_slots: null,
			ram_type: null,
			storage_size: null,
			storage_technology: null,
		});
	});

	it('preserves entered details when the absence flags are inactive', () => {
		const payload = {
			has_no_ram: false,
			has_no_storage: false,
			ram_size: '16',
			storage_size: '1 TB',
		};

		expect(applyHardwareAbsenceToPayload(payload)).toEqual(payload);
	});

	it('keeps hardware nulls while filtering other empty values before PATCH', () => {
		expect(
			filterTechnicalReviewPayload(
				{
					has_no_ram: true,
					has_no_storage: true,
					ram_size: '',
					ram_slots: undefined,
					ram_type: 'DDR4',
					storage_size: '',
					storage_technology: 'SSD',
					cover_condition: null,
				},
				HARDWARE_NULLABLE_FIELDS,
			),
		).toEqual({
			has_no_ram: true,
			has_no_storage: true,
			ram_size: null,
			ram_slots: null,
			ram_type: null,
			storage_size: null,
			storage_technology: null,
		});
	});

	it('preserves false and zero while omitting incomplete ZF-48 fields', () => {
		expect(
			filterTechnicalReviewPayload(
				{
					powers_on: false,
					non_functional_keys_count: 0,
					speakers_condition: '',
				},
				HARDWARE_NULLABLE_FIELDS,
			),
		).toEqual({ powers_on: false, non_functional_keys_count: 0 });
	});
});
