import * as esbuild from "esbuild";

await esbuild.build({
    entryPoints: ["src/server.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: "dist/server.js",
    format: "esm",
    sourcemap: true,
    packages: "bundle",
    banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
    external: [
        //'happy-dom'
    ],
    logLevel: "info",
});

console.log("Build completed");
