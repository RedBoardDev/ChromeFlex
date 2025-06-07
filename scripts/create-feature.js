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

	// Create feature template with improved types and error handling
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
				// Return true if this feature should run on the current page
				return true;
			},
			errorRecovery: {
				maxRetries: 3,
				retryDelay: 1000,
				fallbackMode: true,
			},
			settings: {
				// Add any feature-specific settings here
				// Example: theme: 'dark', enableAnimations: true
			},
		};

		super(config);
	}

	protected async onInit(context: FeatureContext): Promise<void> {
		this.logger.info("Initializing ${featureName} feature");

		// Initialize your feature here
		// - Subscribe to events using this.onEvent()
		// - Setup data structures
		// - Prepare resources

		// Example: Listen to events
		// this.onEvent("some-event", (event) => {
		//   this.logger.debug("Received event:", event.payload);
		// });
	}

	protected async onStart(context: FeatureContext): Promise<void> {
		this.logger.info("Starting ${featureName} feature");

		// Main feature logic here
		// - Add DOM elements using this.addElement()
		// - Start listeners
		// - Begin active functionality

		// Example: Add a button
		// const button = document.createElement("button");
		// button.textContent = "My Feature Button";
		// button.onclick = () => this.handleButtonClick();
		// document.body.appendChild(button);
		// this.addElement("main-button", button);

		// Example: Add cleanup task
		// this.addCleanupTask(() => {
		//   console.log("Custom cleanup for ${featureName}");
		// });
	}

	protected async onStop(): Promise<void> {
		this.logger.info("Stopping ${featureName} feature");

		// Cleanup here
		// - Remove DOM elements (automatic if using this.addElement())
		// - Clear intervals/timeouts (automatic if using this.setTimeout/setInterval)
		// - Stop listeners
		// - Pause functionality

		// Note: DOM elements and timers are automatically cleaned up
		// Custom cleanup tasks are also automatically executed
	}

	protected async onDestroy(): Promise<void> {
		this.logger.info("Destroying ${featureName} feature");

		// Final cleanup here
		// - Reset internal state
		// - Release any remaining resources
		// - Cleanup is mostly automatic via BaseFeature

		this.emitEvent("${featureName}:destroyed", {
			timestamp: Date.now(),
		});
	}

	// Example private methods

	// private handleButtonClick(): void {
	//   try {
	//     this.logger.info("Button clicked!");
	//
	//     this.emitEvent("${featureName}:button-clicked", {
	//       timestamp: Date.now(),
	//       url: window.location.href,
	//     });
	//   } catch (error) {
	//     this.logger.error("Error in button click:", error);
	//     throw error; // Let the error boundary handle it
	//   }
	// }

	// private setupEventListeners(): void {
	//   this.onEvent("some-external-event", (event) => {
	//     this.logger.debug("Received external event:", event.payload);
	//   });
	// }
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
	console.log("\n📋 Next steps:");
	console.log("1. Update the matches array with your target URLs");
	console.log("2. Implement your feature logic in the lifecycle methods");
	console.log("3. Use this.addElement() for DOM elements (auto-cleanup)");
	console.log("4. Use this.onEvent() for event listeners (auto-cleanup)");
	console.log("5. Use this.addCleanupTask() for custom cleanup");
	console.log("6. Test your feature with: npm run dev");
	console.log(`\n🔧 Edit your feature: src/features/${featureName}/index.ts`);
	console.log("\n💡 Tips:");
	console.log("- Errors are automatically isolated and handled");
	console.log("- Features can retry automatically on failure");
	console.log("- Use this.logger for consistent logging");
	console.log("- Emit events with this.emitEvent() for communication");
}

// Get feature name from command line args
const featureName = process.argv[2];
createFeature(featureName);
