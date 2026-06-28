import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { SettlementRepository } from '../repositories/SettlementRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { MemberRepository } from '../repositories/MemberRepository.js';
import { BalanceService } from './BalanceService.js';
import { NotFoundError } from '../utils/errors.js';
import type { HistoryEntry, GroupSummary } from '../types/index.js';
import { roundMoney } from '../utils/money.js';

export class HistoryService {
  constructor(
    private readonly expenseRepo: ExpenseRepository,
    private readonly settlementRepo: SettlementRepository,
    private readonly groupRepo: GroupRepository,
    private readonly memberRepo: MemberRepository,
    private readonly balanceService: BalanceService,
  ) {}

  async getHistory(groupId: string): Promise<HistoryEntry[]> {
    const group = await this.groupRepo.findById(groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', groupId);

    const members = await this.memberRepo.findByIds(group.members);
    const memberMap = new Map(members.map((m) => [m._id.toString(), m]));
    const expenses = await this.expenseRepo.findByGroupId(groupId);
    const settlements = await this.settlementRepo.findByGroupId(groupId);

    const history: HistoryEntry[] = [];

    for (const expense of expenses) {
      const payer = memberMap.get(expense.paidBy.toString());
      history.push({
        type: 'expense',
        id: expense._id.toString(),
        description: expense.description,
        amount: expense.amount,
        paidBy: payer?.name || expense.paidBy.toString(),
        createdAt: expense.createdAt,
      });
    }

    for (const settlement of settlements) {
      const from = memberMap.get(settlement.from.toString());
      const to = memberMap.get(settlement.to.toString());
      history.push({
        type: 'settlement',
        id: settlement._id.toString(),
        amount: settlement.amount,
        from: from?.name || settlement.from.toString(),
        to: to?.name || settlement.to.toString(),
        createdAt: settlement.createdAt,
      });
    }

    // Sort chronologically (oldest first)
    history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return history;
  }

  async getGroupSummary(groupId: string): Promise<GroupSummary> {
    const group = await this.groupRepo.findById(groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', groupId);

    const members = await this.memberRepo.findByIds(group.members);
    const memberMap = new Map(members.map((m) => [m._id.toString(), m]));
    const expenses = await this.expenseRepo.findByGroupId(groupId);

    const totalSpent = roundMoney(expenses.reduce((sum, e) => sum + e.amount, 0));

    let largestExpense: { description: string; amount: number } | null = null;
    const spenderTotals = new Map<string, number>();

    for (const expense of expenses) {
      if (!largestExpense || expense.amount > largestExpense.amount) {
        largestExpense = { description: expense.description, amount: expense.amount };
      }
      const payerId = expense.paidBy.toString();
      const current = spenderTotals.get(payerId) || 0;
      spenderTotals.set(payerId, current + expense.amount);
    }

    let topSpender: string | null = null;
    let maxSpent = 0;
    for (const [memberId, total] of spenderTotals) {
      if (total > maxSpent) {
        maxSpent = total;
        const member = memberMap.get(memberId);
        topSpender = member?.name || memberId;
      }
    }

    // Calculate outstanding amount (sum of positive balances)
    const balances = await this.balanceService.getBalances(groupId);
    const outstanding = roundMoney(
      balances.filter((b) => b.balance > 0).reduce((sum, b) => sum + b.balance, 0),
    );

    return {
      group: group.name,
      members: group.members.length,
      expenses: expenses.length,
      totalSpent,
      largestExpense,
      topSpender,
      outstanding,
    };
  }
}
