import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), EnvironmentPlugin('all', { prefix: 'VITE_' })],
    assetsInclude: ['**/*.md'],
    resolve: {
        alias: {
            '@': path.join(__dirname, 'src'),
        },
    },
    build: {
        // Subimos el límite para que la consola esté más limpia,
        // ya que estamos controlando los chunks manualmente.
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // 1. Librerías Pesadas Específicas (PDF y Excel)
                        // Agrupamos todo lo relacionado a PDF y Excel para que no se cargue al inicio
                        if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('@react-pdf') || id.includes('pdfjs')) {
                            return 'pdf-libs';
                        }
                        if (id.includes('xlsx') || id.includes('file-saver')) {
                            return 'excel-libs';
                        }

                        // 2. Gráficos (Suelen ser pesados)
                        if (id.includes('chart.js') || id.includes('recharts') || id.includes('echarts') || id.includes('apexcharts')) {
                            return 'charts-libs';
                        }

                        // 3. Núcleo de React (CRÍTICO)
                        // Esto saca a React del "vendor" general. Como React se usa en todas partes,
                        // conviene tenerlo en su propio archivo cacheable a largo plazo.
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('redux') || id.includes('@reduxjs')) {
                            return 'react-core';
                        }

                        // 4. UI y Estilos
                        // Separamos librerías de componentes visuales grandes
                        if (id.includes('@headlessui') || id.includes('framer-motion') || id.includes('lucide') || id.includes('heroicons') || id.includes('clsx') || id.includes('tailwind')) {
                            return 'ui-libs';
                        }

                        // 5. Vendor Residual
                        // Aquí cae todo lo que no clasificamos arriba (utilidades pequeñas, date-fns, axios, etc.)
                        // Debería pesar mucho menos de 3.5MB ahora.
                        return 'vendor';
                    }
                },
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});