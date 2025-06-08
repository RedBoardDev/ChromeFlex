/**
 * Environment Configuration
 * Centralized environment variables configuration
 */

import { z } from "zod";

// Declare Vite injected environment variables
declare const __ENV_MISTRAL_API_KEY__: string;
declare const __ENV_NODE_ENV__: string;

/**
 * Environment Variables Schema
 * Strict validation using Zod for all environment variables
 */
const EnvSchema = z.object({
	MISTRAL_API_KEY: z.string().min(1, "Mistral API key is required"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
});

/**
 * Parse and validate environment variables
 */
function parseEnv() {
	const env = {
		MISTRAL_API_KEY: __ENV_MISTRAL_API_KEY__,
		NODE_ENV: __ENV_NODE_ENV__ as "development" | "production" | "test",
	};

	const result = EnvSchema.safeParse(env);

	if (!result.success) {
		const errors = result.error.errors.map(
			(err) => `${err.path.join(".")}: ${err.message}`,
		);

		// In development, warn but don't throw
		if (__ENV_NODE_ENV__ === "development") {
			console.warn("Environment validation warnings:", errors);
			return {
				MISTRAL_API_KEY: env.MISTRAL_API_KEY || "",
				NODE_ENV: env.NODE_ENV || "development",
			} as const;
		}

		throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
	}

	return result.data;
}

/**
 * Validated environment configuration
 */
export const ENV_CONFIG = parseEnv();

/**
 * Type-safe environment variables
 */
export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Check if we're in development mode
 */
export const IS_DEVELOPMENT = ENV_CONFIG.NODE_ENV === "development";

/**
 * Check if we're in production mode
 */
export const IS_PRODUCTION = ENV_CONFIG.NODE_ENV === "production";

/**
 * Validate that required environment variables are set
 */
export function validateEnvironmentConfig(): {
	valid: boolean;
	missing: string[];
} {
	const missing: string[] = [];

	if (!ENV_CONFIG.MISTRAL_API_KEY) {
		missing.push("MISTRAL_API_KEY");
	}

	return {
		valid: missing.length === 0,
		missing,
	};
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(
	key: keyof typeof ENV_CONFIG,
	fallback?: string,
): string | undefined {
	const value = ENV_CONFIG[key];
	return typeof value === "string" ? value : fallback;
}
