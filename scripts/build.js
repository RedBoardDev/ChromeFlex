#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function formatBytes(bytes) {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getBuildStats() {
	const distDir = join(__dirname, "..", "dist");
	const assetsDir = join(distDir, "assets");
	const stats = {};

	try {
		// Get all files in assets directory
		const assetsFiles = readdirSync(assetsDir);

		// Find files by pattern
		const contentFile = assetsFiles.find(
			(file) =>
				file.startsWith("content.ts-") &&
				file.endsWith(".js") &&
				!file.includes("loader"),
		);
		const backgroundFile = assetsFiles.find(
			(file) => file.startsWith("background.ts-") && file.endsWith(".js"),
		);
		const manifestStat = statSync(join(distDir, "manifest.json"));

		if (contentFile) {
			const contentStat = statSync(join(assetsDir, contentFile));
			stats.content = formatBytes(contentStat.size);
		}

		if (backgroundFile) {
			const backgroundStat = statSync(join(assetsDir, backgroundFile));
			stats.background = formatBytes(backgroundStat.size);
		}

		stats.manifest = formatBytes(manifestStat.size);

		// Calculate total
		const totalSize =
			(contentFile ? statSync(join(assetsDir, contentFile)).size : 0) +
			(backgroundFile ? statSync(join(assetsDir, backgroundFile)).size : 0) +
			manifestStat.size;
		stats.total = formatBytes(totalSize);
	} catch (error) {
		console.warn("Could not get build stats:", error.message);
	}

	return stats;
}

function updateManifestVersion() {
	const packageJsonPath = join(__dirname, "..", "package.json");
	const manifestPath = join(__dirname, "..", "dist", "manifest.json");

	try {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
		const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

		manifest.version = packageJson.version;
		writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

		console.log(`✅ Updated manifest version to ${packageJson.version}`);
	} catch (error) {
		console.warn("Could not update manifest version:", error.message);
	}
}

function main() {
	const startTime = Date.now();

	console.log("🚀 Building ChromeFlex...\n");

	// Type checking
	console.log("📝 Type checking...");
	try {
		execSync("npx tsc --noEmit", { stdio: "inherit" });
		console.log("✅ Type checking passed\n");
	} catch (error) {
		console.error("❌ Type checking failed");
		process.exit(1);
	}

	// Linting
	console.log("🔍 Linting...");
	try {
		execSync("npm run biome:check", { stdio: "inherit" });
		console.log("✅ Linting passed\n");
	} catch (error) {
		console.error("❌ Linting failed");
		process.exit(1);
	}

	// Building
	console.log("🔨 Building...");
	try {
		execSync("npx vite build", { stdio: "inherit" });
		console.log("✅ Build completed\n");
	} catch (error) {
		console.error("❌ Build failed");
		process.exit(1);
	}

	// Update manifest version
	updateManifestVersion();

	// Get build stats
	const stats = getBuildStats();
	const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);

	console.log("\n📊 Build Stats:");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	if (stats.content) {
		console.log(`📄 Content Script: ${stats.content}`);
	}
	if (stats.background) {
		console.log(`⚙️  Background Script: ${stats.background}`);
	}
	if (stats.manifest) {
		console.log(`📋 Manifest: ${stats.manifest}`);
	}
	if (stats.total) {
		console.log(`📦 Total Size: ${stats.total}`);
	}
	console.log(`⏱️  Build Time: ${buildTime}s`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	console.log("\n🎉 Build successful!");
	console.log("📁 Output directory: dist/");
	console.log("\n📋 Next steps:");
	console.log("1. Open Chrome and go to chrome://extensions/");
	console.log('2. Enable "Developer mode"');
	console.log('3. Click "Load unpacked" and select the dist/ folder');
}

main();
