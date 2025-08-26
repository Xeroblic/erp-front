import { useAppSelector } from '../store/hook';
import themeConfig from '../config/theme.config';

/**
 * Hook que devuelve la configuración dinámica del tema
 * basada en la personalización del usuario
 */
const useDynamicThemeConfig = () => {
    const { personalizacionUsuario } = useAppSelector((state) => state.auth);

    return themeConfig.getDynamicConfig(personalizacionUsuario);
};

export default useDynamicThemeConfig;
