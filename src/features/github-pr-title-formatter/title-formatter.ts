/**
 * Title Formatter for GitHub PR
 */

import { GITHUB_PR_TITLE_FORMATTER_CONFIG } from "./config";
import type { BranchInfo, FormattedTitle } from "./types";

/**
 * Parse le nom de branche pour extraire les informations
 */
export function parseBranchName(branchName: string): BranchInfo {
	const branchInfo: BranchInfo = {
		fullName: branchName,
		description: branchName,
	};

	// Détecte le préfixe de type de branche
	const prefixMatch = branchName.match(
		GITHUB_PR_TITLE_FORMATTER_CONFIG.PATTERNS.BRANCH_PREFIX,
	);
	if (prefixMatch?.[1]) {
		branchInfo.prefix = prefixMatch[1].toLowerCase();
		// Supprime le préfixe de la description
		branchInfo.description = branchName.replace(prefixMatch[0], "");
	}

	// Détecte le numéro de ticket
	const ticketMatch = branchName.match(
		GITHUB_PR_TITLE_FORMATTER_CONFIG.PATTERNS.TICKET_PATTERN,
	);
	if (ticketMatch?.[1]) {
		branchInfo.ticket = ticketMatch[1].toUpperCase();
		// Supprime le ticket de la description
		branchInfo.description = branchInfo.description
			.replace(ticketMatch[1], "")
			.replace(/-$/, "");
	}

	// Nettoie la description
	branchInfo.description = cleanDescription(branchInfo.description);

	return branchInfo;
}

/**
 * Nettoie la description en appliquant les règles de formatage
 */
function cleanDescription(description: string): string {
	let cleaned = description;

	// Applique les remplacements de mots
	for (const [from, to] of Object.entries(
		GITHUB_PR_TITLE_FORMATTER_CONFIG.FORMAT.WORD_REPLACEMENTS,
	)) {
		cleaned = cleaned.replace(new RegExp(from, "g"), to);
	}

	// Supprime les mots exclus
	const words = cleaned.split(/\s+/).filter((word) => {
		const lowerWord = word.toLowerCase();
		return (
			!GITHUB_PR_TITLE_FORMATTER_CONFIG.FORMAT.EXCLUDED_WORDS.includes(
				lowerWord,
			) && word.trim() !== ""
		);
	});

	// Rejoint et nettoie
	cleaned = words.join(" ").trim();

	// Supprime les caractères en début/fin
	cleaned = cleaned.replace(/^[\/\-_\s]+|[\/\-_\s]+$/g, "");

	return cleaned;
}

/**
 * Formate le titre final à partir des informations de branche
 */
export function formatTitle(branchInfo: BranchInfo): FormattedTitle {
	const { prefix, description, ticket } = branchInfo;

	// Utilise le préfixe détecté ou 'feat' par défaut
	const finalPrefix = prefix || "feat";

	// Formate le titre selon le template
	let title = GITHUB_PR_TITLE_FORMATTER_CONFIG.FORMAT.TITLE_TEMPLATE.replace(
		"{prefix}",
		finalPrefix,
	).replace("{description}", description);

	// Ajoute le ticket si disponible
	if (ticket) {
		title = title.replace("{ticket}", ticket);
	} else {
		// Supprime la partie ticket si non disponible
		title = title.replace(" [{ticket}]", "");
	}

	return {
		title,
		hasTicket: Boolean(ticket),
		hasPrefix: Boolean(prefix),
	};
}

/**
 * Formate le titre complet à partir d'un nom de branche
 */
export function formatTitleFromBranchName(branchName: string): FormattedTitle {
	const branchInfo = parseBranchName(branchName);
	return formatTitle(branchInfo);
}
