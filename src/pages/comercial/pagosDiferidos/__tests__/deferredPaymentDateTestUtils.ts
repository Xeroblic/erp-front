const DISPLAY_DATE_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;

/**
 * Suma días a una fecha tal como la muestran los inputs del formulario (DD-MM-YYYY)
 * y devuelve el resultado en ese mismo formato.
 *
 * El formato se valida en lugar de inferirse: adivinarlo por el prefijo del texto
 * confundía los días 20 de cada mes con un año ISO y calculaba vencimientos de 1926.
 */
const addDaysToDisplayDate = (displayDate: string, days: number): string => {
	const parts = DISPLAY_DATE_PATTERN.exec(displayDate);
	if (!parts) {
		throw new Error(
			`Se esperaba una fecha con formato DD-MM-YYYY y se recibió "${displayDate}".`,
		);
	}
	const [, day, month, year] = parts;
	const shiftedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days));
	const [resultYear, resultMonth, resultDay] = shiftedDate.toISOString().slice(0, 10).split('-');
	return `${resultDay}-${resultMonth}-${resultYear}`;
};

export default addDaysToDisplayDate;
