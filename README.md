# shiplog

AI-powered git CLI — generates commit messages and branch names via LLM.

## Install

Requires [Deno 2.x](https://deno.com/) and an API key for your chosen LLM provider:

- Anthropic: `ANTHROPIC_API_KEY`
- OpenRouter: `OPENROUTER_API_KEY`

```sh
git clone https://github.com/black-atom-industries/shiplog.git
cd shiplog
deno task install
```

This installs `shiplog` globally via `deno install`. Changes to source take effect immediately — no
rebuild needed.

For a standalone binary instead:

```sh
deno task compile
cp shiplog ~/.local/bin/  # or anywhere on PATH
```

## Setup

```sh
# Create global config at ~/.config/black-atom/shiplog/config.toml
shiplog config --init

# Create repo-local config (.shiplog.toml) for issue tracking
shiplog init
```

## LLM Support

The `--smart` flag on `commit` and `branch` commands sends context to an LLM and returns a
suggestion for you to review, edit, or regenerate before applying.

Currently supported providers:

| Provider     | Models                                                                |
| ------------ | --------------------------------------------------------------------- |
| `anthropic`  | `claude-opus-4-6`, `claude-sonnet-4-5`, `claude-haiku-4-6`            |
| `openrouter` | `openrouter/auto`, `nvidia/nemotron-3-super:free`, `x-ai/grok-4-fast` |

The default model is `claude-haiku-4-6` (fast and cheap). OpenRouter users get free model options
and auto-routing by default. You can switch models interactively during a `--smart` session, or set
a different default in your config.

Requires the provider's API key as an environment variable:

- Anthropic: `ANTHROPIC_API_KEY`
- OpenRouter: `OPENROUTER_API_KEY`

## Usage

### Commit

```sh
# Guided conventional commit builder (interactive)
shiplog commit

# AI-generated commit message (interactive)
shiplog commit --smart

# Auto-confirm the generated message
shiplog commit --smart --yes

# Commit and push
shiplog commit --smart --yes --push

# Force push (--force-with-lease)
shiplog commit --smart --yes --push --force

# Raw output — just print the message, no commit (requires -sy)
shiplog commit -syr

# Use with git directly (e.g. from Neovim :! or scripts)
git commit -m "$(shiplog commit -syr)"
```

### Branch

```sh
# Create branch directly
shiplog branch my-feature

# AI-generated branch name from description
shiplog branch --smart "fix the login validation bug"

# Auto-confirm
shiplog branch --smart --yes "add user dashboard"

# Raw output — just print the name, no branch creation (requires -sy)
git checkout -b "$(shiplog branch -syr "add user dashboard")"
```

### Config

```sh
# Show resolved config (global + repo merged)
shiplog config --show
```

## Configuration

### Global (`~/.config/black-atom/shiplog/config.toml`)

```toml
provider = "anthropic"
model = "claude-haiku-4-6"
models = ["claude-opus-4-6", "claude-sonnet-4-5", "claude-haiku-4-6"]
summary_length = 72
history_count = 10
```

Or with OpenRouter:

```toml
provider = "openrouter"
model = "openrouter/auto"
models = ["openrouter/auto", "nvidia/nemotron-3-super:free", "x-ai/grok-4-fast"]
summary_length = 72
history_count = 10
```

OpenRouter gives you automatic access to 300+ models through a single API key. The `openrouter/auto`
model picks the best available model for your request, potentially using free models when possible.

### Repo-local (`.shiplog.toml`)

```toml
use_lazygit = true
commit_types = ["feat", "fix", "docs", "style", "refactor", "test", "chore", "ci", "perf", "revert"]
issue_pattern = "(\\w+-\\d+)"
issue_prefix = ""
```

When `issue_pattern` matches the current branch name, the extracted issue ID is prepended to commit
messages automatically. `commit_types` can be customised per repo. Set `use_lazygit = false` to
disable the lazygit staging prompt.

## Development

```sh
deno task test     # Run tests
deno task check    # Type-check
deno task lint     # Lint
deno task fmt      # Format
```

## Stack

- [Deno 2.x](https://deno.com/) — runtime
- [TanStack AI](https://tanstack.com/ai) (`@tanstack/ai-anthropic`, `@tanstack/ai-openrouter`) — LLM
  abstraction
- [Zod v4](https://zod.dev/) — config schema validation
- [Cliffy](https://cliffy.io/) — CLI framework and interactive prompts
