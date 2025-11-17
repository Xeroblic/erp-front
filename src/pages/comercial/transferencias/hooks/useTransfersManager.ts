/**
 * Hook legado manteniendo la interfaz pública para no romper imports históricos.
 * La versión actual del módulo usa Redux directamente, por lo que este hook
 * simplemente lanza un error guía para los desarrolladores.
 */

const useTransfersManager = () => {
	throw new Error(
		'useTransfersManager fue deprecado. Usa el slice de Redux transferencias directamente.',
	);
};

export default useTransfersManager;
