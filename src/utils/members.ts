import type { Types } from 'mongoose';
import type { MemberDocument } from '../models/Member.js';
import type { SplitEntry } from '../models/Expense.js';
import { NotFoundError } from './errors.js';
import { roundMoney } from './money.js';

/**
 * Find a member by name (case-insensitive) from a list of members.
 */
export function findMemberByName(
  members: MemberDocument[],
  name: string,
): MemberDocument | undefined {
  return members.find((m) => m.name.toLowerCase() === name.toLowerCase());
}

/**
 * Find a member by name or throw NotFoundError.
 */
export function findMemberByNameOrThrow(members: MemberDocument[], name: string): MemberDocument {
  const member = findMemberByName(members, name);
  if (!member) throw new NotFoundError('Member', name);
  return member;
}

/**
 * Calculate equal splits with rounding adjustment on the last participant.
 */
export function calculateEqualSplits(
  amount: number,
  participantIds: Types.ObjectId[],
): SplitEntry[] {
  const share = roundMoney(amount / participantIds.length);
  const splits = participantIds.map((id) => ({ member: id, amount: share }));
  const total = splits.reduce((s, e) => s + e.amount, 0);
  const diff = roundMoney(amount - total);
  if (diff !== 0) {
    splits[splits.length - 1].amount += diff;
  }
  return splits;
}
