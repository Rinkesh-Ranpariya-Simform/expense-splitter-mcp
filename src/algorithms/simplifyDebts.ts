import type { DebtTransaction } from '../types/index.js';
import { roundMoney } from '../utils/money.js';

/**
 * Simplifies debts using a greedy algorithm.
 * Computes net balances then matches biggest creditor with biggest debtor.
 * Time complexity: O(n log n)
 */
export function simplifyDebts(
  balances: Map<string, number>,
  nameMap: Map<string, string>,
): DebtTransaction[] {
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [id, balance] of balances) {
    const rounded = roundMoney(balance);
    if (rounded > 0) {
      creditors.push({ id, amount: rounded });
    } else if (rounded < 0) {
      debtors.push({ id, amount: Math.abs(rounded) });
    }
  }

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: DebtTransaction[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = roundMoney(Math.min(creditor.amount, debtor.amount));

    if (amount > 0) {
      transactions.push({
        from: debtor.id,
        fromName: nameMap.get(debtor.id) || debtor.id,
        to: creditor.id,
        toName: nameMap.get(creditor.id) || creditor.id,
        amount,
      });
    }

    creditor.amount = roundMoney(creditor.amount - amount);
    debtor.amount = roundMoney(debtor.amount - amount);

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  return transactions;
}
