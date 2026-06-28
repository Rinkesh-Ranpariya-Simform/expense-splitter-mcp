import { GroupRepository } from '../repositories/GroupRepository.js';
import { MemberRepository } from '../repositories/MemberRepository.js';
import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { SettlementRepository } from '../repositories/SettlementRepository.js';
import { NotFoundError, DuplicateError, ValidationError } from '../utils/errors.js';
import { findMemberByName } from '../utils/members.js';
import type { CreateGroupInput, GroupIdInput, RenameGroupInput } from '../schemas/groupSchemas.js';
import type { AddMemberInput, RemoveMemberInput } from '../schemas/memberSchemas.js';
import type { MemberDocument } from '../models/Member.js';

export class GroupService {
  constructor(
    private readonly groupRepo: GroupRepository,
    private readonly memberRepo: MemberRepository,
    private readonly expenseRepo: ExpenseRepository,
    private readonly settlementRepo: SettlementRepository,
  ) {}

  async createGroup(input: CreateGroupInput) {
    const group = await this.groupRepo.create({
      name: input.name,
      currency: input.currency,
      members: [],
      isDeleted: false,
    });
    return { id: group._id.toString(), name: group.name, currency: group.currency };
  }

  async listGroups() {
    const groups = await this.groupRepo.findAllActive();
    return groups.map((g) => ({
      id: g._id.toString(),
      name: g.name,
      memberCount: g.members.length,
      createdAt: g.createdAt,
    }));
  }

  async getGroup(input: GroupIdInput) {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', input.groupId);

    const members = await this.memberRepo.findByIds(group.members);
    return {
      id: group._id.toString(),
      name: group.name,
      currency: group.currency,
      members: members.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        nickname: m.nickname,
      })),
      createdAt: group.createdAt,
    };
  }

  async renameGroup(input: RenameGroupInput) {
    const group = await this.groupRepo.updateById(input.groupId, { name: input.name });
    if (!group) throw new NotFoundError('Group', input.groupId);
    return { id: group._id.toString(), name: group.name };
  }

  async deleteGroup(input: GroupIdInput) {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', input.groupId);

    await this.expenseRepo.deleteByGroupId(input.groupId);
    await this.settlementRepo.deleteByGroupId(input.groupId);
    await this.groupRepo.softDelete(input.groupId);

    return { deleted: true, name: group.name };
  }

  async addMember(input: AddMemberInput) {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', input.groupId);

    // Check for duplicate name within the group
    const existingMembers = await this.memberRepo.findByIds(group.members);
    const duplicate = existingMembers.find(
      (m) => m.name.toLowerCase() === input.name.toLowerCase(),
    );
    if (duplicate) throw new DuplicateError('Member', input.name);

    const member = await this.memberRepo.create({
      name: input.name,
      email: input.email,
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
    });

    // Add member reference to group
    await this.groupRepo.addMember(input.groupId, member._id);
    return { id: member._id.toString(), name: member.name, groupId: input.groupId };
  }

  async removeMember(input: RemoveMemberInput) {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', input.groupId);

    const members = await this.memberRepo.findByIds(group.members);
    const member = findMemberByName(members, input.memberName);
    if (!member) throw new NotFoundError('Member', input.memberName);

    // Check if member has expenses
    const expenses = await this.expenseRepo.findByGroupId(input.groupId);
    const hasExpenses = expenses.some(
      (e) =>
        e.paidBy.toString() === member._id.toString() ||
        e.participants.some((p) => p.toString() === member._id.toString()),
    );
    if (hasExpenses) {
      throw new ValidationError(
        `Cannot remove '${input.memberName}': member has associated expenses. Delete expenses first.`,
      );
    }

    // Check if member has settlements
    const settlements = await this.settlementRepo.findByGroupId(input.groupId);
    const hasSettlements = settlements.some(
      (s) =>
        s.from.toString() === member._id.toString() || s.to.toString() === member._id.toString(),
    );
    if (hasSettlements) {
      throw new ValidationError(
        `Cannot remove '${input.memberName}': member has associated settlements. Delete settlements first.`,
      );
    }

    await this.groupRepo.removeMember(input.groupId, member._id);
    return { removed: true, name: member.name };
  }

  async listMembers(groupId: string) {
    const group = await this.groupRepo.findById(groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', groupId);

    const members = await this.memberRepo.findByIds(group.members);
    return {
      groupId: group._id.toString(),
      groupName: group.name,
      members: members.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        nickname: m.nickname,
      })),
    };
  }

  async getGroupMembers(groupId: string): Promise<MemberDocument[]> {
    const group = await this.groupRepo.findById(groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', groupId);
    return this.memberRepo.findByIds(group.members);
  }
}
