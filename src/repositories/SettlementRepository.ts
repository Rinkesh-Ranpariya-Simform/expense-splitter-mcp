import { SettlementModel, SettlementDocument } from '../models/Settlement.js';
import { BaseRepository } from './BaseRepository.js';

export class SettlementRepository extends BaseRepository<SettlementDocument> {
  constructor() {
    super(SettlementModel);
  }

  async findByGroupId(groupId: string): Promise<SettlementDocument[]> {
    return this.model.find({ groupId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async softDelete(settlementId: string): Promise<SettlementDocument | null> {
    return this.model.findByIdAndUpdate(settlementId, { isDeleted: true }, { new: true }).exec();
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    await this.model.updateMany({ groupId }, { isDeleted: true }).exec();
  }
}
