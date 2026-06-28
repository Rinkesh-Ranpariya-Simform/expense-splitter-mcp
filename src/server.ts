import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createContainer, Container } from './container.js';
import { registerGroupTools } from './tools/groupTools.js';
import { registerMemberTools } from './tools/memberTools.js';
import { registerExpenseTools } from './tools/expenseTools.js';
import { registerBalanceTools } from './tools/balanceTools.js';
import { registerSettlementTools } from './tools/settlementTools.js';
import { registerHistoryTools } from './tools/historyTools.js';
import { registerExportTools } from './tools/exportTools.js';

export function createMcpServer(): { server: McpServer; container: Container } {
  const container = createContainer();

  const mcpServer = new McpServer(
    {
      name: 'expense-splitter-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register tools
  registerGroupTools(mcpServer, container);
  registerMemberTools(mcpServer, container);
  registerExpenseTools(mcpServer, container);
  registerBalanceTools(mcpServer, container);
  registerSettlementTools(mcpServer, container);
  registerHistoryTools(mcpServer, container);
  registerExportTools(mcpServer, container);

  return { server: mcpServer, container };
}
