/**
 * Branch Name Generator
 * Handles automatic branch name generation using Mistral AI
 */

import { JIRA_BRANCH_HELPER_CONFIG } from "./config";
import type {
	BranchNameComponents,
	BranchNameGenerationResult,
	JiraBranchCreationParams,
	MistralApiResponse,
} from "./types";

/**
 * Generate a branch name using Mistral AI
 */
export async function generateBranchName(
	jiraParams: JiraBranchCreationParams,
): Promise<BranchNameGenerationResult> {
	try {
		// Check if API key is available
		const apiKey = JIRA_BRANCH_HELPER_CONFIG.MISTRAL_API.API_KEY;
		if (!apiKey) {
			return {
				success: false,
				error: "Mistral API key not found in environment variables",
			};
		}

		// Call Mistral API to analyze the issue summary
		const components = await callMistralApi(jiraParams.issueSummary, apiKey);
		if (!components) {
			return {
				success: false,
				error: "Failed to generate branch name components",
			};
		}

		// Create the branch name
		const branchName = createBranchName(components, jiraParams.issueKey);

		return {
			success: true,
			branchName,
		};
	} catch (error) {
		return {
			success: false,
			error: `Branch name generation failed: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Call Mistral AI API to analyze issue summary
 */
async function callMistralApi(
	issueSummary: string,
	apiKey: string,
): Promise<BranchNameComponents | null> {
	try {
		const prompt =
			JIRA_BRANCH_HELPER_CONFIG.MISTRAL_API.PROMPT_TEMPLATE.replace(
				"{summary}",
				issueSummary,
			);

		const response = await fetch(
			JIRA_BRANCH_HELPER_CONFIG.MISTRAL_API.BASE_URL,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: JIRA_BRANCH_HELPER_CONFIG.MISTRAL_API.MODEL,
					messages: [
						{
							role: "user",
							content: prompt,
						},
					],
					max_tokens: JIRA_BRANCH_HELPER_CONFIG.MISTRAL_API.MAX_TOKENS,
					temperature: JIRA_BRANCH_HELPER_CONFIG.MISTRAL_API.TEMPERATURE,
				}),
			},
		);

		if (!response.ok) {
			throw new Error(
				`Mistral API error: ${response.status} ${response.statusText}`,
			);
		}

		const data: MistralApiResponse = await response.json();

		if (!data.choices || data.choices.length === 0) {
			throw new Error("No response from Mistral API");
		}

		const content = data.choices[0]?.message?.content?.trim();
		if (!content) {
			throw new Error("Empty response from Mistral API");
		}

		// Parse the JSON response
		const parsed = JSON.parse(content);

		// Validate the response format
		if (!parsed.prefix || !parsed.improvedSummary) {
			throw new Error("Invalid response format from Mistral API");
		}

		// Validate prefix
		const prefix = parsed.prefix.toLowerCase();
		if (prefix !== "feat" && prefix !== "fix") {
			throw new Error(`Invalid prefix received: ${prefix}`);
		}

		return {
			prefix: prefix as "feat" | "fix",
			issueKey: "", // Will be set later
			improvedSummary: parsed.improvedSummary.toLowerCase(),
		};
	} catch (error) {
		// Return null instead of logging to console
		return null;
	}
}

/**
 * Create branch name from components
 */
function createBranchName(
	components: BranchNameComponents,
	issueKey: string,
): string {
	const { prefix, improvedSummary } = components;
	// Keep issue key in uppercase, everything else lowercase
	return `${prefix}/${issueKey.toUpperCase()}-${improvedSummary}`;
}
