import { z } from 'zod';

export const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  currency: z.string().length(3, 'Currency must be a 3-letter code').toUpperCase().optional(),
});

export const GroupIdSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
});

export const RenameGroupSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  name: z.string().min(1, 'New name is required').max(100),
});

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type GroupIdInput = z.infer<typeof GroupIdSchema>;
export type RenameGroupInput = z.infer<typeof RenameGroupSchema>;
