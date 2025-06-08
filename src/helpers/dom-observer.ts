/**
 * DOM Observer Helper
 * Provides utilities for observing DOM changes and waiting for elements to appear
 */

export interface ElementObserverOptions {
	/**
	 * Selector to watch for
	 */
	selector: string;
	/**
	 * Maximum time to wait (in ms)
	 */
	timeout?: number;
	/**
	 * Root element to observe (defaults to document.body)
	 */
	root?: Element;
	/**
	 * Whether to observe subtree changes
	 */
	subtree?: boolean;
}

export interface ElementObserverCallbacks {
	/**
	 * Called when element is found
	 */
	onFound: (element: Element) => void;
	/**
	 * Called when timeout is reached
	 */
	onTimeout?: () => void;
}

/**
 * Creates a MutationObserver that watches for specific elements to appear in the DOM
 */
export class ElementObserver {
	private observer: MutationObserver | null = null;
	private timeoutId: number | null = null;

	/**
	 * Start observing for an element to appear
	 */
	observe(
		options: ElementObserverOptions,
		callbacks: ElementObserverCallbacks,
	): void {
		const {
			selector,
			timeout = 15000,
			root = document.body,
			subtree = true,
		} = options;

		// Check if element already exists
		const existingElement = document.querySelector(selector);
		if (existingElement) {
			callbacks.onFound(existingElement);
			return;
		}

		// Create observer
		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "childList") {
					for (const addedNode of mutation.addedNodes) {
						if (addedNode.nodeType === Node.ELEMENT_NODE) {
							const element = addedNode as Element;

							// Check if it matches our selector
							const targetElement = element.matches?.(selector)
								? element
								: element.querySelector?.(selector);

							if (targetElement) {
								this.disconnect();
								callbacks.onFound(targetElement);
								return;
							}
						}
					}
				}
			}
		});

		// Start observing
		this.observer.observe(root, {
			childList: true,
			subtree,
		});

		// Set timeout
		if (timeout > 0) {
			this.timeoutId = window.setTimeout(() => {
				this.disconnect();
				callbacks.onTimeout?.();
			}, timeout);
		}
	}

	/**
	 * Stop observing and cleanup
	 */
	disconnect(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}
}

/**
 * Simple utility to wait for an element to appear
 */
export function waitForElement(
	selector: string,
	timeout = 5000,
	root = document.body,
): Promise<Element | null> {
	return new Promise((resolve) => {
		const observer = new ElementObserver();

		observer.observe(
			{ selector, timeout, root },
			{
				onFound: (element) => resolve(element),
				onTimeout: () => resolve(null),
			},
		);
	});
}
