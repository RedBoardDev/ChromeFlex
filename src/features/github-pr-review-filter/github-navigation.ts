/**
 * GitHub Navigation Helper
 * Utilities for SPA navigation within GitHub
 */

export interface NavigationOptions {
	/**
	 * URL to navigate to
	 */
	url: string;
	/**
	 * Whether to use Turbo navigation (faster)
	 */
	preferTurbo?: boolean;
	/**
	 * Fallback to full page reload if SPA navigation fails
	 */
	allowFallback?: boolean;
}

/**
 * Navigates to a URL using GitHub's SPA navigation system
 */
export function navigateToUrl(options: NavigationOptions): void {
	const { url, preferTurbo = true, allowFallback = true } = options;

	// Approach 1: Use Turbo.visit if available
	if (preferTurbo && typeof (window as any).Turbo !== 'undefined' && (window as any).Turbo.visit) {
		try {
			(window as any).Turbo.visit(url);
			return;
		} catch (error) {
			console.debug("Turbo.visit failed:", error);
		}
	}

	// Approach 2: Simulate a link click (like GitHub's native filters)
	try {
		const hiddenLink = document.createElement('a');
		hiddenLink.href = url;
		hiddenLink.style.display = 'none';
		hiddenLink.setAttribute('data-turbo-frame', 'repo-content-turbo-frame');
		document.body.appendChild(hiddenLink);
		hiddenLink.click();
		hiddenLink.remove();
		return;
	} catch (error) {
		console.debug("Link simulation failed:", error);
	}

	// Approach 3: History API + Turbo events
	try {
		history.pushState(null, "", url);

		// Trigger turbo:visit event
		const turboEvent = new CustomEvent("turbo:visit", {
			detail: { url, action: "advance" }
		});
		document.dispatchEvent(turboEvent);

		// Fallback: trigger popstate to force update
		setTimeout(() => {
			window.dispatchEvent(new PopStateEvent("popstate"));
		}, 100);
		return;
	} catch (error) {
		console.debug("Turbo navigation failed:", error);
	}

	// Fallback: Full page reload
	if (allowFallback) {
		window.location.href = url;
	}
}

/**
 * Sets up navigation listeners for SPA navigation detection
 */
export function setupNavigationListener(callback: (url: string) => void): () => void {
	const originalPushState = history.pushState;
	const originalReplaceState = history.replaceState;

	const handleNavigation = () => {
		setTimeout(() => {
			callback(location.href);
		}, 200); // Short delay to let GitHub update the DOM
	};

	// Override history methods
	history.pushState = function (state, title, url) {
		originalPushState.apply(this, [state, title, url]);
		handleNavigation();
	};

	history.replaceState = function (state, title, url) {
		originalReplaceState.apply(this, [state, title, url]);
		handleNavigation();
	};

	// Listen to popstate events
	window.addEventListener("popstate", handleNavigation);

	// Return cleanup function
	return () => {
		history.pushState = originalPushState;
		history.replaceState = originalReplaceState;
		window.removeEventListener("popstate", handleNavigation);
	};
}