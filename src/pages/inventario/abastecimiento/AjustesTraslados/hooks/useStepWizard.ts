import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

/** Mensaje que bloquea el avance, o `undefined` si el paso está completo. */
export type TValidateStep<K extends string> = (key: K) => Promise<string | undefined>;

/**
 * Navegación paso a paso con el mismo criterio que `FormShell` de revisiones
 * técnicas: se retrocede libremente y se avanza de a un paso, sólo con el paso
 * actual válido. Al confirmar se revisan los pasos anteriores y, si alguno
 * quedó inválido (p. ej. se cambió la ubicación), se vuelve a ese paso.
 */
export default function useStepWizard<K extends string>(
	keys: readonly K[],
	validateStep: TValidateStep<K>,
) {
	const [step, setStep] = useState(0);
	const [direction, setDirection] = useState(1);
	const lastStep = keys.length - 1;

	const goTo = useCallback(
		(index: number) => {
			if (index < 0 || index > lastStep) return;
			setDirection(index >= step ? 1 : -1);
			setStep(index);
		},
		[lastStep, step],
	);

	/** Salto estable (no depende del paso actual): para volver tras confirmar. */
	const restartAt = useCallback((index: number) => {
		setDirection(-1);
		setStep(index);
	}, []);

	const blocked = useCallback(
		async (index: number): Promise<boolean> => {
			const message = await validateStep(keys[index]);
			if (!message) return false;
			toast.error(message);
			return true;
		},
		[keys, validateStep],
	);

	const next = useCallback(async () => {
		if (step >= lastStep || (await blocked(step))) return;
		goTo(step + 1);
	}, [blocked, goTo, lastStep, step]);

	const prev = useCallback(() => goTo(step - 1), [goTo, step]);

	const stepClick = useCallback(
		async (index: number) => {
			if (index < step) goTo(index);
			else if (index === step + 1) await next();
		},
		[goTo, next, step],
	);

	const finish = useCallback(
		async (submit: () => Promise<unknown>) => {
			for (let index = 0; index < lastStep; index += 1) {
				// eslint-disable-next-line no-await-in-loop
				if (await blocked(index)) {
					goTo(index);
					return;
				}
			}
			await submit();
		},
		[blocked, goTo, lastStep],
	);

	return useMemo(
		() => ({
			step,
			stepKey: keys[step],
			direction,
			isLastStep: step === lastStep,
			goTo,
			restartAt,
			next,
			prev,
			stepClick,
			finish,
		}),
		[step, keys, direction, lastStep, goTo, restartAt, next, prev, stepClick, finish],
	);
}
