import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createMcpServer } from './server.js';

dotenv.config();
const TRANSPORT = process.env.TRANSPORT || 'stdio';
const PORT = parseInt(process.env.PORT || '3001', 10);

async function startStdio(): Promise<void> {
  const { server: mcpServer } = createMcpServer();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('[MCP] Expense Splitter MCP Server running on stdio');
}

function startHttp(): void {
  const app = express();
  app.use(express.json());

  const sessions = new Map<string, StreamableHTTPServerTransport>();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/mcp', async (req, res) => {
    const sessionId = req.get('mcp-session-id');
    let transport: StreamableHTTPServerTransport;

    if (sessionId && sessions.has(sessionId)) {
      transport = sessions.get(sessionId)!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) sessions.delete(sid);
      };

      const { server: mcpServer } = createMcpServer();
      await mcpServer.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID' },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.error(`[MCP] Expense Splitter MCP Server running on http://0.0.0.0:${PORT}/mcp`);
  });
}

async function shutdown(): Promise<void> {
  console.error('[MCP] Shutting down...');
  await disconnectDatabase();
  process.exit(0);
}

async function main(): Promise<void> {
  await connectDatabase();

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  if (TRANSPORT === 'stdio') {
    await startStdio();
  } else if (TRANSPORT === 'http') {
    startHttp();
  } else {
    console.error(`[MCP] Unknown transport: ${TRANSPORT}. Use "stdio" or "http".`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
