import { z } from 'zod';

export const ExportGroupSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  format: z.enum(['json', 'csv']).default('json'),
  savePath: z.string().optional(),
});

export const ImportGroupSchema = z.object({
  data: z.object({
    name: z.string().min(1),
    members: z.array(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        nickname: z.string().optional(),
      }),
    ),
    expenses: z
      .array(
        z.object({
          description: z.string().min(1),
          amount: z.number().positive(),
          paidBy: z.string().min(1),
          participants: z.array(z.string().min(1)),
          splitType: z.enum(['equal', 'exact', 'percentage']),
          splits: z.record(z.string(), z.number()).optional(),
        }),
      )
      .optional(),
  }),
});

export type ExportGroupInput = z.infer<typeof ExportGroupSchema>;
export type ImportGroupInput = z.infer<typeof ImportGroupSchema>;
