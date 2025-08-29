import React from 'react';
import Button from '../ui/Button';
import ButtonGroup from '../ui/ButtonGroup';
import useDarkModeManager from '../../hooks/useDarkModeManager.ts';
import useFontSize from '../../hooks/useFontSize';
import useThemeColor from '../../hooks/useThemeColor';
import DARK_MODE from '../../constants/darkMode.constant';

/**
 * Componente de prueba para verificar que el sistema de personalización funcione
 */
const PersonalizacionTest: React.FC = () => {
    const {
        darkModeStatus,
        isDarkTheme,
        setDarkModeStatus,
        isLight,
        isDark,
        isSystem,
        systemPrefersDark
    } = useDarkModeManager();

    const { fontSize, setFontSize } = useFontSize();
    const { themeColor, setThemeColor, themeColorShade, setThemeColorShade } = useThemeColor();

    return (
        <div className="fixed top-4 left-4 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg p-4 shadow-lg z-50 max-w-md">
            <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
                🧪 Test Personalización
            </h3>

            <div className="space-y-4">
                {/* Dark Mode Test */}
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Dark Mode:</h4>
                    <ButtonGroup>
                        <Button
                            size="sm"
                            onClick={() => setDarkModeStatus(DARK_MODE.LIGHT)}
                            variant={isLight ? 'solid' : 'outline'}
                        >
                            ☀️
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setDarkModeStatus(DARK_MODE.DARK)}
                            variant={isDark ? 'solid' : 'outline'}
                        >
                            🌙
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setDarkModeStatus(DARK_MODE.SYSTEM)}
                            variant={isSystem ? 'solid' : 'outline'}
                        >
                            💻
                        </Button>
                    </ButtonGroup>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Estado: {darkModeStatus} | Activo: {isDarkTheme ? 'Oscuro' : 'Claro'}
                        {isSystem && ` | Sistema: ${systemPrefersDark ? 'Oscuro' : 'Claro'}`}
                    </div>
                </div>

                {/* Font Size Test */}
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Font Size:</h4>
                    <ButtonGroup>
                        <Button
                            size="sm"
                            onClick={() => setFontSize(fontSize - 1)}
                            isDisable={fontSize <= 12}
                        >
                            -
                        </Button>
                        <Button size="sm" isDisable>
                            {fontSize}px
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setFontSize(fontSize + 1)}
                            isDisable={fontSize >= 18}
                        >
                            +
                        </Button>
                    </ButtonGroup>
                </div>

                {/* Theme Color Test */}
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Color:</h4>
                    <div className="flex gap-2 flex-wrap">
                        {['red', 'amber', 'emerald', 'blue', 'violet'].map((color) => (
                            <button
                                key={color}
                                className={`w-6 h-6 rounded border-2 ${themeColor === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-300'
                                    }`}
                                style={{ backgroundColor: `var(--color-${color}-500, #6b7280)` }}
                                onClick={() => setThemeColor(color as any)}
                            />
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Actual: {themeColor}-{themeColorShade}
                    </div>
                </div>

                {/* HTML Classes Debug */}
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">HTML Classes:</h4>
                    <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        {document.documentElement.className || 'ninguna'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalizacionTest;
