import { z } from 'zod';

export const AddMemberSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  name: z.string().min(1, 'Member name is required').max(50).trim(),
  email: z.string().email().toLowerCase().optional(),
  nickname: z.string().max(30).optional(),
  avatarUrl: z.string().url().optional(),
});

export const RemoveMemberSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  memberName: z.string().min(1, 'Member name is required'),
});

export const ListMembersSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;
export type RemoveMemberInput = z.infer<typeof RemoveMemberSchema>;
export type ListMembersInput = z.infer<typeof ListMembersSchema>;
