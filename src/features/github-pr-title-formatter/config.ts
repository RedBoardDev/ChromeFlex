/**
 * GitHub PR Title Formatter Feature Configuration
 */

export const GITHUB_PR_TITLE_FORMATTER_CONFIG = {
	// URL patterns
	URL_MATCHES: ["https://github.com/*/*/compare/*"],

	// DOM selectors
	SELECTORS: {
		TITLE_INPUT: "#pull_request_title",
		TITLE_INPUT_ALTERNATIVE: 'input[name="pull_request[title]"]',
		TEXT_EXPANDER: "text-expander",
	},

	// Regex patterns
	PATTERNS: {
		// Extracte le nom de branche depuis l'URL après les ...
		BRANCH_NAME: /\.\.\.([^?&#]+)/,
		// Détecte le pattern ticket: 2 lettres, tiret, puis des nombres
		TICKET_PATTERN: /([A-Z]{2}-\d+)/i,
		// Détecte le préfixe de type de branche
		BRANCH_PREFIX: /^(feat|fix|hotfix|chore|docs|refactor|test|style)[\/-]/i,
	},

	// Format configuration
	FORMAT: {
		// Format final: "feat: description [TICKET-123]"
		TITLE_TEMPLATE: "{prefix}: {description} [{ticket}]",
		// Mots à remplacer pour améliorer la lisibilité
		WORD_REPLACEMENTS: {
			"-": " ",
			_: " ",
		},
		// Mots à exclure du titre
		EXCLUDED_WORDS: [
			"feat",
			"fix",
			"hotfix",
			"chore",
			"docs",
			"refactor",
			"test",
			"style",
		],
	},

	// Timing configuration
	TIMING: {
		OBSERVER_DEBOUNCE: 100,
		INPUT_UPDATE_DELAY: 500,
		PAGE_LOAD_DELAY: 1000,
	},

	// Feature settings
	FEATURE_CONFIG: {
		name: "github-pr-title-formatter",
		priority: 10,
		enabled: true,
		errorRecovery: {
			maxRetries: 3,
			retryDelay: 1000,
			fallbackMode: true,
		},
		settings: {
			autoFormat: true,
			preserveUserEdits: true,
		},
	},
} as const;
