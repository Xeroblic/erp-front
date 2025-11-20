// Valida y calcula el DV del RUT chileno (sin puntos, opcional con guion)
export function validateRut(rut: string): boolean {
    if (!rut) return false;

    const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    if (!/^\d+$/.test(body)) return false;

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i], 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expected = 11 - (sum % 11);
    const dvExpected =
        expected === 11 ? "0" :
        expected === 10 ? "K" :
        expected.toString();

    return dv === dvExpected;
}

export function formatRut(rut: string): string {
    const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length <= 1) return clean;
    return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}
