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
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

export interface BranchNameComponents {
	prefix: "feat" | "fix";
	issueKey: string;
	improvedSummary: string;
}

export interface BranchNameUpdateResult {
	success: boolean;
	branchName?: string;
	error?: string;
}
