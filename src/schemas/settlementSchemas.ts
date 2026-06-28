import { z } from 'zod';

export const RecordSettlementSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  from: z.string().min(1, 'Payer name is required'),
  to: z.string().min(1, 'Receiver name is required'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().max(200).optional(),
});

export type RecordSettlementInput = z.infer<typeof RecordSettlementSchema>;
