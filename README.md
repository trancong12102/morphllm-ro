# morphllm-ro

A read-only MCP proxy for [@morphllm/morphmcp](https://www.npmjs.com/package/@morphllm/morphmcp). It forwards all tools from the upstream MCP server but blocks `edit_file` and marks every exposed tool as read-only.

## Prerequisites

- [Bun](https://bun.sh) v1.3.10 or later
- [Node.js](https://nodejs.org) v18+ (required by `@modelcontextprotocol/sdk`)
- A valid [MorphLLM](https://morphllm.com) API key (set via `MORPH_API_KEY` environment variable)

## Installation

No local clone needed. Run directly via `bunx`:

```bash
bunx @better-agents/morphllm-ro
```

## Usage

The server communicates over stdio, so it is meant to be launched by an MCP host (e.g. Claude Code). Add it to your MCP config:

```json
{
  "mcpServers": {
    "morphllm-ro": {
      "command": "bunx",
      "args": ["@better-agents/morphllm-ro"],
      "env": {
        "MORPH_API_KEY": "your-api-key"
      }
    }
  }
}
```
