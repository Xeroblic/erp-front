import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import EnvironmentPlugin from 'vite-plugin-environment';
import path from 'path';
import { readFileSync } from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';

const { version: appVersion } = JSON.parse(
	readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8'),
) as { version: string };

// https://vitejs.dev/config/
export default defineConfig({
	define: {
		// Versión del front que muestra el footer; sale de package.json en cada build.
		__APP_VERSION__: JSON.stringify(appVersion),
	},
	plugins: [
		react(),
		tailwindcss(),
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
	css: {
		// Tailwind corre como plugin de Vite y no hay PostCSS propio. Declararlo vacío evita
		// que Vite herede un `postcss.config.*` de una carpeta superior, como el checkout
		// principal cuando se trabaja en un worktree de `.claude/worktrees`.
		postcss: {},
	},
	resolve: {
		alias: {
			'@': path.join(import.meta.dirname, 'src'),
		},
	},
	build: {
		chunkSizeWarningLimit: 1000,
		rolldownOptions: {
			output: {
				// Rolldown reemplaza `manualChunks` por grupos. Un solo grupo cuyo nombre sale
				// de esta función conserva las reglas y su orden; `null` deja el módulo al
				// reparto automático.
				codeSplitting: {
					groups: [
						{
							name(id) {
								if (id.includes('node_modules')) {
									if (
										/node_modules[\/](react|react-dom|scheduler)([\/]|$)/.test(
											id,
										) ||
										id.includes('react/jsx-runtime') ||
										id.includes('react/jsx-dev-runtime')
									) {
										// Keep React in the main vendor chunk to avoid cross-chunk init cycles in production.
										return 'vendor';
									}

									// Separate chart libraries to avoid inflating the main vendor chunk
									if (
										id.includes('apexcharts') ||
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

									// Aísla el generador de PDFs (3.1 MB)
									if (
										id.includes('node_modules/pdfmake') ||
										id.includes('node_modules/@react-pdf')
									) {
										return 'vendor-pdf';
									}

									// Aísla el escáner de códigos QR/Barras (1.07 MB)
									if (id.includes('node_modules/html5-qrcode')) {
										return 'vendor-scanner';
									}

									// Editor de texto enriquecido (TipTap + ProseMirror)
									if (id.includes('@tiptap') || id.includes('prosemirror')) {
										return 'vendor-editor';
									}

									// Utilidades de fecha
									if (id.includes('date-fns')) {
										return 'vendor-datefns';
									}

									// Excel/spreadsheet
									if (
										id.includes('node_modules/xlsx') ||
										id.includes('exceljs')
									) {
										return 'vendor-excel';
									}

									// Estado global y queries
									if (
										id.includes('@tanstack/react-query') ||
										id.includes('@tanstack/react-table') ||
										id.includes('@reduxjs/toolkit') ||
										id.includes('react-redux')
									) {
										return 'vendor-state';
									}

									// Animaciones
									if (id.includes('gsap')) {
										return 'vendor-gsap';
									}

									// Utilidades pesadas variadas
									if (id.includes('crypto-js') || id.includes('jsbarcode')) {
										return 'vendor-misc';
									}

									// Group other node_modules into vendor chunk
									return 'vendor';
								}

								if (id.includes('/src/components/ui/')) {
									return 'zentria-ui';
								}

								if (id.includes('/src/hooks/') || id.includes('/src/utils/')) {
									return 'zentria-core-internal';
								}

								return null;
							},
						},
					],
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
		include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
	},
});
