# Claude Inline Autocomplete

VS Code extension that provides inline ghost-text completions (Copilot-style) powered by Claude.

## How It Works

As you type, the extension sends the surrounding code context to Claude using a fill-in-the-middle prompt. Claude returns a completion that appears as ghost text you can accept with `Tab`.

The extension supports two authentication modes:

| Mode | Auth Source | Latency | When Used |
|------|------------|---------|-----------|
| **Direct API** (preferred) | `ANTHROPIC_API_KEY` env var | ~1-2s | If you have a Console API key |
| **CLI Subprocess** (fallback) | `claude login` session | ~3-4s | For Enterprise users without an API key |

## Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Package as .vsix (requires vsce)
npx @vscode/vsce package
```

Then install the `.vsix` in VS Code via **Extensions > ... > Install from VSIX**.

For development, you can also press `F5` in VS Code to launch an Extension Development Host.

## Authentication

### Option A: API Key (faster)

Set the `ANTHROPIC_API_KEY` environment variable before launching VS Code:

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
code .
```

### Option B: Claude CLI (Enterprise)

If you use Claude Enterprise and don't have a raw API key, ensure the Claude CLI is installed and authenticated:

```bash
claude login
```

The extension will automatically detect the CLI and use it as a subprocess fallback. This is slower (~3-4s per completion) due to process spawn overhead, but works with Enterprise auth.

## Configuration

All settings are under `claude-inline.*` in VS Code settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | `true` | Enable/disable completions |
| `debounceMs` | `350` | Delay before triggering (ms) |
| `model` | `claude-haiku-4-5-latest` | Claude model to use |
| `maxTokensSingleLine` | `64` | Max tokens for single-line completions |
| `maxTokensMultiLine` | `128` | Max tokens for multi-line completions |
| `cliPath` | `claude` | Path to the Claude CLI executable |
| `cliTimeoutMs` | `8000` | CLI subprocess timeout (ms) |
| `prefixLines` | `100` | Lines before cursor included as context |
| `suffixLines` | `30` | Lines after cursor included as context |

## Usage

- **Toggle on/off**: Run `Claude Inline: Toggle Completions` from the command palette, or click the status bar item.
- **Accept completion**: Press `Tab` when ghost text appears.
- **Dismiss**: Press `Escape` or keep typing.

The status bar shows the current state:
- `$(sparkle) Claude (API)` / `$(sparkle) Claude (CLI)` -- active and ready
- `$(sync~spin) Claude` -- generating a completion
- `$(circle-slash) Claude: Off` -- disabled
- `$(warning) Claude: No Auth` -- no authentication configured

## Architecture

```
src/
  extension.ts                  # Entry point: activate/deactivate
  config.ts                     # Configuration accessor
  auth/
    authDetector.ts             # Detect API key vs CLI vs none
  api/
    types.ts                    # ICompletionBackend interface
    directApiClient.ts          # Anthropic SDK direct calls (preferred)
    cliBridge.ts                # claude -p subprocess (fallback)
    completionClient.ts         # Factory: picks backend based on auth
  prompt/
    promptBuilder.ts            # FIM "hole filler" system + user prompt
    contextGatherer.ts          # Extract prefix/suffix from document
    multiLineDetector.ts        # Heuristics: single-line vs multi-line
    postProcessor.ts            # Strip XML tags, indentation truncation
  completion/
    completionProvider.ts       # InlineCompletionItemProvider
    debouncer.ts                # Request debouncing with staleness tracking
    cache.ts                    # LRU cache with 30s TTL
  statusBar/
    statusBarManager.ts         # Status bar UI
```

### Request Flow

1. User types code
2. 350ms debounce (skipped for explicit invocation)
3. Check LRU cache -- return immediately on hit
4. Cancel any in-flight request
5. Gather prefix/suffix context from the document
6. Detect single-line vs multi-line from heuristics
7. Build FIM prompt with `{{FILL_HERE}}` marker
8. Call Claude via Direct API or CLI subprocess
9. Post-process: strip XML tags, truncate by indentation
10. Return `InlineCompletionItem` as ghost text

## Development

```bash
# Watch mode (rebuilds on file changes)
npm run watch

# Run tests
npm test

# Type-check
npx tsc --noEmit
```

## License

MIT
