import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { MemberRepository } from '../repositories/MemberRepository.js';
import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { SettlementRepository } from '../repositories/SettlementRepository.js';
import { NotFoundError } from '../utils/errors.js';
import { roundMoney } from '../utils/money.js';
import { findMemberByName, calculateEqualSplits } from '../utils/members.js';
import type { MemberDocument } from '../models/Member.js';
import type { ExpenseDocument, SplitEntry } from '../models/Expense.js';
import type { SettlementDocument } from '../models/Settlement.js';

export class ExportService {
  constructor(
    private readonly groupRepo: GroupRepository,
    private readonly memberRepo: MemberRepository,
    private readonly expenseRepo: ExpenseRepository,
    private readonly settlementRepo: SettlementRepository,
  ) {}

  async exportGroup(groupId: string, format: 'json' | 'csv', savePath?: string) {
    const group = await this.groupRepo.findById(groupId);
    if (!group || group.isDeleted) throw new NotFoundError('Group', groupId);

    const members = await this.memberRepo.findByIds(group.members);
    const memberMap = new Map(members.map((m) => [m._id.toString(), m]));
    const expenses = await this.expenseRepo.findByGroupId(groupId);
    const settlements = await this.settlementRepo.findByGroupId(groupId);

    if (format === 'csv') {
      const csv = this.toCsv(memberMap, expenses, settlements);
      if (savePath) {
        const filePath = resolve(savePath);
        await writeFile(filePath, csv, 'utf-8');
        return { savedTo: filePath, message: `CSV exported to ${filePath}` };
      }
      return csv;
    }

    const jsonResult = {
      group: {
        name: group.name,
        currency: group.currency,
        members: members.map((m) => ({
          name: m.name,
          email: m.email,
          nickname: m.nickname,
        })),
      },
      expenses: expenses.map((e) => {
        const payer = memberMap.get(e.paidBy.toString());
        const splits: Record<string, number> = {};
        for (const entry of e.splits) {
          const member = memberMap.get(entry.member.toString());
          splits[member?.name || entry.member.toString()] = entry.amount;
        }
        return {
          description: e.description,
          amount: e.amount,
          paidBy: payer?.name || e.paidBy.toString(),
          participants: e.participants.map((pid) => {
            const m = memberMap.get(pid.toString());
            return m?.name || pid.toString();
          }),
          splitType: e.splitType,
          splits,
          createdAt: e.createdAt,
        };
      }),
      settlements: settlements.map((s) => {
        const from = memberMap.get(s.from.toString());
        const to = memberMap.get(s.to.toString());
        return {
          from: from?.name || s.from.toString(),
          to: to?.name || s.to.toString(),
          amount: s.amount,
          note: s.note,
          createdAt: s.createdAt,
        };
      }),
    };

    if (savePath) {
      const filePath = resolve(savePath);
      await writeFile(filePath, JSON.stringify(jsonResult, null, 2), 'utf-8');
      return { savedTo: filePath, message: `JSON exported to ${filePath}` };
    }

    return jsonResult;
  }

  async importGroup(data: {
    name: string;
    members: Array<{ name: string; email?: string; nickname?: string }>;
    expenses?: Array<{
      description: string;
      amount: number;
      paidBy: string;
      participants: string[];
      splitType: 'equal' | 'exact' | 'percentage';
      splits?: Record<string, number>;
    }>;
  }) {
    // Create member documents
    const createdMembers: MemberDocument[] = [];
    for (const m of data.members) {
      const member = await this.memberRepo.create({
        name: m.name,
        email: m.email,
        nickname: m.nickname,
      });
      createdMembers.push(member);
    }

    // Create group with member references
    const group = await this.groupRepo.create({
      name: data.name,
      members: createdMembers.map((m) => m._id),
      isDeleted: false,
    });

    // Import expenses if provided
    let importedExpenses = 0;
    if (data.expenses) {
      for (const exp of data.expenses) {
        const payer = findMemberByName(createdMembers, exp.paidBy);
        if (!payer) continue;

        const participantIds = exp.participants
          .map((name) => findMemberByName(createdMembers, name))
          .filter(Boolean)
          .map((m) => m!._id);

        let splits: SplitEntry[] = [];
        if (exp.splitType === 'equal') {
          splits = calculateEqualSplits(exp.amount, participantIds);
        } else if (exp.splits) {
          for (const [name, amount] of Object.entries(exp.splits)) {
            const member = findMemberByName(createdMembers, name);
            if (member) {
              if (exp.splitType === 'percentage') {
                splits.push({
                  member: member._id,
                  amount: roundMoney((amount / 100) * exp.amount),
                });
              } else {
                splits.push({ member: member._id, amount });
              }
            }
          }
        }

        await this.expenseRepo.create({
          groupId: group._id,
          description: exp.description,
          amount: exp.amount,
          paidBy: payer._id,
          participants: participantIds,
          splitType: exp.splitType,
          splits,
          isDeleted: false,
        });

        importedExpenses++;
      }
    }

    return {
      id: group._id.toString(),
      name: group.name,
      membersImported: createdMembers.length,
      expensesImported: importedExpenses,
    };
  }

  private toCsv(
    memberMap: Map<string, MemberDocument>,
    expenses: ExpenseDocument[],
    settlements: SettlementDocument[],
  ): string {
    const lines: string[] = [];

    lines.push('Type,Description,Amount,PaidBy/From,To,SplitType,Date');

    for (const e of expenses) {
      const payer = memberMap.get(e.paidBy.toString());
      lines.push(
        `expense,${this.escapeCsv(e.description)},${e.amount},${this.escapeCsv(payer?.name || e.paidBy.toString())},,${e.splitType},${e.createdAt.toISOString()}`,
      );
    }

    for (const s of settlements) {
      const from = memberMap.get(s.from.toString());
      const to = memberMap.get(s.to.toString());
      lines.push(
        `settlement,Payment,${s.amount},${this.escapeCsv(from?.name || s.from.toString())},${this.escapeCsv(to?.name || s.to.toString())},,${s.createdAt.toISOString()}`,
      );
    }

    return lines.join('\n');
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
