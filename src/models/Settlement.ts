import { Schema, model, Document, Types } from 'mongoose';

export interface SettlementDocument extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  amount: number;
  note?: string;
  isDeleted: boolean;
  createdAt: Date;
}

const SettlementSchema = new Schema<SettlementDocument>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    from: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

SettlementSchema.index({ groupId: 1, createdAt: -1 });
SettlementSchema.index({ groupId: 1, isDeleted: 1 });
SettlementSchema.index({ from: 1, groupId: 1 });
SettlementSchema.index({ to: 1, groupId: 1 });

export const SettlementModel = model<SettlementDocument>('Settlement', SettlementSchema);
