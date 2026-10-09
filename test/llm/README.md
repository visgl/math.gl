# Offline agent evaluation cases

`mathgl-skill-evals.json` contains prompts, expected decision criteria, and canonical repository sources for manual or external agent evaluation. These are behavioral rubrics, not claimed model-evaluation results. No model calls or API keys are required.

Run `node --test test/llm/*.test.mjs` to validate the skill's local references, frontmatter, and corpus source paths. After a website build, `website/scripts/check-llm-output.mjs` checks real generated Markdown links and required pages.
