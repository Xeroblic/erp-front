import { eachDayOfInterval, isWeekend } from "date-fns";

// Función para calcular la cantidad de días hábiles entre dos fechas, incluyendo ambos extremos
const calcularDiasHabiles = (fechaInicio: Date, fechaFin: Date): number => {
    const allDays = eachDayOfInterval({ start: fechaInicio, end: fechaFin });
    const businessDays = allDays.filter(day => !isWeekend(day));
    return businessDays.length;
};

export default calcularDiasHabiles