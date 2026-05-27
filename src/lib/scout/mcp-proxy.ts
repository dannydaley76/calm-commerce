const DEFAULT_MCP_BASE_URL = "https://product-data-extraction-mcp-production.up.railway.app";

function mcpBaseUrl(): string {
  return (process.env.SCOUT_MCP_BASE_URL || DEFAULT_MCP_BASE_URL).replace(/\/$/, "");
}

function mcpApiKey(): string | null {
  return process.env.SCOUT_MCP_API_KEY || process.env.PRODUCT_DATA_MCP_API_KEY || null;
}

export function isScoutMcpConfigured(): boolean {
  return Boolean(mcpApiKey());
}

export async function proxyScoutMcp(path: "/extract" | "/trends" | "/title" | "/enrich", body: unknown) {
  const apiKey = mcpApiKey();
  if (!apiKey) {
    return Response.json(
      { success: false, error: "Scout Pro research is not configured yet." },
      { status: 503 },
    );
  }

  const response = await fetch(`${mcpBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (response.status === 401 || response.status === 403) {
    return Response.json(
      {
        success: false,
        error: "Scout Pro research service rejected the server API key.",
        reason: "mcp_unauthorized",
      },
      { status: 502 },
    );
  }

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}
