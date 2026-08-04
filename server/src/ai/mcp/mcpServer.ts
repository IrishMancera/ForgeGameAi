import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOL_POLICIES, validateMCPToolCall } from './mcpToolRegistry.js';
import { getDatabase } from '../../models/schema.js';
import { toolExecutor } from '../toolExecutor.js';

export function createGameForgeMCPServer() {
  const server = new Server(
    {
      name: 'GameForgeAI-MCP-Server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // 1. List Available Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = Object.values(TOOL_POLICIES).map((policy) => ({
      name: policy.name,
      description: `GameForge domain capability [Category: ${policy.auditCategory}, MinRole: ${policy.requiredPermission}]`,
      inputSchema: {
        type: 'object',
        properties: (policy.inputSchema as any)._def?.shape?.() || {},
      },
    }));

    return { tools };
  });

  // 2. Call Tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const projectId = (args as any)?.projectId || 'default-project';
    const userRole = (args as any)?.userRole || 'editor';
    const environment = (args as any)?.environment || 'sandbox';

    try {
      const { policy, parsedInputs } = validateMCPToolCall(name, args, userRole, environment);

      // Execute domain tool using toolExecutor
      const execResult = await toolExecutor.executeTool(
        name,
        parsedInputs,
        projectId,
        (args as any)?.workspace
      );

      // Audit log entry in database
      try {
        const db = getDatabase();
        await db.run(
          `INSERT INTO auditLogs (id, userId, projectId, action, resource, details)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            (args as any)?.userId || 'system',
            projectId,
            `MCP_TOOL_EXECUTE_${policy.auditCategory}`,
            name,
            JSON.stringify({ inputs: parsedInputs, success: execResult.success }),
          ]
        );
      } catch {
        // Silently skip audit insert failure
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(execResult.output || execResult),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `MCP Tool Execution Failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  });

  // 3. List Project Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'gameforge://projects/snapshot',
          name: 'Active Project Blueprint & Economy Snapshot',
          mimeType: 'application/json',
        },
        {
          uri: 'gameforge://knowledge/documents',
          name: 'Knowledge Base Approved Documents',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // 4. Read Resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const db = getDatabase();

    if (uri === 'gameforge://projects/snapshot') {
      const project = await db.get('SELECT * FROM projects LIMIT 1');
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(project || { status: 'empty' }),
          },
        ],
      };
    }

    if (uri === 'gameforge://knowledge/documents') {
      const docs = await db.all('SELECT id, title, documentType, version, status FROM knowledge_documents LIMIT 50');
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(docs),
          },
        ],
      };
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  return server;
}
