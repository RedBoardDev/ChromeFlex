/**
 * GitHub PR Title Formatter Feature Types
 */

export interface BranchInfo {
	/** Le nom complet de la branche */
	fullName: string;
	/** Le préfixe de type de branche (feat, fix, etc.) */
	prefix?: string;
	/** Le numéro du ticket détecté */
	ticket?: string;
	/** La description extraite de la branche */
	description: string;
}

export interface FormattedTitle {
	/** Le titre formaté final */
	title: string;
	/** Indique si un ticket a été détecté */
	hasTicket: boolean;
	/** Indique si un préfixe a été détecté */
	hasPrefix: boolean;
}

export interface TitleFormatterState {
	/** Indique si la feature est active */
	isActive: boolean;
	/** L'élément input du titre */
	titleInput: HTMLInputElement | null;
	/** La dernière branche traitée */
	lastProcessedBranch: string | null;
	/** Indique si l'utilisateur a modifié manuellement le titre */
	userHasEdited: boolean;
}

export interface UrlInfo {
	/** L'URL complète */
	url: string;
	/** Le nom de la branche extrait de l'URL */
	branchName: string | null;
	/** Indique si l'URL correspond au pattern attendu */
	isValidUrl: boolean;
}
