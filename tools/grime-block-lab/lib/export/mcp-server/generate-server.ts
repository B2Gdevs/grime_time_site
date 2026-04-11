import { normalizeToolVisibility } from "../../workbench/metadata/visibility";
import type { MCPServerConfig, MCPToolConfig } from "./types";

function toSafeFileName(name: string): string {
  return (
    name
      .replace(/\.\./g, "")
      .replace(/[/\\]/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "tool"
  );
}

function toSafeIdentifier(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^[0-9]/, "_$&");
  return safe || "tool";
}

export function generateServerEntry(config: MCPServerConfig): string {
  const widgetResourceMeta = buildWidgetResourceMeta(config);
  const listingResourceMetaLiteral = toTemplateObjectLiteral(
    { _meta: widgetResourceMeta.listingMeta },
    "    ",
  );
  const contentResourceMetaLiteral = toTemplateObjectLiteral(
    widgetResourceMeta.contentMeta,
    "            ",
  );

  const toolImports = config.tools
    .map((t) => {
      const safeFileName = toSafeFileName(t.name);
      const safeHandler = camelCase(toSafeIdentifier(t.name));
      return `import { ${safeHandler}Handler } from "./tools/${safeFileName}.js";`;
    })
    .join("\n");

  const toolRegistrations = config.tools
    .map((tool) => generateToolRegistration(tool))
    .join("\n\n");

  return `import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
${toolImports}

const WIDGET_HTML = ${config.widgetHtml ? `\`${escapeTemplate(config.widgetHtml)}\`` : `"<!-- Widget HTML not provided -->"`};

function createAppServer() {
  const server = new McpServer({
    name: ${JSON.stringify(config.name)},
    version: ${JSON.stringify(config.version)},
  });

  // Register widget as resource.
  // Listing-level _meta.ui lets hosts inspect security metadata at connection
  // time without a resource read round-trip (ext-apps v1.1.0+).
  server.registerResource(
    "widget",
    "ui://widget/main.html",
    ${listingResourceMetaLiteral},
    async () => ({
      contents: [
        {
          uri: "ui://widget/main.html",
          mimeType: RESOURCE_MIME_TYPE,
          text: WIDGET_HTML,
          _meta: ${contentResourceMetaLiteral},
        },
      ],
    })
  );

${toolRegistrations}

  return server;
}

const port = Number(process.env.PORT ?? 3001);
const MCP_PATH = "/mcp";

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, \`http://\${req.headers.host ?? "localhost"}\`);

  // CORS preflight
  // TODO: For production, replace "*" with your widget's origin
  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end(\`${config.name} MCP server\`);
    return;
  }

  // MCP endpoint
  const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createAppServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(\`${config.name} MCP server listening on http://localhost:\${port}\${MCP_PATH}\`);
});
`;
}

function toTemplateObjectLiteral(value: unknown, indent: string): string {
  return JSON.stringify(value, null, 2).replace(/\n/g, `\n${indent}`);
}

function toCspMeta(
  csp:
    | NonNullable<
        NonNullable<MCPServerConfig["widgetResourceMeta"]>["ui"]
      >["csp"]
    | undefined,
): Record<string, unknown> | undefined {
  if (!csp || typeof csp !== "object") return undefined;

  const result: Record<string, unknown> = {};
  const cspRecord = csp as Record<string, unknown>;

  for (const key of [
    "connectDomains",
    "resourceDomains",
    "frameDomains",
    "baseUriDomains",
  ] as const) {
    const value = cspRecord[key];
    if (
      Array.isArray(value) &&
      value.every((candidate) => typeof candidate === "string") &&
      value.length > 0
    ) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function buildWidgetResourceMeta(config: MCPServerConfig): {
  listingMeta: Record<string, unknown>;
  contentMeta: Record<string, unknown>;
} {
  const configuredUi = config.widgetResourceMeta?.ui;
  const uiMeta: Record<string, unknown> = {
    prefersBorder: configuredUi?.prefersBorder ?? true,
  };
  const cspMeta = toCspMeta(configuredUi?.csp);
  if (cspMeta) {
    uiMeta.csp = cspMeta;
  }
  if (
    typeof configuredUi?.domain === "string" &&
    configuredUi.domain.length > 0
  ) {
    uiMeta.domain = configuredUi.domain;
  }

  const sharedMeta: Record<string, unknown> = {
    ui: uiMeta,
  };

  return {
    listingMeta: sharedMeta,
    contentMeta: {
      ...sharedMeta,
      ui: { ...uiMeta },
    },
  };
}

function generateToolRegistration(tool: MCPToolConfig): string {
  const safeHandler = camelCase(toSafeIdentifier(tool.name));
  const handlerName = `${safeHandler}Handler`;
  const meta = buildToolMeta(tool);
  const annotations = tool.annotations
    ? `annotations: ${JSON.stringify(tool.annotations)},`
    : "";

  return `  // Tool: ${tool.name}
  server.registerTool(
    ${JSON.stringify(tool.name)},
    {
      title: ${JSON.stringify(tool.title || tool.name)},
      description: ${JSON.stringify(tool.description || `Execute ${tool.name}`)},
      inputSchema: ${formatSchema(tool.inputSchema)},
      ${annotations}
      _meta: ${JSON.stringify(meta, null, 6).replace(/\n/g, "\n      ")},
    },
    ${handlerName}
  );`;
}

function buildToolMeta(tool: MCPToolConfig): Record<string, unknown> {
  const normalizedVisibility = normalizeToolVisibility(
    (tool.meta ?? {}) as Record<string, unknown>,
  );

  const uiMeta: Record<string, unknown> = {
    resourceUri: tool.meta?.ui?.resourceUri ?? "ui://widget/main.html",
  };
  if (normalizedVisibility.source === "ui") {
    uiMeta.visibility = normalizedVisibility.canonical;
  }

  const meta: Record<string, unknown> = { ui: uiMeta };

  if (tool.meta) {
    if ("openai/toolInvocation/invoking" in tool.meta) {
      meta["openai/toolInvocation/invoking"] =
        tool.meta["openai/toolInvocation/invoking"];
    }
    if ("openai/toolInvocation/invoked" in tool.meta) {
      meta["openai/toolInvocation/invoked"] =
        tool.meta["openai/toolInvocation/invoked"];
    }
  }

  return meta;
}

function formatSchema(schema?: Record<string, unknown>): string {
  if (!schema || Object.keys(schema).length === 0) {
    return "{}";
  }

  const properties = schema.properties as
    | Record<string, { type?: string; description?: string }>
    | undefined;
  if (!properties || Object.keys(properties).length === 0) {
    return "{}";
  }

  const fields = Object.entries(properties).map(([name, prop]) => {
    let zodType = "z.unknown()";
    switch (prop.type) {
      case "string":
        zodType = "z.string()";
        break;
      case "number":
      case "integer":
        zodType = "z.number()";
        break;
      case "boolean":
        zodType = "z.boolean()";
        break;
      case "array":
        zodType = "z.array(z.unknown())";
        break;
      case "object":
        zodType = "z.object({})";
        break;
    }
    if (prop.description) {
      zodType += `.describe(${JSON.stringify(prop.description)})`;
    }
    return `    ${name}: ${zodType}`;
  });

  return `{\n${fields.join(",\n")}\n  }`;
}

function camelCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part, i) =>
      i === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("");
}

function escapeTemplate(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}
