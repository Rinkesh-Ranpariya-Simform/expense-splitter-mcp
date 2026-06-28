import { ZodError } from 'zod';
import type { Container } from '../container.js';
import type { ToolResponse } from '../types/index.js';
import { errorResponse } from './response.js';
import { AppError } from './errors.js';

export function wrapHandler(
  fn: (args: any, container: Container) => Promise<ToolResponse>,
  container: Container,
) {
  return async (args: any): Promise<ToolResponse> => {
    try {
      return await fn(args, container);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
        return errorResponse(`Validation error: ${messages.join('; ')}`);
      }
      if (error instanceof AppError) {
        return errorResponse(error.message);
      }
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('[MCP] Tool error:', error);
      return errorResponse(message);
    }
  };
}
