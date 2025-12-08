import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outdir: 'dist',
    format: 'esm',
    sourcemap: true,
    packages: 'bundle', // Force bundle all packages
    banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    },
    external: [
        // Keep these truly external
        '@supabase/supabase-js',
        'jose',
        'zod',
        'happy-dom',
    ],
    logLevel: 'info',
});

console.log('Build completed');
