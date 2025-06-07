## 🎯 Built-in Features

### GitHub PR Review Filter
Automatically adds a "Review PR" button to GitHub pull request pages that directly navigates to PRs where you have been requested for review.

**Features:**
- 🎯 Smart URL detection for GitHub PR pages
- 🔄 SPA navigation support (no page reload needed)
- 🎨 Native GitHub styling integration
- 🔒 Always present - button stays visible after navigation
- ⚡ Direct navigation to review requests with one click
- 🧹 Automatic cleanup on page changes

**How it works:**
1. Automatically detects when you're on a GitHub repository's pull requests page
2. Adds a "Review PR" button next to the "Open all" button
3. Clicking the button navigates to: `sort:updated-desc is:pr is:open user-review-requested:@me`
4. Button remains always visible and functional
5. Works seamlessly with GitHub's SPA navigation
