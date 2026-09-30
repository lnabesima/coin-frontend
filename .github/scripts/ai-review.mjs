import { execFileSync } from 'node:child_process';

const {
  GITHUB_TOKEN,
  GEMINI_API_KEY,
  PR_NUMBER,
  BASE_REF,
  REPO,
  GEMINI_MODEL = 'gemini-3.8-flash',
} = process.env;

const COMMENT_TAG = '<!-- gemini-code-review -->';

async function main() {
  if (!GEMINI_API_KEY) {
    console.log(
      'Notice: GEMINI_API_KEY secret is not configured in repository. Skipping AI code review.'
    );
    process.exit(0);
  }

  if (!GITHUB_TOKEN || !PR_NUMBER || !REPO) {
    console.error('Missing required GitHub environment variables.');
    process.exit(1);
  }

  console.log(`Starting AI code review for PR #${PR_NUMBER} on ${REPO}...`);

  // Fetch base branch reference if needed
  try {
    execFileSync('git', ['fetch', 'origin', BASE_REF, '--depth=100'], { stdio: 'inherit' });
  } catch (err) {
    console.warn(`Warning: Could not fetch origin/${BASE_REF}, continuing with local ref...`);
  }

  // Get list of changed files
  let changedFiles = '';
  try {
    changedFiles = execFileSync(
      'git',
      ['diff', '--name-status', `origin/${BASE_REF}...HEAD`],
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 2 }
    ).trim();
  } catch (err) {
    console.warn('Could not determine changed files relative to origin, using HEAD~1: ', err);
    changedFiles = execFileSync(
      'git',
      ['diff', '--name-status', 'HEAD~1...HEAD'],
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 2 }
    ).trim();
  }

  console.log(`Changed files:\n${changedFiles}`);

  // Ignore lockfiles, minified files, and generated docs in the detailed diff
  const ignorePatterns = [
    ':!package-lock.json',
    ':!pnpm-lock.yaml',
    ':!yarn.lock',
    ':!dist/**',
    ':!*.svg',
    ':!*.png',
    ':!*.ico',
    ':!docs/**',
  ];

  let diff = '';
  try {
    diff = execFileSync(
      'git',
      ['diff', `origin/${BASE_REF}...HEAD`, '--', '.', ...ignorePatterns],
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 5 }
    ).trim();
  } catch (err) {
    console.warn('Could not diff against origin base, falling back to HEAD~1: ', err);
    diff = execFileSync(
      'git',
      ['diff', 'HEAD~1...HEAD', '--', '.', ...ignorePatterns],
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 5 }
    ).trim();
  }

  if (!diff) {
    console.log('No substantive code changes to review (only docs or binary assets). Skipping review.');
    process.exit(0);
  }

  // Truncate diff if extremely large (> 50,000 characters) to fit comfortably within prompt limits
  const maxDiffLength = 50000;
  const truncatedDiff =
    diff.length > maxDiffLength
      ? `${diff.substring(0, maxDiffLength)}\n\n[... Diff truncated due to size ...]`
      : diff;

  console.log(`Analyzing ${truncatedDiff.length} characters of git diff with Gemini (${GEMINI_MODEL})...`);

  let commitHash = 'HEAD';
  try {
    commitHash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      encoding: 'utf-8',
    }).trim();
  } catch {
    // fallback
  }

  const reviewMarkdown = await generateReviewWithGemini(truncatedDiff, changedFiles, commitHash);

  await postOrUpdateComment(reviewMarkdown);
  console.log('AI code review completed successfully!');
}

async function generateReviewWithGemini(diff, changedFiles, commitHash) {
  const prompt = `You are a Principal Software Engineer performing an automated, rigorous code review on a GitHub Pull Request for "Coin Frontend" (a React 19 + TypeScript + Vite + Tailwind CSS v4 personal finance web application).

Project Standards & Architectural Rules:
- Language: All code, commit messages, PR descriptions, and reviews must be written in English.
- Tooling: Biome is used for formatting and linting. DO NOT comment on purely formatting issues (whitespace, quotes, semicolons, line breaks).
- Security: Never allow hardcoded API keys, tokens, or backend secrets in frontend code. Client API key must be in localStorage.
- Resilient Architecture: Backend is an Azure Container App with 5-15s scale-to-zero cold-starts. TanStack Query should use exponential backoff retry and optimistic updates.
- Performance: Avoid unnecessary re-renders, memory leaks, and unmemoized expensive operations.
- Tone: Direct, concise, technical, and constructive. Be sharp like a senior staff engineer. No fluff.

Changed Files Summary:
${changedFiles}

Git Diff:
<git_diff>
${diff}
</git_diff>

Instructions for Review Output:
Produce a structured GitHub Flavored Markdown review with this exact structure:

## Summary by Gemini Inspector

<A 2-sentence executive summary of the changes, core intent, and impact>

### Walkthrough

| File | Change Summary |
| :--- | :--- |
| \`filename\` | High-level summary of what changed in this file |

### Review Findings

#### 🚨 Action Required
- **\`filename:line\`**: Clear explanation of real bugs, security risks, unhandled errors, or missing edge cases. (Output "None found." if clean).

#### 💡 Suggestions & Polish
- **\`filename:line\`**: Actionable improvements for performance, React 19 / TanStack Query idioms, or code clarity. (Output "None found." if clean).

### Architecture & Standards Alignment
- Brief verification against repository rules (Biome, client-side security, error resilience).`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (HTTP ${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidate) {
    throw new Error('Gemini API returned an empty response.');
  }

  return `${COMMENT_TAG}
${candidate.trim()}

---
<sub>Reviewed commit \`${commitHash}\` against \`${BASE_REF}\` • Powered by Google Gemini (${GEMINI_MODEL}) • Push new commits to refresh this review</sub>`;
}

async function postOrUpdateComment(body) {
  const commentsUrl = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Coin-Gemini-Code-Reviewer',
  };

  // Check for existing review comment
  console.log('Checking for existing review comment on PR...');
  const listRes = await fetch(`${commentsUrl}?per_page=100`, { headers });
  if (!listRes.ok) {
    throw new Error(`Failed to list PR comments: ${listRes.statusText}`);
  }

  const comments = await listRes.json();
  const existingComment = comments.find((c) => c.body?.includes(COMMENT_TAG));

  if (existingComment) {
    console.log(`Updating existing comment #${existingComment.id}...`);
    const updateUrl = `https://api.github.com/repos/${REPO}/issues/comments/${existingComment.id}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body }),
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update comment: ${updateRes.statusText}`);
    }
  } else {
    console.log('Posting new review comment...');
    const createRes = await fetch(commentsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to post comment: ${createRes.statusText}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error in AI code review script:', err);
  process.exit(1);
});
