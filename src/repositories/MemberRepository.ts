import { MemberModel, MemberDocument } from '../models/Member.js';
import { BaseRepository } from './BaseRepository.js';
import { Types } from 'mongoose';

export class MemberRepository extends BaseRepository<MemberDocument> {
  constructor() {
    super(MemberModel);
  }

  async findByIds(ids: Types.ObjectId[]): Promise<MemberDocument[]> {
    return this.model.find({ _id: { $in: ids } }).exec();
  }
}
