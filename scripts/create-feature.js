#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createFeature(featureName) {
	if (!featureName) {
		console.error("❌ Feature name is required");
		console.log("Usage: npm run create-feature <feature-name>");
		process.exit(1);
	}

	// Validate feature name
	if (!/^[a-z][a-z0-9-]*$/.test(featureName)) {
		console.error(
			"❌ Feature name must be lowercase and contain only letters, numbers, and hyphens",
		);
		process.exit(1);
	}

	const featureDir = join(__dirname, "..", "src", "features", featureName);

	// Check if feature already exists
	if (existsSync(featureDir)) {
		console.error(`❌ Feature "${featureName}" already exists`);
		process.exit(1);
	}

	// Create feature directory
	mkdirSync(featureDir, { recursive: true });

	// Generate class name (PascalCase)
	const className = `${featureName
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("")}Feature`;

	// Create feature template
	const featureTemplate = `import { BaseFeature } from "@/core/base-feature";
import type { FeatureConfigInput, FeatureContext } from "@/types";

export default class ${className} extends BaseFeature {
	constructor() {
		const config: FeatureConfigInput = {
			name: "${featureName}",
			matches: ["https://example.com/*"], // Update with your target URLs
			priority: 10,
			enabled: true,
			shouldActivate: (context: FeatureContext) => {
				// Custom activation logic here
				return true;
			},
			errorRecovery: {
				maxRetries: 3,
				retryDelay: 1000,
				fallbackMode: true,
			},
			settings: {
				// Add feature-specific settings here
			},
		};

		super(config);
	}

	protected async onInit(context: FeatureContext): Promise<void> {
		this.logger.info("Initializing ${featureName} feature");
		// Initialize your feature here
	}

	protected async onStart(context: FeatureContext): Promise<void> {
		this.logger.info("Starting ${featureName} feature");
		// Main feature logic here
	}

	protected async onStop(): Promise<void> {
		this.logger.info("Stopping ${featureName} feature");
		// Cleanup here
	}

	protected async onDestroy(): Promise<void> {
		this.logger.info("Destroying ${featureName} feature");
		// Final cleanup here
	}
}
`;

	// Write feature file
	writeFileSync(join(featureDir, "index.ts"), featureTemplate);

	// Update feature manager to include the new feature
	const featureManagerPath = join(
		__dirname,
		"..",
		"src",
		"core",
		"feature-manager.ts",
	);
	const featureManagerContent = readFileSync(featureManagerPath, "utf-8");

	// Find the discoverFeatures method and add the new feature
	const featuresArrayRegex =
		/(private async discoverFeatures.*?return \[)(.*?)(\];)/s;
	const match = featureManagerContent.match(featuresArrayRegex);

	if (match) {
		const existingFeatures = match[2];
		const newFeatureEntry = `			{ name: "${featureName}", path: "@/features/${featureName}" },`;

		// Check if feature is already in the list
		if (!existingFeatures.includes(featureName)) {
			const updatedContent = featureManagerContent.replace(
				featuresArrayRegex,
				`$1$2${newFeatureEntry}\n$3`,
			);

			writeFileSync(featureManagerPath, updatedContent);
			console.log("✅ Updated feature manager with new feature");
		}
	} else {
		console.warn(
			"⚠️  Could not automatically update feature manager. Please add manually:",
		);
		console.log(
			`{ name: "${featureName}", path: "@/features/${featureName}" }`,
		);
	}

	console.log(`\n🎉 Feature "${featureName}" created successfully!`);
	console.log(`📁 Location: src/features/${featureName}/`);
	console.log(`📝 Class name: ${className}`);
	console.log(`\n🔧 Edit your feature: src/features/${featureName}/index.ts`);
}

// Get feature name from command line arguments
const featureName = process.argv[2];
createFeature(featureName);
