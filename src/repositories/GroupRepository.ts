import { GroupModel, GroupDocument } from '../models/Group.js';
import { BaseRepository } from './BaseRepository.js';
import { Types } from 'mongoose';

export class GroupRepository extends BaseRepository<GroupDocument> {
  constructor() {
    super(GroupModel);
  }

  async findAllActive(): Promise<GroupDocument[]> {
    return this.model.find({ isDeleted: false }).exec();
  }

  async addMember(groupId: string, memberId: Types.ObjectId): Promise<GroupDocument | null> {
    return this.model
      .findByIdAndUpdate(groupId, { $push: { members: memberId } }, { new: true })
      .exec();
  }

  async removeMember(groupId: string, memberId: Types.ObjectId): Promise<GroupDocument | null> {
    return this.model
      .findByIdAndUpdate(groupId, { $pull: { members: memberId } }, { new: true })
      .exec();
  }

  async softDelete(groupId: string): Promise<GroupDocument | null> {
    return this.model.findByIdAndUpdate(groupId, { isDeleted: true }, { new: true }).exec();
  }
}
