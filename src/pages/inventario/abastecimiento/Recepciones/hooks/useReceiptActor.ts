import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import type { IProcurementActorCompact } from '@/interface/procurement.interface';

/**
 * «Quien solicitó ingresar al stock», nunca un worker anónimo (sección 7).
 * Lo comparten la ficha (`Ingresar al stock`/`Reintentar`) y el alta
 * («Guardar e ingresar al stock»).
 */
const useReceiptActor = (): IProcurementActorCompact | null => {
	const authUser = useAppSelector((state) => state.auth.user);

	return useMemo<IProcurementActorCompact | null>(() => {
		if (!authUser) return null;
		const name = [authUser.first_name, authUser.last_name].filter(Boolean).join(' ').trim();
		return { id: authUser.id, name: name || authUser.email };
	}, [authUser]);
};

export default useReceiptActor;
