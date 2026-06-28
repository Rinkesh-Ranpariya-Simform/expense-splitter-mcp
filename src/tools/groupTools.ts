import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Container } from '../container.js';
import { CreateGroupSchema, GroupIdSchema, RenameGroupSchema } from '../schemas/groupSchemas.js';
import { successResponse } from '../utils/response.js';
import { wrapHandler } from '../utils/toolHandler.js';

export function registerGroupTools(server: McpServer, container: Container): void {
  server.registerTool(
    'create_group',
    {
      title: 'Create Group',
      description: 'Create a new expense group (e.g., for a trip, flatmates, or event)',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      inputSchema: CreateGroupSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.groupService.createGroup(args);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'list_groups',
    {
      title: 'List Groups',
      description: 'List all expense groups',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    wrapHandler(async (_args, c) => {
      const result = await c.groupService.listGroups();
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'get_group',
    {
      title: 'Get Group',
      description: 'Get details of a specific group including its members',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: GroupIdSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.groupService.getGroup(args);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'rename_group',
    {
      title: 'Rename Group',
      description: 'Rename an existing expense group',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: RenameGroupSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.groupService.renameGroup(args);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'delete_group',
    {
      title: 'Delete Group',
      description: 'Delete an expense group and all its expenses and settlements',
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      inputSchema: GroupIdSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.groupService.deleteGroup(args);
      return successResponse(result);
    }, container),
  );
}
