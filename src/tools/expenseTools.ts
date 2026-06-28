import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Container } from '../container.js';
import {
  AddExpenseSchema,
  UpdateExpenseSchema,
  DeleteExpenseSchema,
  SearchExpensesSchema,
} from '../schemas/expenseSchemas.js';
import { successResponse } from '../utils/response.js';
import { wrapHandler } from '../utils/toolHandler.js';

export function registerExpenseTools(server: McpServer, container: Container): void {
  server.registerTool(
    'add_expense',
    {
      title: 'Add Expense',
      description: 'Add an expense to a group. Supports equal, exact, and percentage split types.',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      inputSchema: AddExpenseSchema,
    },
    wrapHandler(async (args, c) => {
      const input = AddExpenseSchema.parse(args);
      const result = await c.expenseService.addExpense(input);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'update_expense',
    {
      title: 'Update Expense',
      description: 'Update an existing expense',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: UpdateExpenseSchema,
    },
    wrapHandler(async (args, c) => {
      const input = UpdateExpenseSchema.parse(args);
      const result = await c.expenseService.updateExpense(input);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'delete_expense',
    {
      title: 'Delete Expense',
      description: 'Delete an expense from a group',
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      inputSchema: DeleteExpenseSchema,
    },
    wrapHandler(async (args, c) => {
      const result = await c.expenseService.deleteExpense(args.groupId, args.expenseId);
      return successResponse(result);
    }, container),
  );

  server.registerTool(
    'search_expenses',
    {
      title: 'Search Expenses',
      description:
        'Search expenses with filters like description, payer, date range, and amount range',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: SearchExpensesSchema,
    },
    wrapHandler(async (args, c) => {
      const { groupId, ...filters } = args;
      const result = await c.expenseService.searchExpenses(groupId, filters);
      return successResponse(result);
    }, container),
  );
}
