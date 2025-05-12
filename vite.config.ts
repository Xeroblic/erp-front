import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import EnvironmentPlugin from 'vite-plugin-environment';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), EnvironmentPlugin('all', {prefix: 'VITE_'})],
	assetsInclude: ['**/*.md'],
	resolve: {
		alias: {
		  '@': path.join(__dirname, 'src'),
		},
	},
});
