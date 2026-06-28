import { z } from 'zod';

export const AddExpenseSchema = z
  .object({
    groupId: z.string().min(1, 'Group ID is required'),
    description: z.string().min(1, 'Description is required').max(200),
    amount: z.number().positive('Amount must be positive'),
    paidBy: z.string().min(1, 'Payer name is required'),
    participants: z.array(z.string().min(1)).min(1, 'At least one participant required'),
    splitType: z.enum(['equal', 'exact', 'percentage']),
    splits: z.record(z.string(), z.number()).optional(),
  })
  .refine(
    (data) => {
      if (data.splitType === 'exact' || data.splitType === 'percentage') {
        return data.splits !== undefined && Object.keys(data.splits).length > 0;
      }
      return true;
    },
    { message: 'Splits are required for exact and percentage split types' },
  )
  .refine(
    (data) => {
      if (data.splitType === 'exact' && data.splits) {
        const total = Object.values(data.splits).reduce((sum, v) => sum + v, 0);
        return Math.abs(total - data.amount) < 0.01;
      }
      return true;
    },
    { message: 'Exact splits must sum to the total amount' },
  )
  .refine(
    (data) => {
      if (data.splitType === 'percentage' && data.splits) {
        const total = Object.values(data.splits).reduce((sum, v) => sum + v, 0);
        return Math.abs(total - 100) < 0.01;
      }
      return true;
    },
    { message: 'Percentage splits must sum to 100' },
  );

export const UpdateExpenseSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  expenseId: z.string().min(1, 'Expense ID is required'),
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  paidBy: z.string().min(1).optional(),
  participants: z.array(z.string().min(1)).min(1).optional(),
  splitType: z.enum(['equal', 'exact', 'percentage']).optional(),
  splits: z.record(z.string(), z.number()).optional(),
});

export const DeleteExpenseSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  expenseId: z.string().min(1, 'Expense ID is required'),
});

export const SearchExpensesSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  description: z.string().optional(),
  paidBy: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  participant: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AddExpenseInput = z.infer<typeof AddExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type DeleteExpenseInput = z.infer<typeof DeleteExpenseSchema>;
export type SearchExpensesInput = z.infer<typeof SearchExpensesSchema>;
