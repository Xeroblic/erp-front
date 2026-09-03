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

describe('filterTechnicalReviewPayload (campos derivados)', () => {
	/**
	 * `loose_ports_count` lo calcula el servidor a partir del desglose y su hint pide
	 * explícitamente no enviarlo. Sigue en el estado del formulario porque se hidrata desde
	 * la respuesta, así que sin este filtro viajaría en cada guardado.
	 */
	it('never sends the total the server derives from the breakdown', () => {
		const payload = filterTechnicalReviewPayload(
			{ loose_ports_count: 3, loose_port_types: { hdmi: 2, usb_c: 1 }, brand: 'Dell' },
			HARDWARE_NULLABLE_FIELDS,
		);

		expect(payload).not.toHaveProperty('loose_ports_count');
		expect(payload.loose_port_types).toEqual({ hdmi: 2, usb_c: 1 });
		expect(payload.brand).toBe('Dell');
	});

	/**
	 * Las revisiones anteriores a ZF-98 llegan con `defective_ports_count > 0` y el mapa en
	 * `null`, porque la migración del 01-09 no las rellenó. Las cuatro rutas de escritura
	 * —submit final, los dos autoguardados y `onDirectSubmit`— terminan en
	 * `updateItemDetails`, que filtra con esta función: el conteo histórico tiene que
	 * viajar intacto y el mapa nulo no debe enviarse.
	 */
	it('keeps the historic defective count and drops the breakdown that was never recorded', () => {
		const payload = filterTechnicalReviewPayload(
			{
				all_ports_functional: false,
				defective_ports_count: 3,
				defective_port_types: null,
			},
			HARDWARE_NULLABLE_FIELDS,
		);

		expect(payload.defective_ports_count).toBe(3);
		expect(payload).not.toHaveProperty('defective_port_types');
		expect(payload.all_ports_functional).toBe(false);
	});

	/** `{}` es «se midió, ninguno»; omitir el campo sería «no se midió». */
	it('keeps an empty breakdown so the measurement is recorded', () => {
		const payload = filterTechnicalReviewPayload(
			{ loose_port_types: {}, defective_port_types: {} },
			HARDWARE_NULLABLE_FIELDS,
		);

		expect(payload.loose_port_types).toEqual({});
		expect(payload.defective_port_types).toEqual({});
	});
});
