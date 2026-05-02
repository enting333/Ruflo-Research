# Ruflo GitHub Protocol Runner

This repository runs `protocol.txt` through Ruflo from GitHub Actions.

## Setup

1. Put `protocol.txt` in the repository root.
2. Add these repository secrets in GitHub:
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_API_KEY`
   - `OPENAI_API_KEY`
   - `TAVILY_API_KEY`
   - `SERPAPI_API_KEY`
3. Commit the files.
4. Open **Actions → Ruflo Protocol Digest → Run workflow**.

The workflow also runs daily at 00:00 UTC.

## Files

- `.github/workflows/ruflo-protocol.yml` — GitHub Actions workflow.
- `scripts/validate-protocol.mjs` — checks that required protocol sections exist.
- `scripts/run-protocol.mjs` — reads `protocol.txt`, replaces `{{now}}`, and invokes Ruflo.
