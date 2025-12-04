import { injectReducer } from './storeSetup';
import personalizacionReducer from './slices/personalizacion/personalizacionSlice';

// Función para inicializar el slice de personalización dinámicamente
export const initializePersonalizacionSlice = () => {
	// Inyectar el reducer dinámicamente para evitar dependencia circular
	injectReducer('personalizacion', personalizacionReducer);
};

// Llamar automáticamente a la inicialización
initializePersonalizacionSlice();
