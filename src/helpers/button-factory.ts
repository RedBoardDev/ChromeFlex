/**
 * Button Factory Helper
 * Utilities for creating GitHub-style buttons
 */

export interface ButtonOptions {
	/**
	 * Button text content
	 */
	text: string;
	/**
	 * CSS classes to apply
	 */
	className?: string;
	/**
	 * Custom attributes to set
	 */
	attributes?: Record<string, string>;
	/**
	 * Click handler
	 */
	onClick?: (event: MouseEvent) => void;
}

/**
 * Creates a GitHub-style button element
 */
export function createGitHubButton(options: ButtonOptions): HTMLButtonElement {
	const {
		text,
		className = "btn-link px-2",
		attributes = {},
		onClick
	} = options;

	const button = document.createElement("button");
	button.type = "button";
	button.className = className;
	button.textContent = text;

	// Set custom attributes
	Object.entries(attributes).forEach(([key, value]) => {
		button.setAttribute(key, value);
	});

	// Add click handler
	if (onClick) {
		button.addEventListener("click", (event) => {
			event.preventDefault();
			onClick(event);
		});
	}

	return button;
}