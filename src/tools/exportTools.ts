import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Container } from '../container.js';
import { ExportGroupSchema, ImportGroupSchema } from '../schemas/exportSchemas.js';
import { successResponse } from '../utils/response.js';
import { wrapHandler } from '../utils/toolHandler.js';

export function registerExportTools(server: McpServer, container: Container): void {
  server.registerTool(
    'export_group',
    {
      title: 'Export Group',
      description: 'Export all group data (members, expenses, settlements) in JSON or CSV format',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: ExportGroupSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.exportService.exportGroup(args.groupId, args.format, args.savePath);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'import_group',
    {
      title: 'Import Group',
      description: 'Import a group with members and optionally expenses from JSON data',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      inputSchema: ImportGroupSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.exportService.importGroup(args.data);
      return successResponse(result);
    }, container),
  );
}
