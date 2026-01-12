import { BaseFeature } from "@/core/base-feature";
import type { FeatureConfigInput, FeatureContext } from "@/types";
import { createElement } from "@/utils/dom";
import { GITHUB_PR_REVIEW_COPY_CONFIG as CONFIG } from "./config";

export default class GitHubPRReviewCopyPathFeature extends BaseFeature {
	private observer: MutationObserver | null = null;
	private processedSummaries = new WeakSet<Element>();

	constructor() {
		const featureConfig: FeatureConfigInput = {
			...CONFIG.FEATURE_CONFIG,
			matches: CONFIG.URL_MATCHES,
		};

		super(featureConfig);
	}

	protected async onInit(context: FeatureContext): Promise<void> {
		this.logger.info("Initializing GitHub PR Review Copy Path feature");

		this.observeDom();
		this.scanExistingSummaries();
	}

	protected async onStart(context: FeatureContext): Promise<void> {
		this.logger.info(
			`Starting GitHub PR Review Copy Path feature on ${context.url}`,
		);
		this.scanExistingSummaries();
	}

	protected async onStop(): Promise<void> {
		this.logger.info("Stopping GitHub PR Review Copy Path feature");
		this.disconnectObserver();
	}

	protected async onDestroy(): Promise<void> {
		this.logger.info("Destroying GitHub PR Review Copy Path feature");
		this.disconnectObserver();
		this.processedSummaries = new WeakSet<Element>();
	}

	// ============================================================================
	// Core logic
	// ============================================================================

	private observeDom(): void {
		if (this.observer) return;

		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type !== "childList") continue;

				for (const node of mutation.addedNodes) {
					if (!(node instanceof Element)) continue;

					if (node.matches?.(CONFIG.SELECTORS.REVIEW_THREAD_SUMMARY)) {
						this.tryAttachCopyButton(node);
					}

					const summaries = node.querySelectorAll<Element>(
						CONFIG.SELECTORS.REVIEW_THREAD_SUMMARY,
					);
					for (const summary of summaries) {
						this.tryAttachCopyButton(summary);
					}
				}
			}
		});

		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		this.addCleanupTask(() => this.disconnectObserver());
	}

	private disconnectObserver(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	private scanExistingSummaries(): void {
		const summaries = document.querySelectorAll<Element>(
			CONFIG.SELECTORS.REVIEW_THREAD_SUMMARY,
		);
		for (const summary of summaries) {
			this.tryAttachCopyButton(summary);
		}
	}

	private tryAttachCopyButton(summary: Element): void {
		if (this.processedSummaries.has(summary)) return;

		const container = summary.querySelector<HTMLElement>(
			CONFIG.SELECTORS.CONTAINER,
		);
		const fileLink = summary.querySelector<HTMLAnchorElement>(
			CONFIG.SELECTORS.FILE_LINK,
		);

		if (!container || !fileLink) {
			return;
		}

		if (container.querySelector(".chromeflex-copy-path-btn")) {
			this.processedSummaries.add(summary);
			return;
		}

		const href = fileLink.href?.trim();
		const fallbackText = fileLink.textContent?.trim();
		const target = fallbackText || href;

		if (!target) {
			return;
		}

		this.stripToggleText(container);
		const copyButton = this.buildCopyButton(target);
		const toggle =
			container.querySelector<HTMLElement>(".Details-content--closed") ??
			container.querySelector<HTMLElement>(".Details-content--open");

		if (toggle) {
			container.insertBefore(copyButton, toggle);
		} else {
			container.appendChild(copyButton);
		}
		this.processedSummaries.add(summary);
	}

	private stripToggleText(container: HTMLElement): void {
		const toggles = container.querySelectorAll<HTMLElement>(
			".Details-content--closed, .Details-content--open",
		);

		for (const toggle of toggles) {
			for (const child of Array.from(toggle.childNodes)) {
				if (child.nodeType === Node.TEXT_NODE) {
					toggle.removeChild(child);
				}
			}
		}
	}

	private buildCopyButton(target: string): HTMLButtonElement {
		const button = createElement(
			"button",
			{
				type: "button",
				class: CONFIG.CLASSES.BUTTON,
				"aria-label": CONFIG.STRINGS.COPY_LABEL,
				"data-view-component": "true",
			},
			undefined,
		);

		const copyIcon = this.buildCopyIcon();
		const checkIcon = this.buildCheckIcon();

		button.append(copyIcon, checkIcon);

		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			void this.copyToClipboard(target, button);
		});

		return button;
	}

	private buildCopyIcon(): SVGSVGElement {
		const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		icon.setAttribute("aria-hidden", "true");
		icon.setAttribute("height", "16");
		icon.setAttribute("width", "16");
		icon.setAttribute("viewBox", "0 0 16 16");
		icon.setAttribute("class", CONFIG.CLASSES.ICON);
		icon.setAttribute("role", "img");

		// GitHub copy icon paths (standard octicon copy)
		const path1 = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"path",
		);
		path1.setAttribute(
			"d",
			"M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z",
		);

		const path2 = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"path",
		);
		path2.setAttribute(
			"d",
			"M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z",
		);

		icon.append(path1, path2);
		return icon;
	}

	private buildCheckIcon(): SVGSVGElement {
		const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		icon.setAttribute("aria-hidden", "true");
		icon.setAttribute("height", "16");
		icon.setAttribute("width", "16");
		icon.setAttribute("viewBox", "0 0 16 16");
		icon.setAttribute("class", "octicon octicon-check color-fg-success d-none");
		icon.setAttribute("role", "img");

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute(
			"d",
			"M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z",
		);

		icon.appendChild(path);
		return icon;
	}

	private async copyToClipboard(
		text: string,
		button: HTMLButtonElement,
	): Promise<void> {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				this.legacyCopy(text);
			}

			this.showFeedback(button, true);
		} catch (error) {
			this.logger.warn("Failed to copy path:", error);
			this.showFeedback(button, false);
		}
	}

	private legacyCopy(text: string): void {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.style.position = "fixed";
		textarea.style.left = "-9999px";
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand("copy");
		document.body.removeChild(textarea);
	}

	private showFeedback(button: HTMLButtonElement, success: boolean): void {
		const copyIcon = button.querySelector<SVGSVGElement>(".octicon-copy");
		const checkIcon = button.querySelector<SVGSVGElement>(".octicon-check");

		button.setAttribute(
			"aria-label",
			success ? CONFIG.STRINGS.COPIED_LABEL : CONFIG.STRINGS.COPY_FAILED_LABEL,
		);

		if (success) {
			copyIcon?.classList.add("d-none");
			checkIcon?.classList.remove("d-none");
		} else {
			copyIcon?.classList.remove("d-none");
			checkIcon?.classList.add("d-none");
		}

		const resetTimer = window.setTimeout(() => {
			button.setAttribute("aria-label", CONFIG.STRINGS.COPY_LABEL);
			copyIcon?.classList.remove("d-none");
			checkIcon?.classList.add("d-none");
		}, 1800);

		this.timers.add(resetTimer);
	}
}
