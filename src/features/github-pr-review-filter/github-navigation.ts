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
 * Navigate to a URL using GitHub's SPA navigation
 */
export function navigateToUrl(options: NavigationOptions): void {
	const { url, preferTurbo = true, allowFallback = true } = options;

	// Try Turbo navigation first (fastest)
	if (preferTurbo && tryTurboNavigation(url)) {
		return;
	}

	// Try link simulation (reliable)
	if (tryLinkSimulation(url)) {
		return;
	}

	// Fallback to full page reload
	if (allowFallback) {
		window.location.href = url;
	}
}

/**
 * Try Turbo.visit navigation
 */
function tryTurboNavigation(url: string): boolean {
	try {
		// Check if Turbo is available
		const turbo = (
			window as unknown as { Turbo?: { visit: (url: string) => void } }
		).Turbo;
		if (turbo?.visit) {
			turbo.visit(url);
			return true;
		}
		return false;
	} catch (error) {
		return false;
	}
}

/**
 * Try link click simulation
 */
function tryLinkSimulation(url: string): boolean {
	try {
		const link = document.createElement("a");
		link.href = url;
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Sets up navigation listeners for SPA navigation detection
 */
export function setupNavigationListener(
	callback: (url: string) => void,
): () => void {
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
