# Commit-message benchmark

An opt-in **paid** benchmark with quick and full tiers using synthetic diffs, never your staged
files. Nothing is committed and Shiplog/global configuration is not changed.

## Config and running

Provider/model pairs, default tier, provider/case selection and repetition counts live only in
**`evals/config.json`**, independent of Shiplog settings. Tiers select from the shared target list
by provider and reference fixture IDs from `fixtures.ts`. Edit the JSON to deliberately change a
future run. Tests verify full-tier coverage of `PROVIDER_NAMES` without copying the model list.
Upstream OpenRouter hosts are not separate Shiplog API providers.

```sh
# Set OPENROUTER_API_KEY in your environment, never in files.
deno task eval:commits       # default: quick
deno task eval:commits quick # same paid smoke test

# Full also requires ANTHROPIC_API_KEY and explicit spending authorization.
deno task eval:commits full
```

**Quick plans 6 generate calls:** small-fix and breaking-api × 3 OpenRouter targets × 1 repetition.
**Full plans 72 calls:** all 6 fixtures × all 4 targets (including direct Anthropic Haiku) × 3
repetitions. Quick does not require an Anthropic key; full is blocked without it.

The runner prints the planned call count before generation. Unknown tiers, fixture IDs, providers
and empty plans are rejected before any call or report overwrite. Only selected targets need
credentials; a missing required key aborts rather than skipping a provider. The report records its
tier, coverage, targets and results, which may differ from the current config.

Calls are sequential, looping repetition → case → target, with target order rotated by case index
plus repetition index. Three repetitions balance a three-target roster; they do not fully balance
four positions. No warm-ups, runner retries, request overrides, fallback models or provider-routing
changes. Any generation failure stops conservatively; inspect it before authorizing more spending.
Rerunning starts a new paid run, not a resume.

## One browser-readable result

**`evals/results.html` is the sole persisted result file**, unignored and suitable for Git tracking.
Open it directly in a browser. The TL;DR comes first, followed by compact timing and expandable
responses. Full model IDs and run details are tucked away below the recommendation. Inline CSS needs
no JavaScript, external assets or network. The runner never opens a browser automatically.

Each run **overwrites** this file before generation and after every completed attempt, retaining
partial progress. Every response is retained once; raw and cleaned versions appear only when they
differ. Each attempt keeps its model/repetition, exact time, start timestamp and any failure or
format issue. Each original prompt appears once, including its diff/history, alongside review
criteria. Successful medians, coverage, git HEAD and lock digest remain available. No additional
result files are generated. Preserve an earlier result with Git before starting another run if
needed. An abrupt interruption during the file write can truncate the report; interruption during
generation can leave an uncaptured charge and a `running` status. The HTML is formatter-ignored to
preserve captured output whitespace.

## Agent recommendation and ranking

In Pi, trust the project to discover `.agents/skills/benchmark/SKILL.md`, then invoke
**`/skill:benchmark`** to analyze the saved report without API calls. Request an update to write the
TL;DR: one easy recommendation sentence and up to three ranked models, each with a short pro, con
and typical time. A tiny note covers sample size and limitations; links lead to the evidence. The
whole review stays below 150 words. Quick is a smoke test, not evidence of a general model winner:
review the two cases without ranking models across untested work. It does not cover dependency,
refactor, CSV or ticket handling, and a changed-prompt run does not prove causation. The agent
reviews all captured inputs/outputs; correctness and required information come before editing
burden, then speed. This is provisional agent judgment, not a numerical quality score or an
automatic runner judge. Unrun providers are not ranked; incomplete evidence can mean no clear
winner.

Every fresh render (including partial progress) resets the top section to **Not reviewed** so a new
run cannot inherit a stale recommendation. Authorized review edits replace only the region between
`<!-- benchmark-review:start -->` and `<!-- benchmark-review:end -->`, bound to the report's run ID;
measured evidence stays unchanged. A new paid run requires separate explicit authorization.

## Production parity and review

The runner calls `buildCommitPrompt` → unmodified `generate(prompt, model, provider)` →
`sanitizeCommitMessage(raw, issueId)`, as `src/commands/commit.ts` does. It uses fixed fixture
history, summary limits and optional ticket rather than branch/config discovery. Saved runs must be
judged against their original prompts; changing the writing instructions does not retest old
responses.

Timing starts immediately before `generate()` and ends at fulfillment/rejection: adapter
construction and full stream consumption are included. Prompt building, sanitization, report writes
and CLI startup are excluded. This is full generation latency, **not TTFT**. Failed attempts retain
separate timings; partial stream text is unavailable through `generate()`. Raw means its trimmed
return, not wire bytes. No token usage, cost, upstream backend identity or cache-hit information is
inferred.

Mechanical checks use Unicode code-point counts for the summary (including ticket) and 72-character
body lines, exact single ticket prefix/no summary brackets without a ticket, no type prefix,
required `BREAKING:` for the known breaking fixture, wrappers, blank body separator and
bullet/indented body lines. `wrapper` detects fences or boundary quotes/backticks; `type-prefix`
detects a leading word/optional scope plus colon except `BREAKING:`. Review false positives and
unrecognized formats. All dynamic text is HTML-escaped, including model output, prompts and errors.

Read outputs against the diff and reviewer expectations: factual accuracy, unsupported claims,
supported purpose, imperative summary, appropriate brevity/body, and breaking API migration clarity.
Format passes are **not semantic correctness**. No word-matching quality score or automated LLM
judge. Three repeats and synthetic cases support only a small descriptive comparison, not a
statistically reliable ranking. Output length, routing, load and caching can affect latency.
Defaults remain unchanged.

## Offline validation

```sh
deno test --allow-read --allow-env --allow-write evals/
for fixture in evals/fixtures/*.diff; do git apply --numstat "$fixture"; done
```

Offline tests cover scheduling, statistics, raw/sanitized checks, HTML escaping/reporting,
same-model provider separation, sequential persistence, stop-on-error, secret redaction, provider
full-provider coverage, quick/full selection and call counts, selected credential preflight, invalid
plans, review delimiters/escaping and stale-review reset. Regular tests/CI never invoke the live
entry point. `git apply --numstat` checks synthetic patch syntax without applying anything.
