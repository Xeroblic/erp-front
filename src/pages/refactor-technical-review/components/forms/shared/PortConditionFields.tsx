/**
 * PortConditionFields — Estado de los puertos: defectuosos y sueltos.
 *
 * Antes había una sola pregunta, «¿Todos los puertos funcionan?», y el único detalle que se
 * podía registrar era cuántos estaban defectuosos. Un puerto suelto —el que se mueve pero
 * funciona— no cabía ahí: responder «sí funcionan» era verdad y aun así dejaba el defecto
 * sin registrar. Ahora son dos preguntas independientes, cada una con su contenedor en su
 * propia columna, y ambas capturan el desglose con un contador por tipo de puerto, igual que
 * la grilla de cantidad de puertos del equipo.
 *
 * El copy sale del schema del backend: en monitor los puertos sueltos se registran pero no
 * modifican el grado, y el backend lo dice en el `hint` sin mandar `warning`. Hardcodear acá
 * el techo de grado mentiría en ese tipo de equipo.
 */
import React from 'react';
import Icon from '@/components/icon/Icon';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { PortTypeCounters } from '../../ui/PortTypeCounters';
import { YesNoSelector } from '../../ui/YesNoSelector';
import {
	filterPortOptions,
	MAX_PORT_TYPE_COUNT,
	MAX_PORTS_TOTAL,
	PORT_TYPE_OPTIONS,
	sumPortTypeCounts,
	type PortTypeCounts,
} from '../../validation/constants/ports.rules';
import { resolveSchemaField } from '../../validation/technicalReviewSchema';

const LOOSE_PORTS_FALLBACK_HINT =
	'Un puerto suelto se mueve pero funciona; uno defectuoso no funciona.';

const isMeasured = (counts: PortTypeCounts | null | undefined): boolean =>
	counts !== null && counts !== undefined;

export interface PortConditionFieldsProps {
	schemaFields?: ITechnicalReviewSchema;
	readOnly?: boolean;

	/** `all_ports_functional`. `null`/`undefined` = la pregunta sigue sin responder. */
	allPortsFunctional: boolean | null | undefined;
	/** Desglose `{tipo: cantidad}`. `undefined` = no se midió; `{}` = se midió, ninguno. */
	defectivePortTypes: PortTypeCounts | null | undefined;
	loosePortTypes: PortTypeCounts | null | undefined;

	onAllPortsFunctionalChange: (value: boolean) => void;
	onDefectivePortTypesChange: (value: PortTypeCounts) => void;
	onLoosePortTypesChange: (value: PortTypeCounts) => void;

	/** Aviso local de puertos defectuosos, usado cuando el schema no publica el suyo. */
	defectiveWarningFallback?: string;
	/** Mensajes de error de react-hook-form, ya resueltos por la sección. */
	allPortsFunctionalError?: string;
	defectiveCountError?: string;
	/** Campos extra dentro del contenedor de defectuosos (monitor: puertos críticos). */
	defectiveExtras?: React.ReactNode;
}

