import { useContext } from 'react';
import ThemeContext from '../context/themeContext';

const useThemeColor = () => {
    const { themeColor, setThemeColor, themeColorShade, setThemeColorShade } = useContext(ThemeContext);

    return { themeColor, setThemeColor, themeColorShade, setThemeColorShade };
};

export default useThemeColor;