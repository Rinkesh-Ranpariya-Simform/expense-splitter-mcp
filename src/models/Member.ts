import { Schema, model, Document, Types } from 'mongoose';

export interface MemberDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  nickname?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<MemberDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    nickname: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

MemberSchema.index({ email: 1 }, { sparse: true });

export const MemberModel = model<MemberDocument>('Member', MemberSchema);
