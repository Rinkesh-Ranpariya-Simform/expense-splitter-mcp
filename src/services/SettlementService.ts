import { SettlementRepository } from '../repositories/SettlementRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { MemberRepository } from '../repositories/MemberRepository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { findMemberByNameOrThrow } from '../utils/members.js';
import type { RecordSettlementInput } from '../schemas/settlementSchemas.js';

export class SettlementService {
  constructor(
    private readonly settlementRepo: SettlementRepository,
    private readonly groupRepo: GroupRepository,
    private readonly memberRepo: MemberRepository,
  ) {}

  async recordSettlement(input: RecordSettlementInput) {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', input.groupId);

    const members = await this.memberRepo.findByIds(group.members);

    const fromMember = findMemberByNameOrThrow(members, input.from);
    const toMember = findMemberByNameOrThrow(members, input.to);

    if (fromMember._id.toString() === toMember._id.toString()) {
      throw new ValidationError(
        'Cannot record settlement where payer and receiver are the same member',
      );
    }

    const settlement = await this.settlementRepo.create({
      groupId: group._id,
      from: fromMember._id,
      to: toMember._id,
      amount: input.amount,
      note: input.note,
      isDeleted: false,
    });

    return {
      id: settlement._id.toString(),
      from: fromMember.name,
      to: toMember.name,
      amount: settlement.amount,
      note: settlement.note,
      createdAt: settlement.createdAt,
    };
  }
}
