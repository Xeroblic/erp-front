import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';
import path from "path";

const VENDOR_LIBRARIES = ['react-select', 'react-router-dom', 'framer-motion', 'react-toastify'];
const REDUX_LIBRARIES = ['@reduxjs', 'redux'];
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
        chunkSizeWarningLimit: 1800,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.match(/[\\/]node_modules[\\/]react[\\/]/) ||
                            id.match(/[\\/]node_modules[\\/]react-dom[\\/]/)) {
                            return 'react-core';
                        }

                        if (id.includes('apexcharts') || id.includes('react-apexcharts')) return 'charts-libs';
                        if (id.includes('@react-pdf') || id.includes('pdfmake')) return 'pdf-libs';
                        if (id.includes('xlsx') || id.includes('exceljs')) return 'excel-libs';

                        if (REDUX_LIBRARIES.some(lib => id.includes(lib))) {
                            return 'vendor-redux';
                        }

                        if (VENDOR_LIBRARIES.some(lib => id.includes(lib))) {
                            return 'vendor-common';
                        }

                        return 'vendor-residual';
                    }

                    if (id.includes('/src/components/ui/') ||
                        id.includes('/src/hooks/') ||
                        id.includes('/src/utils/')) {
                        return 'zentria-core-internal';
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
             '/storage': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
});