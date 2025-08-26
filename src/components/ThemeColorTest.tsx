import React from 'react';
import useThemeColor from '../hooks/useThemeColor';

const ThemeColorTest: React.FC = () => {
    const { themeColor, themeColorShade } = useThemeColor();

    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

    return (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md max-w-md">
            <h3 className="text-lg font-semibold mb-4">
                Test de Colores del Tema
            </h3>
            <p className="text-sm mb-4">
                Actual: {themeColor} - {themeColorShade}
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
                {shades.slice(0, 8).map((shade) => (
                    <div key={shade} className="text-center">
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '4px',
                                marginBottom: '4px',
                                backgroundColor: `var(--color-primary-${shade})`,
                                border: '1px solid #ccc'
                            }}
                        />
                        <span className="text-xs">{shade}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <h4 className="font-medium mb-2">Color seleccionado:</h4>
                <div
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        backgroundColor: `var(--color-primary-${themeColorShade})`,
                        border: '2px solid #ccc'
                    }}
                />
                <p className="mt-2 text-sm">
                    CSS var: --color-primary-{themeColorShade}
                </p>
            </div>

            <div className="mt-4">
                <h4 className="font-medium mb-2">Test con texto:</h4>
                <p
                    style={{
                        color: `var(--color-primary-${themeColorShade})`,
                        fontWeight: 'bold'
                    }}
                >
                    Este texto usa el color del tema
                </p>
            </div>
        </div>
    );
};

export default ThemeColorTest;
