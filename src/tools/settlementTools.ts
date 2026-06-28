import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Container } from '../container.js';
import { RecordSettlementSchema } from '../schemas/settlementSchemas.js';
import { successResponse } from '../utils/response.js';
import { wrapHandler } from '../utils/toolHandler.js';

export function registerSettlementTools(server: McpServer, container: Container): void {
  server.registerTool(
    'record_settlement',
    {
      title: 'Record Settlement',
      description:
        'Record a payment/settlement between two members (e.g., "Bob paid Alice ₹1,800")',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      inputSchema: RecordSettlementSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.settlementService.recordSettlement(args);
      return successResponse(result);
    }, container),
  );
}
