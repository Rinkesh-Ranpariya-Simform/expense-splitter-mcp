import { Schema, model, Document, Types } from 'mongoose';

export interface GroupDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  currency: string;
  members: Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<GroupDocument>(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

GroupSchema.index({ name: 1 });
GroupSchema.index({ isDeleted: 1 });

export const GroupModel = model<GroupDocument>('Group', GroupSchema);
