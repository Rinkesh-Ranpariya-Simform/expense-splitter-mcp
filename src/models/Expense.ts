import { Schema, model, Document, Types } from 'mongoose';
import type { SplitType } from '../types/index.js';

export interface SplitEntry {
  member: Types.ObjectId;
  amount: number;
}

export interface ExpenseDocument extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  description: string;
  amount: number;
  paidBy: Types.ObjectId;
  participants: Types.ObjectId[];
  splitType: SplitType;
  splits: SplitEntry[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SplitEntrySchema = new Schema<SplitEntry>(
  {
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true },
  },
  { _id: false },
);

const ExpenseSchema = new Schema<ExpenseDocument>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paidBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
    splitType: { type: String, enum: ['equal', 'exact', 'percentage'], required: true },
    splits: { type: [SplitEntrySchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ExpenseSchema.index({ groupId: 1, isDeleted: 1 });
ExpenseSchema.index({ groupId: 1, createdAt: -1 });
ExpenseSchema.index({ groupId: 1, paidBy: 1 });
ExpenseSchema.index({ groupId: 1, participants: 1 });

export const ExpenseModel = model<ExpenseDocument>('Expense', ExpenseSchema);
