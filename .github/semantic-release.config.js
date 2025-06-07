module.exports = {
	branches: ["release"],
	plugins: [
		"@semantic-release/commit-analyzer",
		"@semantic-release/release-notes-generator",
		"@semantic-release/changelog",
		[
			"@semantic-release/github",
			{
				assets: [{ path: "ChromeFlex.zip", label: "ChromeFlex Extension" }],
			},
		],
		[
			"@semantic-release/git",
			{
				assets: ["CHANGELOG.md", "package.json", "extension/manifest.json"],
				message:
					"chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
			},
		],
	],
};
