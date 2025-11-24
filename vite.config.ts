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
                        // 1. Núcleo de React (CRÍTICO - debe cargarse primero)
                        // Usar match más preciso para evitar incluir react-router, react-redux, etc.
                        if (id.match(/[\\/]node_modules[\\/]react[\\/]/) || 
                            id.match(/[\\/]node_modules[\\/]react-dom[\\/]/)) {
                            return 'react-core';
                        }

                        // 2. Gráficos (lazy load)
                        if (id.includes('apexcharts') || id.includes('react-apexcharts')) {
                            return 'charts-libs';
                        }

                        // 3. PDF (lazy load)
                        if (id.includes('@react-pdf') || id.includes('pdfmake')) {
                            return 'pdf-libs';
                        }

                        // 4. Excel (lazy load)
                        if (id.includes('xlsx') || id.includes('exceljs')) {
                            return 'excel-libs';
                        }

                        // 5. Todo lo demás va a vendor (incluyendo framer-motion, redux, etc.)
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