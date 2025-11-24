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
					response_format: { type: "json_object" },
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

		const content = data.choices[0]?.message?.content;
		if (typeof content !== "string") {
			throw new Error("Unexpected content type from Mistral API");
		}

		if (!content.trim()) {
			throw new Error("Empty response from Mistral API");
		}

		// Parse the JSON response (resilient to markdown/code fences)
		const parsed = parseMistralJson(content);

		const prefixRaw = parsed.prefix;
		const summaryRaw = parsed.improvedSummary;

		// Validate the response format
		if (
			typeof prefixRaw !== "string" ||
			typeof summaryRaw !== "string" ||
			!prefixRaw.trim() ||
			!summaryRaw.trim()
		) {
			throw new Error("Invalid response format from Mistral API");
		}

		// Validate prefix
		const prefix = prefixRaw.toLowerCase();
		const allowedPrefixes = new Set(["feat", "fix", "chore"]);
		if (!allowedPrefixes.has(prefix)) {
			throw new Error(`Invalid prefix received: ${prefix}`);
		}

		return {
			prefix: prefix as "feat" | "fix" | "chore",
			issueKey: "", // Will be set later
			improvedSummary: summaryRaw.toLowerCase(),
		};
	} catch (error) {
		// Return null instead of logging to console
		return null;
	}
}

/**
 * Parse the Mistral response content which may contain fenced code blocks
 */
function parseMistralJson(content: string): Record<string, unknown> {
	const trimmed = content.trim();
	const withoutFence = trimmed.startsWith("```")
		? trimmed
				.replace(/^```[a-zA-Z]*\n?/, "")
				.replace(/```$/, "")
				.trim()
		: trimmed;

	// Extract the first JSON object even if surrounded by extra text
	const jsonMatch = withoutFence.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		throw new Error("No JSON object found in Mistral response");
	}

	return JSON.parse(jsonMatch[0]);
}

/**
 * Create branch name from components
 */
function createBranchName(
	components: BranchNameComponents,
	issueKey: string,
): string {
	const { prefix, improvedSummary } = components;
	return `${prefix}-${issueKey.toUpperCase()}-${improvedSummary}`;
}
