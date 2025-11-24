/**
 * Jira Branch Helper Feature Types
 */

export interface JiraBranchCreationParams {
	issueKey: string;
	issueSummary: string;
	jwt: string;
	addonkey: string;
}

export interface RepositorySelectionResult {
	success: boolean;
	selectedRepository?: string;
	error?: string;
}

export interface BranchFieldInfo {
	selector: string;
	element: Element;
	isVisible: boolean;
}

export interface BranchNameGenerationResult {
	success: boolean;
	branchName?: string;
	error?: string;
}

export interface MistralApiResponse {
	id: string;
	created?: number;
	model?: string;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
	choices: Array<{
		index?: number | string;
		finish_reason?: string | null;
		message?: {
			role?: string;
			content?: string | null;
		};
	}>;
}

export interface BranchNameComponents {
	prefix: "feat" | "fix" | "chore";
	issueKey: string;
	improvedSummary: string;
}

export interface BranchNameUpdateResult {
	success: boolean;
	branchName?: string;
	error?: string;
}
