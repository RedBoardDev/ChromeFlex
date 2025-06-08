/**
 * Input Manager for GitHub PR Title Formatter
 */

import { GITHUB_PR_TITLE_FORMATTER_CONFIG } from "./config";
import type { TitleFormatterState } from "./types";

/**
 * Trouve l'élément input du titre de PR
 */
export function findTitleInput(): HTMLInputElement | null {
	// Essaie d'abord avec le sélecteur principal
	let input = document.querySelector(
		GITHUB_PR_TITLE_FORMATTER_CONFIG.SELECTORS.TITLE_INPUT,
	) as HTMLInputElement;

	if (!input) {
		// Essaie avec le sélecteur alternatif
		input = document.querySelector(
			GITHUB_PR_TITLE_FORMATTER_CONFIG.SELECTORS.TITLE_INPUT_ALTERNATIVE,
		) as HTMLInputElement;
	}

	return input;
}

/**
 * Met à jour le titre dans l'input
 */
export function updateTitleInput(input: HTMLInputElement, title: string): void {
	if (!input) return;

	// Sauvegarde la valeur actuelle
	const currentValue = input.value;

	// Met à jour la valeur
	input.value = title;

	// Déclenche les événements nécessaires pour que GitHub détecte le changement
	const events = ["input", "change", "blur"];
	for (const eventType of events) {
		const event = new Event(eventType, { bubbles: true, cancelable: true });
		input.dispatchEvent(event);
	}

	console.log(
		`[GitHub PR Title Formatter] Titre mis à jour: "${currentValue}" → "${title}"`,
	);
}

/**
 * Vérifie si l'utilisateur a modifié manuellement le titre
 */
export function hasUserEditedTitle(
	input: HTMLInputElement,
	originalTitle: string,
): boolean {
	if (!input) return false;

	const currentValue = input.value.trim();
	const originalValue = originalTitle.trim();

	// Si les valeurs sont différentes et que ce n'est pas vide, l'utilisateur a édité
	return currentValue !== originalValue && currentValue !== "";
}

/**
 * Attend que l'input soit disponible dans le DOM
 */
export async function waitForTitleInput(
	maxWaitTime = 5000,
): Promise<HTMLInputElement | null> {
	const startTime = Date.now();

	while (Date.now() - startTime < maxWaitTime) {
		const input = findTitleInput();
		if (input) {
			return input;
		}

		// Attend avant de réessayer
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	return null;
}

/**
 * Configure les écouteurs d'événements pour détecter les modifications manuelles
 */
export function setupInputListeners(
	input: HTMLInputElement,
	state: TitleFormatterState,
	onUserEdit: () => void,
): void {
	if (!input) return;

	let initialValue = input.value;

	const handleInput = () => {
		const currentValue = input.value;

		// Si la valeur a changé et ce n'est pas notre mise à jour automatique
		if (currentValue !== initialValue && !state.userHasEdited) {
			state.userHasEdited = true;
			onUserEdit();
			console.log(
				"[GitHub PR Title Formatter] Modification manuelle détectée, désactivation automatique",
			);
		}

		initialValue = currentValue;
	};

	// Écoute les changements d'input
	input.addEventListener("input", handleInput);
	input.addEventListener("change", handleInput);
	input.addEventListener("keyup", handleInput);
}
