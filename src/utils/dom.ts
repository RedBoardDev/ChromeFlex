import type { DOMUtilOptions, Selector } from "@/types";

export interface ElementAttributes {
	readonly [key: string]: string | number | boolean;
}

export interface WaitForElementOptions extends DOMUtilOptions {
	readonly checkInterval?: number;
}

// Create element with attributes and content
export function createElement<T extends keyof HTMLElementTagNameMap>(
	tag: T,
	attributes: ElementAttributes = {},
	content?: string | Node | readonly Node[],
): HTMLElementTagNameMap[T] {
	const element = document.createElement(tag);

	// Set attributes
	for (const [key, value] of Object.entries(attributes)) {
		if (typeof value === "boolean") {
			if (value) {
				element.setAttribute(key, "");
			}
		} else {
			element.setAttribute(key, String(value));
		}
	}

	// Set content
	if (content !== undefined) {
		if (typeof content === "string") {
			element.textContent = content;
		} else if (content instanceof Node) {
			element.appendChild(content);
		} else {
			for (const node of content) {
				element.appendChild(node);
			}
		}
	}

	return element;
}

// Enhanced element selector with retries and timeout
export async function waitForElement<T extends Element = Element>(
	selector: Selector,
	options: WaitForElementOptions = {},
): Promise<T | null> {
	const {
		timeout = 5000,
		retries = 10,
		checkInterval = timeout / retries,
	} = options;

	return new Promise((resolve) => {
		const startTime = Date.now();
		let attempts = 0;

		const check = (): void => {
			attempts++;
			const element = document.querySelector<T>(selector);

			if (element) {
				resolve(element);
				return;
			}

			const elapsed = Date.now() - startTime;
			if (elapsed >= timeout || attempts >= retries) {
				resolve(null);
				return;
			}

			setTimeout(check, checkInterval);
		};

		check();
	});
}

// Get element with error handling
export function getElement<T extends Element = Element>(
	selector: Selector,
	required = false,
): T | null {
	const element = document.querySelector<T>(selector);

	if (required && !element) {
		throw new Error(`Required element not found: ${selector}`);
	}

	return element;
}

// Get all elements matching selector
export function getAllElements<T extends Element = Element>(
	selector: Selector,
): readonly T[] {
	return Array.from(document.querySelectorAll<T>(selector));
}

// Add button with enhanced functionality
export function addButton(
	targetSelector: Selector,
	text: string,
	onClick: () => void,
	attributes: ElementAttributes = {},
): HTMLButtonElement | null {
	const target = getElement(targetSelector);
	if (!target) {
		console.warn(`Target element not found: ${targetSelector}`);
		return null;
	}

	const button = createElement(
		"button",
		{
			type: "button",
			...attributes,
		},
		text,
	);

	button.addEventListener("click", onClick);
	target.appendChild(button);

	return button;
}

// Insert element at specific position
export function insertElement(
	element: Element,
	targetSelector: Selector,
	position: "before" | "after" | "prepend" | "append" = "append",
): boolean {
	const target = getElement(targetSelector);
	if (!target) {
		return false;
	}

	switch (position) {
		case "before":
			target.parentNode?.insertBefore(element, target);
			break;
		case "after":
			target.parentNode?.insertBefore(element, target.nextSibling);
			break;
		case "prepend":
			target.prepend(element);
			break;
		case "append":
			target.appendChild(element);
			break;
	}

	return true;
}

// Style utilities
export function setStyles(
	element: Element,
	styles: Record<string, string>,
): boolean {
	if (!(element instanceof HTMLElement)) {
		return false;
	}

	for (const [property, value] of Object.entries(styles)) {
		element.style.setProperty(property, value);
	}

	return true;
}

// Class utilities
export function toggleClass(
	element: Element,
	className: string,
	force?: boolean,
): boolean {
	return element.classList.toggle(className, force);
}

export function hasClass(element: Element, className: string): boolean {
	return element.classList.contains(className);
}

// Check if element is visible
export function isVisible(element: Element): boolean {
	if (!(element instanceof HTMLElement)) {
		return false;
	}

	const style = window.getComputedStyle(element);
	return (
		style.display !== "none" &&
		style.visibility !== "hidden" &&
		style.opacity !== "0" &&
		element.offsetParent !== null
	);
}

// Get element's position relative to viewport
export function getElementPosition(element: Element): DOMRect {
	return element.getBoundingClientRect();
}

// Check if element is in viewport
export function isInViewport(element: Element, threshold = 0): boolean {
	const rect = getElementPosition(element);
	const windowHeight =
		window.innerHeight || document.documentElement.clientHeight;
	const windowWidth = window.innerWidth || document.documentElement.clientWidth;

	return (
		rect.top >= -threshold &&
		rect.left >= -threshold &&
		rect.bottom <= windowHeight + threshold &&
		rect.right <= windowWidth + threshold
	);
}
