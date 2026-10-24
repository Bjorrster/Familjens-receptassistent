
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/server";
import {
  createMcpHandler,
  getMcpAuthContext,
} from "agents/mcp/server";
import { GitHubHandler } from "./github-handler";

type UserProps = {
  login: string;
  name: string | null;
  email: string | null;
};

const MCP_URL =
  "https://familjens-receptassistent.bjorn-sunesson.workers.dev/mcp";

function createServer() {
  const server = new McpServer({
    name: "Familjens Receptassistent",
    version: "1.1.0",
  });

  const props = getMcpAuthContext()?.props as
    | UserProps
    | undefined;

  // All recipe tools require the authorized GitHub user.
  if (props?.login?.toLowerCase() === "bjorrster") {
    server.registerTool(
      "recipeConnectionStatus",
      {
        description:
          "Verify authenticated access to the recipe assistant.",
      },
      async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "ok",
              authenticated: true,
              googleConnected: false,
              message:
                "GitHub OAuth works. Google Sheets is not connected yet.",
            }),
          },
        ],
      }),
    );
  }

  return server;
}

const mcpHandler = createMcpHandler(createServer);

const apiHandler = {
  fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ) {
    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

export default new OAuthProvider({
  apiHandler,
  apiRoute: "/mcp",
  resourceMetadata: {
    resource: MCP_URL,
    authorization_servers: [
      "https://familjens-receptassistent.bjorn-sunesson.workers.dev",
    ],
  },
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  defaultHandler: GitHubHandler as any,
});
