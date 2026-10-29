import React from 'react';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import RangeSlider from '@/components/ui/RangeSlider';
import { SelectionCard } from '../../../ui/SelectionCard';
import type { SelectionCardColor } from '../../../ui/SelectionCard';
import { YesNoSelector } from '../../../ui/YesNoSelector';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import {
	BATTERY_STATUS_OPTIONS,
	CHARGER_STATUS_OPTIONS,
} from '../../../constants/notebook/notebook.options';
import type {
	BatteryStatusValue,
	ChargerStatusValue,
} from '../../../constants/notebook/notebook.options';

/** Color semántico de la tarjeta de estado de batería según su valor. */
const BATTERY_COLOR_BY_STATUS: Record<BatteryStatusValue, SelectionCardColor> = {
	excellent: 'green',
	good: 'green',
	fair: 'orange',
	poor: 'red',
	no_battery: 'gray',
};

const getBatteryColor = (value: BatteryStatusValue) => BATTERY_COLOR_BY_STATUS[value];

const CHARGER_COLOR_BY_STATUS: Record<ChargerStatusValue, SelectionCardColor> = {
	buen_estado: 'green',
	cable_en_mal_estado: 'red',
	no_corresponde_a_equipo: 'gray',
	no_incluye: 'gray',
	broken_charger: 'red',
	broken_port: 'red',
};

const getChargerStatusColor = (value: ChargerStatusValue) => CHARGER_COLOR_BY_STATUS[value];

/** Oculta las flechas nativas de los input numéricos para que no choquen con sufijos (% / W). */
const NO_NATIVE_SPINNERS =
	'[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

const PowerSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	onFieldBlur,
	errors,
	readOnly,
	values,
	setFieldValue,
}) => {
	const batteryStatus = values.battery_status;
	const includesCharger = values.includes_charger;
	const { brand } = values;
	const isDell = typeof brand === 'string' && brand.toLowerCase().includes('dell');

	const hasSecondBattery = values.has_second_battery;
	const secondBatteryStatus = values.second_battery_status;

	return (
		<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
			{/* --- LEFT: Cargador --- */}
			<div className='rounded-xl border border-orange-200 bg-orange-50 p-4 transition-colors duration-200 dark:border-orange-800 dark:bg-orange-900/10'>
				<p className='mb-3 block text-center text-sm font-bold tracking-wide text-orange-800 uppercase dark:text-orange-200'>
					Energía
				</p>

				<p className='mb-2 block text-center text-xs font-semibold text-zinc-500'>
					¿Incluye Cargador Original?
				</p>

				<div className='mb-6 flex justify-center'>
					<YesNoSelector
						label=''
						value={includesCharger}
						onChange={(val) => {
							if (readOnly) return;
							setFieldValue('includes_charger', val);
							if (!val) {
								setFieldValue('charger_status', null);
								setFieldValue('charger_watts', undefined);
							}
						}}
					/>
				</div>

				{includesCharger && (
					<div className='animate-in fade-in slide-in-from-top-4 space-y-6 duration-300'>
						{/* Charger Watts */}
						<div className='rounded-lg border border-orange-200 bg-white p-4 shadow-xs dark:border-zinc-700 dark:bg-zinc-800'>
							<p className='mb-3 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
								<span>POTENCIA (WATTS)</span>
								<Icon icon='HeroBolt' className='h-4 w-4 text-orange-500' />
							</p>
							<div className='space-y-2'>
								<div className='flex items-center gap-4'>
									<div className='flex-1'>
										<RangeSlider
											value={Number(values.charger_watts) || 0}
											onChange={(val) =>
												setFieldValue('charger_watts', String(val))
											}
											min={0}
											max={300}
											step={5}
											unit='W'
											disabled={readOnly}
										/>
									</div>
									<div className='relative w-20'>
										<Input
											name='watts'
											type='number'
											value={values.charger_watts || ''}
											onChange={(e) =>
												setFieldValue('charger_watts', e.target.value)
											}
											placeholder='0'
											className={`pr-7 text-center text-sm ${NO_NATIVE_SPINNERS}`}
											disabled={readOnly}
											min={0}
											max={300}
										/>
										<span className='pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-zinc-400'>
											W
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Charger Status */}
						<div>
							<div className='grid grid-cols-2 gap-2'>
								{CHARGER_STATUS_OPTIONS.map((opt) => (
									<SelectionCard
										key={opt.value}
										label={opt.label}
										value={opt.value}
										isSelected={values.charger_status === opt.value}
										onClick={() =>
											!readOnly &&
											setFieldValue('charger_status', opt.value, {
												touch: true,
											})
										}
										variant='default'
										className='text-xs'
										color={getChargerStatusColor(opt.value)}
									/>
								))}
							</div>
							{errors.charger_status && (
								<p className='mt-2 text-center text-xs text-red-500'>
									{errors.charger_status}
								</p>
							)}

							{/* Critical Alert for broken_port */}
							{values.charger_status === 'broken_port' && (
								<div className='mt-3 animate-pulse rounded-lg border border-red-500 bg-red-100 p-2 text-center text-xs font-bold text-red-800 dark:bg-red-900/50 dark:text-red-100'>
									CRÍTICO: Entrada rota = Grado M
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* --- RIGHT: Batería --- */}
			<div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-colors duration-200 dark:border-emerald-800 dark:bg-emerald-900/10'>
				<label className='mb-4 block text-center text-sm font-bold tracking-wide text-emerald-800 uppercase dark:text-emerald-200'>
					{isDell ? 'Estado Batería (BIOS)' : 'Salud Batería'}
				</label>

				{isDell ? (
					<>
						{/* Dell: Buttons only (BIOS info already gives health) */}
						<div className='mb-6 grid grid-cols-2 gap-3'>
							{BATTERY_STATUS_OPTIONS.map((opt) => (
								<SelectionCard
									key={opt.value}
									label={opt.label}
									value={opt.value}
									isSelected={batteryStatus === opt.value}
									onClick={() => {
										if (readOnly) return;
										setFieldValue('battery_status', opt.value, { touch: true });
										setFieldValue('battery_health', opt.label, { touch: true });
										if (opt.value === 'no_battery') {
											setFieldValue('battery_percentage', 0, { touch: true });
											setFieldValue('battery_health', 'Sin Batería', {
												touch: true,
											});
										}
									}}
									color={getBatteryColor(opt.value)}
									className='py-3 text-xs'
								/>
							))}
						</div>
					</>
				) : (
					/* Non-Dell: Big Percentage Input Only */
					<div className='flex flex-col items-center justify-center space-y-4 py-4'>
						<div className='relative w-32'>
							<div className='relative'>
								<Input
									name='battery_percentage'
									onBlur={() => onFieldBlur('battery_percentage')}
									type='number'
									value={values.battery_percentage ?? ''}
									onChange={(e) => {
										const val =
											e.target.value === '' ? null : Number(e.target.value);
										setFieldValue('battery_percentage', val, { touch: true });
									}}
									placeholder='0'
									className={`h-16 pr-9 text-center text-3xl font-bold text-zinc-700 dark:text-zinc-200 ${NO_NATIVE_SPINNERS}`}
									disabled={readOnly}
									min={0}
									max={100}
								/>
								<span className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xl font-bold text-zinc-400'>
									%
								</span>
							</div>
						</div>
					</div>
				)}

				{/* --- Segunda Batería (opcional) --- */}
				<div className='mt-4 border-t border-emerald-200 pt-4 dark:border-emerald-800'>
					<p className='mb-2 block text-center text-xs font-semibold text-zinc-500'>
						¿Viene con una segunda batería?
					</p>

					<div className='mb-4 flex justify-center'>
						<YesNoSelector
							label=''
							value={hasSecondBattery}
							onChange={(val) => {
								if (readOnly) return;
								setFieldValue('has_second_battery', val);
								if (!val) {
									setFieldValue('second_battery_status', null);
									setFieldValue('second_battery_percentage', null);
									setFieldValue('second_battery_condition', null);
								}
							}}
						/>
					</div>

					{hasSecondBattery && (
						<div className='animate-in fade-in slide-in-from-top-4 space-y-4 duration-300'>
							<label className='block text-center text-sm font-bold tracking-wide text-emerald-800 uppercase dark:text-emerald-200'>
								{isDell ? 'Estado 2ª Batería (BIOS)' : 'Salud 2ª Batería'}
							</label>

							{isDell ? (
								/* Dell: mismos botones que la batería principal */
								<div className='grid grid-cols-2 gap-3'>
									{BATTERY_STATUS_OPTIONS.map((opt) => (
										<SelectionCard
											key={opt.value}
											label={opt.label}
											value={opt.value}
											isSelected={secondBatteryStatus === opt.value}
											onClick={() => {
												if (readOnly) return;
												setFieldValue('second_battery_status', opt.value, {
													touch: true,
												});
												setFieldValue(
													'second_battery_condition',
													opt.label,
													{ touch: true },
												);
												if (opt.value === 'no_battery') {
													setFieldValue('second_battery_percentage', 0, {
														touch: true,
													});
													setFieldValue(
														'second_battery_condition',
														'Sin Batería',
														{ touch: true },
													);
												}
											}}
											color={getBatteryColor(opt.value)}
											className='py-3 text-xs'
										/>
									))}
								</div>
							) : (
								/* Non-Dell: mismo input de porcentaje que la principal */
								<div className='flex flex-col items-center justify-center py-2'>
									<div className='relative w-32'>
										<div className='relative'>
											<Input
												name='second_battery_percentage'
												onBlur={() =>
													onFieldBlur('second_battery_percentage')
												}
												type='number'
												value={values.second_battery_percentage ?? ''}
												onChange={(e) => {
													const val =
														e.target.value === ''
															? null
															: Number(e.target.value);
													setFieldValue(
														'second_battery_percentage',
														val,
														{ touch: true },
													);
												}}
												placeholder='0'
												className={`h-16 pr-9 text-center text-3xl font-bold text-zinc-700 dark:text-zinc-200 ${NO_NATIVE_SPINNERS}`}
												disabled={readOnly}
												min={0}
												max={100}
											/>
											<span className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xl font-bold text-zinc-400'>
												%
											</span>
										</div>
									</div>
								</div>
							)}

							{errors.second_battery_status && (
								<p className='text-center text-xs text-red-500'>
									{errors.second_battery_status}
								</p>
							)}
							{errors.second_battery_percentage && (
								<p className='text-center text-xs text-red-500'>
									{errors.second_battery_percentage}
								</p>
							)}
						</div>
					)}
				</div>

				<div className='mt-4 text-center text-[10px] text-zinc-400'>
					Información de salud del componente
				</div>
			</div>
		</div>
	);
};

export default PowerSection;
