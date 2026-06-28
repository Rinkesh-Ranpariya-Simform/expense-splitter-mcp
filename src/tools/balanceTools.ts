import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Container } from '../container.js';
import { GroupIdSchema } from '../schemas/groupSchemas.js';
import { successResponse } from '../utils/response.js';
import { wrapHandler } from '../utils/toolHandler.js';

export function registerBalanceTools(server: McpServer, container: Container): void {
  server.registerTool(
    'get_balances',
    {
      title: 'Get Balances',
      description:
        'Get current balances for all members in a group. Positive = owed money, negative = owes money.',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: GroupIdSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.balanceService.getBalances(args.groupId);
      return successResponse({ balances: result });
    }, container),
  );

  server.registerTool(
    'settle_debts',
    {
      title: 'Settle Debts',
      description:
        'Calculate simplified/optimized settlement transactions. Uses a greedy algorithm to minimize payments.',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: GroupIdSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.balanceService.settleDebts(args.groupId);
      return successResponse({ transactions: result });
    }, container),
  );
}
