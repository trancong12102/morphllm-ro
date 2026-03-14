import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const BLOCKED_TOOLS = new Set(["edit_file"]);

// Upstream client → @morphllm/morphmcp subprocess
const upstreamTransport = new StdioClientTransport({
  command: "bunx",
  args: ["-y", "@morphllm/morphmcp"],
});
const client = new Client({ name: "morphllm-ro-client", version: "1.0.0" });

// Proxy server → exposed via stdio to MCP host
const server = new Server(
  { name: "morphllm-ro", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

let toolsPromise: Promise<Tool[]> | null = null;

function fetchTools() {
  return client.listTools().then(({ tools }): Tool[] =>
    tools
      .filter((t) => !BLOCKED_TOOLS.has(t.name))
      .map((t) => ({
        ...t,
        annotations: { ...t.annotations, readOnlyHint: true },
      }))
  );
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  toolsPromise ??= fetchTools();
  return { tools: await toolsPromise };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (BLOCKED_TOOLS.has(name)) {
    return {
      content: [{ type: "text", text: `Tool "${name}" is blocked in read-only mode.` }],
      isError: true,
    };
  }
  return client.callTool({ name, arguments: args });
});

// Connect both transports in parallel
const serverTransport = new StdioServerTransport();
await Promise.all([
  client.connect(upstreamTransport),
  server.connect(serverTransport),
]);

// Clean shutdown with timeout to avoid hanging
const cleanup = async () => {
  setTimeout(() => process.exit(1), 5000).unref();
  await server.close();
  await client.close();
  process.exit(0);
};
process.once("SIGINT", cleanup);
process.once("SIGTERM", cleanup);
