import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
    plugins: [solidPlugin()],
    resolve: {
        alias: {
            '@skrivstudio/shared': path.resolve(__dirname, '../shared/src/index.ts'),
        },
    },
    server: {
        port: 3004,
        proxy: {
            '/api': {
                target: 'http://localhost:4001',
                changeOrigin: true,
                configure: (proxy) => {
                    proxy.on('error', () => {});
                },
            },
        },
    },
});