export const PortConditionFields: React.FC<PortConditionFieldsProps> = ({
	schemaFields,
	readOnly = false,
	allPortsFunctional,
	defectivePortTypes,
	loosePortTypes,
	onAllPortsFunctionalChange,
	onDefectivePortTypesChange,
	onLoosePortTypesChange,
	defectiveWarningFallback,
	allPortsFunctionalError,
	defectiveCountError,
	defectiveExtras,
}) => {
	const defectiveCountField = resolveSchemaField(schemaFields?.defective_ports_count, {
		label: 'Puertos defectuosos',
		options: [],
	});
	const defectiveTypesField = resolveSchemaField(schemaFields?.defective_port_types, {
		label: 'Qué puertos están defectuosos',
		options: PORT_TYPE_OPTIONS,
	});
	const looseCountField = resolveSchemaField(schemaFields?.loose_ports_count, {
		label: 'Puertos sueltos',
		options: [],
	});
	const looseTypesField = resolveSchemaField(schemaFields?.loose_port_types, {
		label: 'Qué puertos están sueltos',
		options: PORT_TYPE_OPTIONS,
	});

	// El tope de puertos lo fija el formulario, no el schema. El `value_max: 10` que el
	// backend publica hoy queda deliberadamente sin efecto: esa validación está por
	// retirarse y operaciones necesita registrar hasta veinte. Mientras el backend siga
	// validando diez, un total mayor vuelve con 422 en el autoguardado.
	const defectiveMax = MAX_PORT_TYPE_COUNT;
	const looseMax = MAX_PORT_TYPE_COUNT;
	const defectiveTotalMax = MAX_PORTS_TOTAL;
	const looseTotalMax = MAX_PORTS_TOTAL;

	// `all_ports_functional` sigue siendo el campo que persiste y que lee el motor de
	// graduación; la pregunta se formula al revés para que ambas se respondan igual: «sí»
	// significa «hay un defecto que registrar» en las dos.
	const defectiveAnswer =
		allPortsFunctional === null || allPortsFunctional === undefined
			? undefined
			: !allPortsFunctional;
	const showDefective = allPortsFunctional === false;

	const looseTotal = sumPortTypeCounts(loosePortTypes);
	const defectiveTotal = sumPortTypeCounts(defectivePortTypes);

	// «Sí» y «no» empiezan iguales en el dato persistido: los dos son `{}`, porque
	// abrir el desglose no puede inventar un puerto. La diferencia es sólo de pantalla,
	// así que vive en el componente; el efecto únicamente abre —nunca cierra— para no
	// tapar el desglose recién respondido cuando todavía no tiene ningún tipo marcado.
	const [looseOpen, setLooseOpen] = React.useState(() => looseTotal > 0);
	React.useEffect(() => {
		if (sumPortTypeCounts(loosePortTypes) > 0) setLooseOpen(true);
	}, [loosePortTypes]);

	const resolveLooseAnswer = (): boolean | undefined => {
		if (looseOpen) return true;
		return isMeasured(loosePortTypes) ? false : undefined;
	};
	const looseAnswer = resolveLooseAnswer();

	const answerDefective = (value: boolean) => {
		if (readOnly) return;
		onAllPortsFunctionalChange(!value);
		if (!value) onDefectivePortTypesChange({});
	};

	const answerLoose = (value: boolean) => {
		if (readOnly) return;
		setLooseOpen(value);
		// En los dos casos el dato persistido es un mapa: «sí» conserva lo ya marcado y
		// «no» lo vacía. `{}` es «se midió, ninguno»; omitir el campo sería «no se midió».
		onLoosePortTypesChange(value ? (loosePortTypes ?? {}) : {});
	};

	return (
		// Cada pregunta y su contenedor viven en la misma columna. Con dos grillas separadas,
		// activar sólo «sueltos» dejaba ese contenedor en la primera columna, debajo de la
		// pregunta por los defectuosos, y se leía como si le perteneciera.
		<div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2'>
			<div className='flex flex-col gap-4'>
				<div className='rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-800/30'>
					<YesNoSelector
						label='¿Hay puertos defectuosos?'
						value={defectiveAnswer}
						onChange={answerDefective}
					/>
					<p className='mt-3 text-center text-[11px] italic text-zinc-500'>
						Un puerto defectuoso no funciona: pines doblados o sin respuesta.
					</p>
					{allPortsFunctionalError && (
						<p className='mt-2 text-center text-xs text-red-500'>
							{allPortsFunctionalError}
						</p>
					)}
				</div>

				{showDefective && (
					<div className='animate-in zoom-in flex flex-col gap-4 rounded-xl border border-red-300 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20'>
						<PortTypeCounters
							label={defectiveTypesField.label}
							options={filterPortOptions(defectiveTypesField.options)}
							value={defectivePortTypes ?? {}}
							onChange={onDefectivePortTypesChange}
							max={defectiveMax}
							totalMax={defectiveTotalMax}
							disabled={readOnly}
						/>

						<p className='text-center text-sm font-bold text-red-800 dark:text-red-200'>
							{defectiveCountField.label}: {defectiveTotal}
						</p>
						{defectiveCountError && (
							<p className='text-center text-xs text-red-500'>
								{defectiveCountError}
							</p>
						)}

						{(defectiveCountField.hint ?? defectiveWarningFallback) && (
							<div className='flex items-start gap-2 rounded-lg border border-red-200 bg-red-100 p-2 text-xs text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200'>
								<Icon
									icon='HeroExclamationTriangle'
									className='mt-0.5 h-4 w-4 flex-shrink-0'
								/>
								<span>{defectiveCountField.hint ?? defectiveWarningFallback}</span>
							</div>
						)}

						{defectiveExtras}
					</div>
				)}
			</div>

			<div className='flex flex-col gap-4'>
				<div className='rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-800/30'>
					<YesNoSelector
						label='¿Hay puertos sueltos?'
						value={looseAnswer}
						onChange={answerLoose}
					/>
					<p className='mt-3 text-center text-[11px] italic text-zinc-500'>
						{LOOSE_PORTS_FALLBACK_HINT}
					</p>
				</div>

				{looseOpen && (
					<div className='animate-in zoom-in flex flex-col gap-4 rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20'>
						<PortTypeCounters
							label={looseTypesField.label}
							options={filterPortOptions(looseTypesField.options)}
							value={loosePortTypes ?? {}}
							onChange={onLoosePortTypesChange}
							max={looseMax}
							totalMax={looseTotalMax}
							disabled={readOnly}
						/>

						{/* El total lo calcula el servidor a partir del desglose y no se envía; acá
						    sólo se muestra para que el técnico vea el número que define el techo. */}
						<p className='text-center text-sm font-bold text-amber-900 dark:text-amber-100'>
							{looseCountField.label}: {looseTotal}
						</p>

						{looseCountField.warning && looseTotal > 0 && (
							<div className='flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-100 p-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100'>
								<Icon
									icon='HeroExclamationTriangle'
									className='mt-0.5 h-4 w-4 flex-shrink-0'
								/>
								<span>{looseCountField.warning}</span>
							</div>
						)}

						{looseCountField.hint && (
							<p className='text-center text-xs text-amber-900 dark:text-amber-200'>
								{looseCountField.hint}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default PortConditionFields;
