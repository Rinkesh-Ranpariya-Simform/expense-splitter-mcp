import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Container } from '../container.js';
import {
  AddMemberSchema,
  RemoveMemberSchema,
  ListMembersSchema,
} from '../schemas/memberSchemas.js';
import { successResponse } from '../utils/response.js';
import { wrapHandler } from '../utils/toolHandler.js';

export function registerMemberTools(server: McpServer, container: Container): void {
  server.registerTool(
    'add_member',
    {
      title: 'Add Member',
      description: 'Add a member to an expense group',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      inputSchema: AddMemberSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.groupService.addMember(args);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'remove_member',
    {
      title: 'Remove Member',
      description: 'Remove a member from a group (only if they have no expenses)',
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      inputSchema: RemoveMemberSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.groupService.removeMember(args);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'list_members',
    {
      title: 'List Members',
      description: 'List all members in a group',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: ListMembersSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.groupService.listMembers(args.groupId);
      return successResponse(result);
    }, container),
  );
}
