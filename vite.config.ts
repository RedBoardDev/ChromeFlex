import { resolve } from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import manifest from "./src/manifest.json";

export default defineConfig({
	plugins: [crx({ manifest })],
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			"@/core": resolve(__dirname, "src/core"),
			"@/features": resolve(__dirname, "src/features"),
			"@/utils": resolve(__dirname, "src/utils"),
			"@/types": resolve(__dirname, "src/types"),
		},
	},
	server: {
		port: 5173,
		hmr: {
			port: 5174,
		},
	},
});
