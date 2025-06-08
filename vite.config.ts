import { resolve } from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig, loadEnv } from "vite";
import manifest from "./src/manifest.json";

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), "");

	return {
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
		define: {
			// Inject environment variables for Chrome extension
			__ENV_MISTRAL_API_KEY__: JSON.stringify(env.MISTRAL_API_KEY || ""),
			__ENV_NODE_ENV__: JSON.stringify(env.NODE_ENV || "development"),
		},
	};
});
