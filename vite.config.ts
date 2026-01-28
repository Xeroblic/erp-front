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
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('apexcharts') || id.includes('react-apexcharts')) return 'vendor-charts';
                        if (id.includes('@react-pdf')) return 'vendor-pdf';
                        if (id.includes('xlsx') || id.includes('exceljs')) return 'vendor-excel';
                        if (id.includes('gsap')) return 'vendor-gsap';
                        if (id.includes('framer-motion')) return 'vendor-motion';
                        if (id.includes('tiptap') || id.includes('slate')) return 'vendor-editor';
                        if (id.includes('@fullcalendar')) return 'vendor-calendar';
                        if (id.includes('pdfmake')) return 'vendor-pdfmake';
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
                        if (id.includes('@reduxjs') || id.includes('redux')) return 'vendor-redux';
                        if (id.includes('@tanstack')) return 'vendor-tanstack';
                        return 'vendor-misc';
                    }

                    if (id.includes('/src/components/ui/')) {
                        return 'zentria-ui';
                    }

                    if (id.includes('/src/hooks/') ||
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