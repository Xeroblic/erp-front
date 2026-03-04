// src/pages/recursosHumanos/hooks/useLiveClock.ts
import { useState, useEffect } from 'react';

/* ======================================================
   HOOK: Reloj en vivo (1 tick por segundo)
   ====================================================== */

interface UseLiveClockReturn {
	now: Date;
	formattedTime: string;
	formattedDate: string;
}

export function useLiveClock(): UseLiveClockReturn {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const formattedTime = now.toLocaleTimeString('es-CL', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});

	const formattedDate = now.toLocaleDateString('es-CL', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return { now, formattedTime, formattedDate };
}

export default useLiveClock;
