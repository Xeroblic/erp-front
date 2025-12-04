// utils/acl.ts
export const hasPermission = (pattern: string, granted: string[]): boolean => {
	// ► super-admin siempre pasa
	if (granted.includes('super-admin')) return true;

	// ► comodín “prefijo:*”
	if (pattern.endsWith(':*')) {
		const pref = pattern.slice(0, -2); // "company"
		return granted.some(
			(p) =>
				p.startsWith(`${pref}-`) || // company-create
				p.endsWith(`-${pref}`) || // create-company   ← este caso
				p.includes(`-${pref}-`), // algo-company-algo
		);
	}

	// ► coincidencia exacta
	return granted.includes(pattern);
};
