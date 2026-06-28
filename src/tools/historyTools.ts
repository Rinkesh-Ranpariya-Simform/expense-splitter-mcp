import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Container } from '../container.js';
import { GroupIdSchema } from '../schemas/groupSchemas.js';
import { successResponse } from '../utils/response.js';
import { wrapHandler } from '../utils/toolHandler.js';

export function registerHistoryTools(server: McpServer, container: Container): void {
  server.registerTool(
    'get_history',
    {
      title: 'Get History',
      description:
        'Get the complete history of expenses and settlements for a group, ordered chronologically',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: GroupIdSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.historyService.getHistory(args.groupId);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'get_group_summary',
    {
      title: 'Get Group Summary',
      description:
        'Get a summary of a group including total expenses, member count, largest expense, top spender, and outstanding balance',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: GroupIdSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.historyService.getGroupSummary(args.groupId);
      return successResponse(result);
    }, container),
  );
}
