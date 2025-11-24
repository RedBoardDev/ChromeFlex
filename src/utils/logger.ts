import type { Logger } from "@/types";
import { LogLevel } from "@/types";

export { LogLevel } from "@/types";

export class ChromeFlexLogger implements Logger {
	protected readonly prefix: string = "[ChromeFlex]";

	constructor(private readonly level: LogLevel = LogLevel.WARN) {}

	private log(
		level: LogLevel,
		levelName: string,
		message: string,
		...args: unknown[]
	): void {
		if (level >= this.level) {
			const timestamp = new Date().toISOString();
			const formattedMessage = `${this.prefix} [${timestamp}] [${levelName}] ${message}`;

			switch (level) {
				case LogLevel.DEBUG:
					console.debug(formattedMessage, ...args);
					break;
				case LogLevel.INFO:
					console.info(formattedMessage, ...args);
					break;
				case LogLevel.WARN:
					console.warn(formattedMessage, ...args);
					break;
				case LogLevel.ERROR:
					console.error(formattedMessage, ...args);
					break;
			}
		}
	}

	debug(message: string, ...args: unknown[]): void {
		this.log(LogLevel.DEBUG, "DEBUG", message, ...args);
	}

	info(message: string, ...args: unknown[]): void {
		this.log(LogLevel.INFO, "INFO", message, ...args);
	}

	warn(message: string, ...args: unknown[]): void {
		this.log(LogLevel.WARN, "WARN", message, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		this.log(LogLevel.ERROR, "ERROR", message, ...args);
	}

	// Utility methods
	setLevel(level: LogLevel): void {
		// Use Object.defineProperty to modify the readonly property
		Object.defineProperty(this, "level", { value: level, writable: false });
	}

	getLevel(): LogLevel {
		return this.level;
	}
}

// Singleton instance
export const logger = new ChromeFlexLogger();

// Factory function for feature-specific loggers
export function createFeatureLogger(
	featureName: string,
	level?: LogLevel,
): Logger {
	class FeatureLogger extends ChromeFlexLogger {
		protected readonly prefix: string = `[ChromeFlex:${featureName}]`;
	}
	return new FeatureLogger(level);
}
