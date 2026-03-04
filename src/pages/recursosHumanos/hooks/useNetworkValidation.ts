// src/pages/recursosHumanos/hooks/useNetworkValidation.ts
import { useState, useCallback } from 'react';
import type { IRHNetworkValidation } from '@/interface/rh.interface';

/* ======================================================
   HOOK: Valida IP pública del usuario
   ====================================================== */

interface UseNetworkValidationReturn {
	isValidating: boolean;
	result: IRHNetworkValidation | null;
	error: string | null;
	validate: (authorizedIP: string) => Promise<IRHNetworkValidation>;
}

export function useNetworkValidation(): UseNetworkValidationReturn {
	const [isValidating, setIsValidating] = useState(false);
	const [result, setResult] = useState<IRHNetworkValidation | null>(null);
	const [error, setError] = useState<string | null>(null);

	const validate = useCallback(async (authorizedIP: string): Promise<IRHNetworkValidation> => {
		setIsValidating(true);
		setError(null);

		try {
			const response = await fetch('https://api.ipify.org?format=json');

			if (!response.ok) {
				throw new Error(`Error al consultar IP: ${response.status}`);
			}

			const data: { ip: string } = await response.json();
			const detectedIP = data.ip;
			const matches = detectedIP === authorizedIP;

			const validation: IRHNetworkValidation = {
				passed: matches,
				detectedIP,
				message: matches
					? `Red válida (IP: ${detectedIP})`
					: `Red no autorizada. IP detectada: ${detectedIP}, esperada: ${authorizedIP}`,
			};

			setResult(validation);
			setIsValidating(false);
			return validation;
		} catch (err) {
			const msg =
				err instanceof Error
					? `Error al validar red: ${err.message}`
					: 'Error desconocido al validar red';
			setError(msg);
			setIsValidating(false);
			throw new Error(msg);
		}
	}, []);

	return { isValidating, result, error, validate };
}

export default useNetworkValidation;
