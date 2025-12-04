import { useAppSelector } from '../store/hook';
import { selectPersonalizacionUsuario } from '../store/slices/personalizacion/personalizacionSlice';
import themeConfig from '../config/theme.config';

/**
 * Hook que devuelve la configuración dinámica del tema
 * basada en la personalización del usuario
 */
const useDynamicThemeConfig = () => {
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);

	return themeConfig.getDynamicConfig(personalizacionUsuario);
};

export default useDynamicThemeConfig;
