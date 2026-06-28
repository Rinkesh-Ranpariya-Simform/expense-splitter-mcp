import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { GroupService } from './GroupService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { roundMoney } from '../utils/money.js';
import { findMemberByNameOrThrow, calculateEqualSplits } from '../utils/members.js';
import type { AddExpenseInput, UpdateExpenseInput } from '../schemas/expenseSchemas.js';
import type { SearchFilters } from '../types/index.js';
import type { SplitEntry } from '../models/Expense.js';
import type { MemberDocument } from '../models/Member.js';
import { Types } from 'mongoose';

export class ExpenseService {
  constructor(
    private readonly expenseRepo: ExpenseRepository,
    private readonly groupService: GroupService,
  ) {}

  async addExpense(input: AddExpenseInput) {
    const members = await this.groupService.getGroupMembers(input.groupId);

    const payer = findMemberByNameOrThrow(members, input.paidBy);

    const participantIds: Types.ObjectId[] = input.participants.map(
      (name) => findMemberByNameOrThrow(members, name)._id,
    );

    let splits: SplitEntry[] = [];

    if (input.splitType === 'equal') {
      splits = calculateEqualSplits(input.amount, participantIds);
    } else if (input.splitType === 'exact') {
      for (const [name, amount] of Object.entries(input.splits || {})) {
        const member = findMemberByNameOrThrow(members, name);
        splits.push({ member: member._id, amount });
      }
    } else if (input.splitType === 'percentage') {
      for (const [name, pct] of Object.entries(input.splits || {})) {
        const member = findMemberByNameOrThrow(members, name);
        splits.push({ member: member._id, amount: roundMoney((pct / 100) * input.amount) });
      }
    }

    const expense = await this.expenseRepo.create({
      groupId: new Types.ObjectId(input.groupId),
      description: input.description,
      amount: input.amount,
      paidBy: payer._id,
      participants: participantIds,
      splitType: input.splitType,
      splits,
      isDeleted: false,
    });

    const namedSplits: Record<string, number> = {};
    for (const entry of splits) {
      const m = members.find((mem) => mem._id.toString() === entry.member.toString());
      namedSplits[m?.name || entry.member.toString()] = entry.amount;
    }

    return {
      id: expense._id.toString(),
      description: expense.description,
      amount: expense.amount,
      paidBy: payer.name,
      splitType: expense.splitType,
      splits: namedSplits,
    };
  }

  async updateExpense(input: UpdateExpenseInput) {
    const members = await this.groupService.getGroupMembers(input.groupId);

    const expense = await this.expenseRepo.findById(input.expenseId);
    if (!expense || expense.isDeleted) throw new NotFoundError('Expense', input.expenseId);
    if (expense.groupId.toString() !== input.groupId) {
      throw new ValidationError('Expense does not belong to this group');
    }

    const updateData: Record<string, unknown> = {};

    if (input.description) updateData.description = input.description;
    if (input.amount) updateData.amount = input.amount;

    if (input.paidBy) {
      const payer = findMemberByNameOrThrow(members, input.paidBy);
      updateData.paidBy = payer._id;
    }

    if (input.participants) {
      const ids: Types.ObjectId[] = input.participants.map(
        (name) => findMemberByNameOrThrow(members, name)._id,
      );
      updateData.participants = ids;
    }

    if (input.splitType) updateData.splitType = input.splitType;

    if (input.splits) {
      const splits: SplitEntry[] = [];
      for (const [name, amount] of Object.entries(input.splits)) {
        const member = findMemberByNameOrThrow(members, name);
        splits.push({ member: member._id, amount });
      }
      updateData.splits = splits;
    }

    const updated = await this.expenseRepo.updateById(input.expenseId, updateData);
    if (!updated) throw new NotFoundError('Expense', input.expenseId);

    return {
      id: updated._id.toString(),
      description: updated.description,
      amount: updated.amount,
      updated: true,
    };
  }

  async deleteExpense(groupId: string, expenseId: string) {
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense || expense.isDeleted) throw new NotFoundError('Expense', expenseId);
    if (expense.groupId.toString() !== groupId) {
      throw new ValidationError('Expense does not belong to this group');
    }

    await this.expenseRepo.softDelete(expenseId);
    return { deleted: true, description: expense.description };
  }

  async searchExpenses(groupId: string, filters: SearchFilters) {
    const members = await this.groupService.getGroupMembers(groupId);

    const resolvedFilters = { ...filters };
    if (filters.paidBy) {
      const member = findMemberByNameOrThrow(members, filters.paidBy);
      resolvedFilters.paidBy = member._id.toString();
    }
    if (filters.participant) {
      const member = findMemberByNameOrThrow(members, filters.participant);
      resolvedFilters.participant = member._id.toString();
    }

    const expenses = await this.expenseRepo.searchExpenses(groupId, resolvedFilters);

    return expenses.map((e) => {
      const payerMember = members.find((m) => m._id.toString() === e.paidBy.toString());
      return {
        id: e._id.toString(),
        description: e.description,
        amount: e.amount,
        paidBy: payerMember?.name || e.paidBy.toString(),
        splitType: e.splitType,
        createdAt: e.createdAt,
      };
    });
  }
}
