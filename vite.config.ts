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
        chunkSizeWarningLimit: 3000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // Separate chart libraries to avoid module resolution conflicts
                        if (id.includes('apexcharts') || id.includes('react-apexcharts')) {
                            return 'vendor-charts';
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
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.ts',
    },
});