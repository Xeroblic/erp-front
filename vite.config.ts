import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';
import path from "path";
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        EnvironmentPlugin('all', { prefix: 'VITE_' }),
        visualizer({
            filename: 'stats.html',
            open: false,
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
        }),
    ],
    assetsInclude: ['**/*.md'],
    resolve: {
        alias: {
            '@': path.join(__dirname, 'src'),
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (
                            /node_modules[\\/](react|react-dom|scheduler)([\\/]|$)/.test(id) ||
                            id.includes('react/jsx-runtime') ||
                            id.includes('react/jsx-dev-runtime')
                        ) {
                            return 'vendor-react';
                        }

                        // Separate chart libraries to avoid inflating the main vendor chunk
                        if (
                            id.includes('apexcharts') ||
                            id.includes('react-apexcharts') ||
                            id.includes('recharts') ||
                            /node_modules[\\/]d3([\\/]|$)/.test(id)
                        ) {
                            return 'vendor-charts';
                        }

                        // UI primitives, animation and icon libraries
                        if (
                            id.includes('@radix-ui') ||
                            id.includes('framer-motion') ||
                            id.includes('lucide-react') ||
                            id.includes('react-icons') ||
                            id.includes('react-select') ||
                            id.includes('react-toastify') ||
                            id.includes('react-popper') ||
                            id.includes('swiper')
                        ) {
                            return 'vendor-ui';
                        }

                        // Group other node_modules into vendor chunk
                        return 'vendor';
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
    // test: {
    //     environment: 'jsdom',
    //     globals: true,
    //     setupFiles: './src/setupTests.ts',
    // },
});