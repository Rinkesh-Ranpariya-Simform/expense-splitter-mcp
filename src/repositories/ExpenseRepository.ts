import { ExpenseModel, ExpenseDocument } from '../models/Expense.js';
import { BaseRepository } from './BaseRepository.js';
import { Types } from 'mongoose';
import type { SearchFilters } from '../types/index.js';
import { escapeRegExp } from '../utils/regex.js';

export class ExpenseRepository extends BaseRepository<ExpenseDocument> {
  constructor() {
    super(ExpenseModel);
  }

  async findByGroupId(groupId: string): Promise<ExpenseDocument[]> {
    return this.model.find({ groupId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async softDelete(expenseId: string): Promise<ExpenseDocument | null> {
    return this.model.findByIdAndUpdate(expenseId, { isDeleted: true }, { new: true }).exec();
  }

  async searchExpenses(groupId: string, filters: SearchFilters): Promise<ExpenseDocument[]> {
    const query: Record<string, any> = { groupId, isDeleted: false };

    if (filters.description) {
      query.description = { $regex: escapeRegExp(filters.description), $options: 'i' };
    }
    if (filters.paidBy) {
      query.paidBy = new Types.ObjectId(filters.paidBy);
    }
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      query.amount = {};
      if (filters.minAmount !== undefined) query.amount.$gte = filters.minAmount;
      if (filters.maxAmount !== undefined) query.amount.$lte = filters.maxAmount;
    }
    if (filters.participant) {
      query.participants = new Types.ObjectId(filters.participant);
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    return this.model.find(query).sort({ createdAt: -1 }).exec();
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    await this.model.updateMany({ groupId }, { isDeleted: true }).exec();
  }
}
