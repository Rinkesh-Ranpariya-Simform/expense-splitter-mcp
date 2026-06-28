import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { SettlementRepository } from '../repositories/SettlementRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { MemberRepository } from '../repositories/MemberRepository.js';
import { NotFoundError } from '../utils/errors.js';
import { roundMoney } from '../utils/money.js';
import { simplifyDebts } from '../algorithms/simplifyDebts.js';
import type { BalanceEntry, DebtTransaction } from '../types/index.js';

export class BalanceService {
  constructor(
    private readonly expenseRepo: ExpenseRepository,
    private readonly settlementRepo: SettlementRepository,
    private readonly groupRepo: GroupRepository,
    private readonly memberRepo: MemberRepository,
  ) {}

  async getBalances(groupId: string): Promise<BalanceEntry[]> {
    const group = await this.groupRepo.findById(groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', groupId);

    const members = await this.memberRepo.findByIds(group.members);
    const balanceMap = new Map<string, number>();

    // Initialize all members with 0
    for (const member of members) {
      balanceMap.set(member._id.toString(), 0);
    }

    // Process expenses
    const expenses = await this.expenseRepo.findByGroupId(groupId);
    for (const expense of expenses) {
      // Payer gets credit for the full amount
      const payerId = expense.paidBy.toString();
      const currentPayer = balanceMap.get(payerId) || 0;
      balanceMap.set(payerId, currentPayer + expense.amount);

      // Each participant owes their share (from splits array)
      for (const split of expense.splits) {
        const memberId = split.member.toString();
        const current = balanceMap.get(memberId) || 0;
        balanceMap.set(memberId, current - split.amount);
      }
    }

    // Process settlements
    const settlements = await this.settlementRepo.findByGroupId(groupId);
    for (const settlement of settlements) {
      // 'from' paid money -> gets credit
      const fromId = settlement.from.toString();
      const fromBalance = balanceMap.get(fromId) || 0;
      balanceMap.set(fromId, fromBalance + settlement.amount);

      // 'to' received money -> gets debit
      const toId = settlement.to.toString();
      const toBalance = balanceMap.get(toId) || 0;
      balanceMap.set(toId, toBalance - settlement.amount);
    }

    // Build result with member names
    const result: BalanceEntry[] = [];
    for (const member of members) {
      result.push({
        memberId: member._id.toString(),
        memberName: member.name,
        balance: roundMoney(balanceMap.get(member._id.toString()) || 0),
      });
    }

    return result;
  }

  async settleDebts(groupId: string): Promise<DebtTransaction[]> {
    const balances = await this.getBalances(groupId);

    const balanceMap = new Map<string, number>();
    const nameMap = new Map<string, string>();

    for (const entry of balances) {
      balanceMap.set(entry.memberId, entry.balance);
      nameMap.set(entry.memberId, entry.memberName);
    }

    return simplifyDebts(balanceMap, nameMap);
  }
}
