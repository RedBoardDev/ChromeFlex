/**
 * Page Observer for GitHub PR Title Formatter
 */

import { GITHUB_PR_TITLE_FORMATTER_CONFIG } from "./config";

/**
 * Observe les changements de navigation sur GitHub
 */
export class PageObserver {
	private observer: MutationObserver | null = null;
	private currentUrl = "";
	private onUrlChange: (url: string) => void;

	constructor(onUrlChange: (url: string) => void) {
		this.onUrlChange = onUrlChange;
		this.currentUrl = window.location.href;
	}

	/**
	 * Démarre l'observation des changements de page
	 */
	start(): void {
		// Observe les changements dans le DOM (navigation GitHub via SPA)
		this.observer = new MutationObserver(() => {
			this.checkUrlChange();
		});

		// Observe les changements dans le body
		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		// Écoute aussi les événements de navigation
		window.addEventListener("popstate", () => {
			this.checkUrlChange();
		});

		// Vérifie l'URL initiale
		setTimeout(() => {
			this.checkUrlChange();
		}, GITHUB_PR_TITLE_FORMATTER_CONFIG.TIMING.PAGE_LOAD_DELAY);
	}

	/**
	 * Arrête l'observation
	 */
	stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	/**
	 * Vérifie si l'URL a changé
	 */
	private checkUrlChange(): void {
		const newUrl = window.location.href;
		if (newUrl !== this.currentUrl) {
			this.currentUrl = newUrl;
			// Délai pour laisser le temps au DOM de se mettre à jour
			setTimeout(() => {
				this.onUrlChange(newUrl);
			}, GITHUB_PR_TITLE_FORMATTER_CONFIG.TIMING.OBSERVER_DEBOUNCE);
		}
	}
}

/**
 * Débounce une fonction
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;

	return (...args: Parameters<T>): void => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}
